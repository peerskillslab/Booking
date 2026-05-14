#!/bin/bash
# PeerSkills → Azure Container Apps
# Einmalig: bash deploy-azure-docker.sh
# Update:   bash deploy-azure-docker.sh update

set -e

# ── Konfiguration ────────────────────────────────────────────────
RESOURCE_GROUP="peerskills-rg"
LOCATION="switzerlandnorth"          # Rechenzentrum Zürich
ACR_NAME="peerskillsregistry"        # muss global eindeutig sein (nur Kleinbuchstaben)
APP_NAME="peerskills"
ENVIRONMENT="peerskills-env"
STORAGE_ACCOUNT="peerskillsstorage"  # muss global eindeutig sein
FILE_SHARE="peerskillsdb"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
# ────────────────────────────────────────────────────────────────

if [ "$1" = "update" ]; then
  echo "=== Image neu bauen und pushen ==="
  az acr login --name $ACR_NAME
  docker build -t $ACR_NAME.azurecr.io/$APP_NAME:latest .
  docker push $ACR_NAME.azurecr.io/$APP_NAME:latest

  echo "=== Container App aktualisieren ==="
  az containerapp update \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --image $ACR_NAME.azurecr.io/$APP_NAME:latest
  echo "=== Update fertig ==="
  exit 0
fi

echo "=== 1. Resource Group ==="
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "=== 2. Container Registry erstellen ==="
az acr create \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku Basic \
  --admin-enabled true

echo "=== 3. Docker Image bauen und in ACR hochladen ==="
az acr login --name $ACR_NAME
docker build -t $ACR_NAME.azurecr.io/$APP_NAME:latest .
docker push $ACR_NAME.azurecr.io/$APP_NAME:latest

echo "=== 4. Storage Account + File Share für SQLite ==="
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

STORAGE_KEY=$(az storage account keys list \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query "[0].value" -o tsv)

az storage share create \
  --name $FILE_SHARE \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY

echo "=== 5. Container Apps Environment ==="
az containerapp env create \
  --name $ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

echo "=== 6. Azure Files in Environment einbinden ==="
az containerapp env storage set \
  --name $ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --storage-name peerskillsstorage \
  --azure-file-account-name $STORAGE_ACCOUNT \
  --azure-file-account-key $STORAGE_KEY \
  --azure-file-share-name $FILE_SHARE \
  --access-mode ReadWrite

echo "=== 7. ACR-Zugangsdaten holen ==="
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

echo "=== 8. Container App deployen ==="
az containerapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image $ACR_NAME.azurecr.io/$APP_NAME:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3001 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 1 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
      NODE_ENV=production \
      JWT_SECRET="$JWT_SECRET" \
      DB_PATH="/data/peerskills.db" \
      PORT=3001 \
  --volume-mounts peerskillsstorage:/data

APP_URL=$(az containerapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "properties.configuration.ingress.fqdn" -o tsv)

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "  App läuft auf: https://$APP_URL"
echo "  JWT_SECRET:    $JWT_SECRET"
echo "  (JWT_SECRET sicher aufbewahren!)"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Admin anlegen:"
echo "  az containerapp exec --name $APP_NAME --resource-group $RESOURCE_GROUP \\"
echo "    --command 'node create-admin.js admin@beispiel.ch \"Name\" passwort'"
