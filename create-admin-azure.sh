#!/bin/bash
# Admin-User in der Azure-Deployment anlegen
# Verwendung: bash create-admin-azure.sh <email> <"Vor Name"> <passwort>
#
# Beispiel:
#   bash create-admin-azure.sh simon@beispiel.ch "Simon Schneider" meinPasswort123

set -e

EMAIL="$1"
FULLNAME="$2"
PASSWORD="$3"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Verwendung: bash create-admin-azure.sh <email> \"<Name>\" <passwort>"
  exit 1
fi

RESOURCE_GROUP="peerskills-rg"
ENVIRONMENT="peerskills-env"
ACR_NAME="peerskillsacr95fb9f"
JOB_NAME="create-admin-job"

echo "=== Admin-User anlegen: $EMAIL ==="

ACR_PASSWORD=$(az acr credential show \
  --name $ACR_NAME --query "passwords[0].value" -o tsv 2>/dev/null)

DB_PW=$(cat /tmp/peerskills-db-pw.txt)
DB_PW_ENC=$(python3 -c \
  "import urllib.parse; print(urllib.parse.quote(open('/tmp/peerskills-db-pw.txt').read().strip(), safe=''))")
DB_URL="postgresql://psadmin:${DB_PW_ENC}@peerskills-pg-95fb9f.postgres.database.azure.com/peerskills?sslmode=require"

# Job erstellen falls noch nicht vorhanden, sonst vorhandenen löschen und neu erstellen
if az containerapp job show --name $JOB_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
  az containerapp job delete --name $JOB_NAME --resource-group $RESOURCE_GROUP --yes 2>/dev/null
fi

az containerapp job create \
  --name $JOB_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT \
  --image "$ACR_NAME.azurecr.io/peerskills:latest" \
  --registry-server "$ACR_NAME.azurecr.io" \
  --registry-username "$ACR_NAME" \
  --registry-password "$ACR_PASSWORD" \
  --trigger-type Manual \
  --replica-timeout 120 \
  --replica-retry-limit 0 \
  --parallelism 1 \
  --replica-completion-count 1 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars "DATABASE_URL=secretref:db-url" "NODE_ENV=production" \
  --secrets "db-url=$DB_URL" \
  --command "node" \
  --args "create-admin.js" "$EMAIL" "$FULLNAME" "$PASSWORD" \
  --query "name" -o tsv 2>/dev/null

EXECUTION=$(az containerapp job start \
  --name $JOB_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "name" -o tsv 2>/dev/null)
echo "Job gestartet: $EXECUTION"

echo "Warte auf Abschluss..."
for i in $(seq 1 24); do
  STATUS=$(az containerapp job execution show \
    --name $JOB_NAME \
    --resource-group $RESOURCE_GROUP \
    --job-execution-name "$EXECUTION" \
    --query "properties.status" -o tsv 2>/dev/null)
  if [ "$STATUS" = "Succeeded" ]; then
    echo "✓ User $EMAIL erfolgreich angelegt / aktualisiert."
    break
  elif [ "$STATUS" = "Failed" ]; then
    echo "✗ Job fehlgeschlagen. Logs prüfen:"
    echo "  az containerapp job execution show --name $JOB_NAME --resource-group $RESOURCE_GROUP --job-execution-name $EXECUTION"
    exit 1
  fi
  sleep 5
done

echo ""
echo "Login testen:"
curl -s -X POST \
  "https://peerskills.proudisland-e4272adc.switzerlandnorth.azurecontainerapps.io/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('✓ Login OK – Rolle:', d['user']['role'])" \
  2>/dev/null || echo "✗ Login fehlgeschlagen"
