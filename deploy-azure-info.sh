#!/bin/bash
# PeerSkills Azure Deployment Script - info@peerskillslab.ch
# Einmalig ausführen: bash deploy-azure-info.sh
# Danach für Updates: bash deploy-azure-info.sh update

set -e

RESOURCE_GROUP="peerskills-info-rg"
APP_NAME="peerskills-info-app"          # muss global eindeutig sein
LOCATION="switzerlandnorth"             # Azure-Rechenzentrum Zürich
PLAN_NAME="peerskills-info-plan"
ADMIN_EMAIL="info@peerskillslab.ch"
JWT_SECRET="$(openssl rand -hex 32)"    # sicheres Zufallspasswort

if [ "$1" = "update" ]; then
  echo "=== Update: Frontend bauen und deployen ==="
  cd peer-skills-lab-kurse && npm run build && cd ..
  cd server
  zip -r ../deploy.zip . -x "node_modules/*" -x "db/peerskills.db"
  cd ..
  az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src deploy.zip
  rm deploy.zip
  echo "=== Update abgeschlossen: https://$APP_NAME.azurewebsites.net ==="
  exit 0
fi

echo "=== PeerSkills Azure Deployment - $ADMIN_EMAIL ==="
echo ""
echo "Schritt 1: Resource Group erstellen"
az group create --name $RESOURCE_GROUP --location $LOCATION

echo ""
echo "Schritt 2: App Service Plan erstellen (B1 = ~15€/Monat)"
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

echo ""
echo "Schritt 3: Web App erstellen (Node.js 22)"
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --runtime "NODE:22-lts"

echo ""
echo "Schritt 4: Umgebungsvariablen setzen"
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    JWT_SECRET="$JWT_SECRET" \
    DB_PATH="/home/peerskills.db" \
    FRONTEND_ORIGIN="https://$APP_NAME.azurewebsites.net" \
    PORT=8080 \
    ADMIN_EMAIL="$ADMIN_EMAIL"

echo ""
echo "JWT_SECRET gespeichert: $JWT_SECRET"
echo "(Diesen Wert sicher aufbewahren!)"

echo ""
echo "Schritt 5: Persistenten Speicher aktivieren (/home bleibt bei Restarts)"
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --generic-configurations '{"WEBSITES_ENABLE_APP_SERVICE_STORAGE": "true"}'

echo ""
echo "Schritt 6: Frontend bauen"
cd peer-skills-lab-kurse && npm install && npm run build && cd ..

echo ""
echo "Schritt 7: Code zippen und deployen"
cd server
zip -r ../deploy.zip . -x "node_modules/*" -x "db/peerskills.db"
cd ..
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src deploy.zip
rm deploy.zip

echo ""
echo "=========================================="
echo "✅ Deployment abgeschlossen!"
echo "=========================================="
echo ""
echo "App URL: https://$APP_NAME.azurewebsites.net"
echo "Admin Email: $ADMIN_EMAIL"
echo ""
echo "Nächste Schritte:"
echo "1. SSH verbinden:"
echo "   az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "2. Admin-Passwort setzen (im SSH Terminal):"
echo "   node create-admin.js $ADMIN_EMAIL 'Dein Name' 'passwort123'"
echo ""
echo "3. App testen:"
echo "   https://$APP_NAME.azurewebsites.net"
echo ""
