#!/bin/bash
# PeerSkills → Azure Container Apps + Azure PostgreSQL
# Erstdeploy:  bash deploy-azure-local.sh
# Update:      bash deploy-azure-local.sh update
#
# Das Image wird LOKAL als linux/amd64 gebaut (Docker Desktop nötig) und in die
# ACR-Registry gepusht – ACR Tasks (az acr build) ist in dieser Subscription
# nicht erlaubt, das Erstellen/Pushen einer Registry aber schon.
# Voraussetzung: az login als joergbieri@hotmail.com, Docker Desktop läuft.

set -e

# ── Konfiguration ─────────────────────────────────────────────────────────────
SUBSCRIPTION_ID="aa7d0f6e-5ec1-4ef8-919a-d193e971b695"
RESOURCE_GROUP="peerskills-rg"
LOCATION="westeurope"                  # Region der bestehenden Resource Group
WORKLOAD_LOCATION="swedencentral"      # PostgreSQL + Container Apps:
                                       # - westeurope: PG-Provisionierung in dieser Subscription
                                       #   gesperrt, AKS/Container Apps ohne Kapazität
                                       # - northeurope: InternalServerError bei PG B1ms
                                       # - swedencentral: funktioniert
ACR_NAME="peerskillsreg7454"
APP_NAME="peerskills"
ENVIRONMENT="peerskills-env"
PG_SERVER="peerskills-pg-aa7d0f-v3"
PG_DB="peerskills"
PG_USER="psadmin"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
# ──────────────────────────────────────────────────────────────────────────────

echo "=== Subscription setzen ==="
az account set --subscription "$SUBSCRIPTION_ID"

# Image lokal für linux/amd64 bauen und direkt in die Registry pushen.
# WICHTIG: --platform linux/amd64, da Container Apps kein arm64 unterstützt
# (auf Apple Silicon läuft der Build über Emulation und dauert länger).
build_and_push() {
  local TAG="$1"
  echo "=== Login an Registry $ACR_NAME ==="
  az acr login --name $ACR_NAME

  echo "=== Docker Image lokal bauen (linux/amd64) und pushen ==="
  docker buildx build \
    --platform linux/amd64 \
    --tag "$ACR_NAME.azurecr.io/$APP_NAME:$TAG" \
    --tag "$ACR_NAME.azurecr.io/$APP_NAME:latest" \
    --push \
    .
}

# ── Update-Modus ──────────────────────────────────────────────────────────────
if [ "$1" = "update" ]; then
  TAG="$(date +%Y%m%d-%H%M)"
  build_and_push "$TAG"

  echo "=== Container App aktualisieren ==="
  az containerapp update \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --image "$ACR_NAME.azurecr.io/$APP_NAME:$TAG"

  APP_URL=$(az containerapp show \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)
  echo "=== Update abgeschlossen: https://$APP_URL ==="
  exit 0
fi

# ── Erstdeploy ────────────────────────────────────────────────────────────────

echo "=== 1/10  Resource Group sicherstellen ==="
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

echo "=== 2/10  Container Registry sicherstellen ==="
az acr create \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku Basic \
  --admin-enabled true

echo "=== 3/10  Image lokal bauen und pushen ==="
build_and_push "latest"

echo "=== 4/10  PostgreSQL Flexible Server erstellen (~2-5 Min) ==="
PG_PASSWORD="PsSkills@$(openssl rand -hex 10)1!"
if az postgres flexible-server show --name $PG_SERVER --resource-group $RESOURCE_GROUP &>/dev/null; then
  echo "Server existiert bereits – Admin-Passwort wird auf den neuen Wert gesetzt"
  az postgres flexible-server update \
    --name $PG_SERVER \
    --resource-group $RESOURCE_GROUP \
    --admin-password "$PG_PASSWORD"
else
  az postgres flexible-server create \
    --name $PG_SERVER \
    --resource-group $RESOURCE_GROUP \
    --location $WORKLOAD_LOCATION \
    --admin-user $PG_USER \
    --admin-password "$PG_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --storage-size 32 \
    --version 16 \
    --yes
fi

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
  --location $WORKLOAD_LOCATION

echo "=== 8/10  ACR-Zugangsdaten holen ==="
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# DATABASE_URL zusammensetzen (Passwort URL-kodieren, da Sonderzeichen möglich)
PG_PW_ENC=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$PG_PASSWORD")
DATABASE_URL="postgresql://${PG_USER}:${PG_PW_ENC}@${PG_SERVER}.postgres.database.azure.com/${PG_DB}?sslmode=require"

echo "=== 9/10  Container App erstellen ==="
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

# Basis-URL für Links in E-Mails (z.B. Passwort-Reset) setzen –
# erst jetzt möglich, da die FQDN vor dem Erstellen nicht bekannt ist
az containerapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars "APP_BASE_URL=https://$APP_URL"

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
echo "  bash deploy-azure-local.sh update"
