#!/bin/bash
# PeerSkills → Azure Container Apps + Azure PostgreSQL
# Erstdeploy:  bash deploy-azure-docker.sh
# Update:      bash deploy-azure-docker.sh update
#
# Kein lokaler Docker-Daemon nötig – das Image wird direkt in Azure gebaut (az acr build).
# Voraussetzung: az login ausgeführt, az containerapp Extension installiert.

set -e

# ── Konfiguration ─────────────────────────────────────────────────────────────
RESOURCE_GROUP="peerskills-rg"
LOCATION="switzerlandnorth"            # Rechenzentrum Zürich
ACR_NAME="peerskillsacr95fb9f"
APP_NAME="peerskills"
ENVIRONMENT="peerskills-env"
PG_SERVER="peerskills-pg-95fb9f"
PG_DB="peerskills"
PG_USER="psadmin"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
# ──────────────────────────────────────────────────────────────────────────────

# ── Update-Modus ──────────────────────────────────────────────────────────────
if [ "$1" = "update" ]; then
  echo "=== Image in ACR neu bauen ==="
  az acr build \
    --registry $ACR_NAME \
    --image $APP_NAME:latest \
    --resource-group $RESOURCE_GROUP \
    .

  echo "=== Container App aktualisieren ==="
  az containerapp update \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --image "$ACR_NAME.azurecr.io/$APP_NAME:latest"

  APP_URL=$(az containerapp show \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)
  echo "=== Update abgeschlossen: https://$APP_URL ==="
  exit 0
fi

# ── Erstdeploy ────────────────────────────────────────────────────────────────

echo "=== 1/10  Resource Group erstellen ==="
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

echo "=== 2/10  Container Registry erstellen ==="
az acr create \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku Basic \
  --admin-enabled true

echo "=== 3/10  Docker Image in ACR bauen (kein lokaler Docker nötig) ==="
az acr build \
  --registry $ACR_NAME \
  --image $APP_NAME:latest \
  --resource-group $RESOURCE_GROUP \
  .

echo "=== 4/10  PostgreSQL Flexible Server erstellen (~2-5 Min) ==="
PG_PASSWORD="PsSkills@$(openssl rand -hex 10)1!"
az postgres flexible-server create \
  --name $PG_SERVER \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $PG_USER \
  --admin-password "$PG_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --yes

echo "=== 5/10  Datenbank erstellen ==="
az postgres flexible-server db create \
  --server-name $PG_SERVER \
  --resource-group $RESOURCE_GROUP \
  --database-name $PG_DB

echo "=== 6/10  PostgreSQL-Firewall für Azure-Dienste öffnen ==="
az postgres flexible-server firewall-rule create \
  --name $PG_SERVER \
  --resource-group $RESOURCE_GROUP \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

echo "=== 7/10  Container Apps Environment erstellen ==="
az containerapp env create \
  --name $ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

echo "=== 8/10  ACR-Zugangsdaten holen ==="
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# DATABASE_URL zusammensetzen (Passwort URL-kodieren, da Sonderzeichen möglich)
PG_PW_ENC=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$PG_PASSWORD")
DATABASE_URL="postgresql://${PG_USER}:${PG_PW_ENC}@${PG_SERVER}.postgres.database.azure.com/${PG_DB}?sslmode=require"

echo "=== 9/10  Container App erstellen ==="
# --image muss in Anführungszeichen übergeben werden, damit der Doppelpunkt im
# Tag nicht vom CLI fehlinterpretiert wird.
az containerapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image "$ACR_NAME.azurecr.io/$APP_NAME:latest" \
  --registry-server "$ACR_NAME.azurecr.io" \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 3001 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 1 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
      "NODE_ENV=production" \
      "PORT=3001" \
      "JWT_SECRET=secretref:jwt-secret" \
      "DATABASE_URL=secretref:db-url" \
  --secrets \
      "jwt-secret=$JWT_SECRET" \
      "db-url=$DATABASE_URL"

echo "=== 10/10  URL abrufen ==="
APP_URL=$(az containerapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  App läuft auf: https://${APP_URL}"
echo "║"
echo "║  JWT_SECRET:    ${JWT_SECRET}"
echo "║  PG_PASSWORD:   ${PG_PASSWORD}"
echo "║  (Beide Werte sicher aufbewahren!)"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Admin anlegen:"
echo "  az containerapp exec --name $APP_NAME --resource-group $RESOURCE_GROUP \\"
echo "    --command \"node create-admin.js admin@beispiel.ch 'Name' passwort\""
echo ""
echo "Nächstes Code-Update deployen:"
echo "  bash deploy-azure-docker.sh update"
