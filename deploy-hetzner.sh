#!/bin/bash
# PeerSkills → Hetzner Cloud
#
# Voraussetzung: Hetzner VPS bereits erstellt (hetzner.com → Cloud → Server → Add Server)
#   Empfehlung: CX21 (2 vCPU, 4GB RAM, Ubuntu 24.04) → ~€6/Monat
#
# Einmalig:  bash deploy-hetzner.sh setup SERVER_IP
# Update:    bash deploy-hetzner.sh update SERVER_IP

set -e

COMMAND=${1:-"help"}
SERVER_IP=${2:-""}
SSH_USER="root"
APP_DIR="/opt/peerskills"

if [ -z "$SERVER_IP" ]; then
  echo "Verwendung:"
  echo "  bash deploy-hetzner.sh setup  SERVER_IP   # Erstinstallation"
  echo "  bash deploy-hetzner.sh update SERVER_IP   # Update nach Code-Änderung"
  exit 1
fi

SSH="ssh -o StrictHostKeyChecking=accept-new $SSH_USER@$SERVER_IP"

# ── SETUP: Docker auf Server installieren + App deployen ─────────
if [ "$COMMAND" = "setup" ]; then

  echo "=== 1. Docker auf Server installieren ==="
  $SSH << 'ENDSSH'
apt-get update -qq
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -qq
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker
echo "Docker installiert: $(docker --version)"
ENDSSH

  echo "=== 2. Image lokal bauen ==="
  docker build -t peerskills:latest .

  echo "=== 3. Image auf Server übertragen (docker save | ssh) ==="
  echo "    (Das dauert 1-2 Minuten je nach Internetverbindung...)"
  docker save peerskills:latest | gzip | $SSH "gunzip | docker load"

  echo "=== 4. docker-compose.yml + .env auf Server kopieren ==="
  $SSH "mkdir -p $APP_DIR/data"
  scp docker-compose.yml $SSH_USER@$SERVER_IP:$APP_DIR/docker-compose.yml

  # JWT Secret generieren und .env auf Server anlegen
  JWT=$(openssl rand -hex 32)
  $SSH "cat > $APP_DIR/.env << EOF
JWT_SECRET=$JWT
EOF"
  echo "JWT_SECRET: $JWT  ← sicher aufbewahren!"

  echo "=== 5. Container starten ==="
  $SSH "cd $APP_DIR && docker compose up -d"

  echo "=== 6. Firewall: Port 80 und 443 öffnen ==="
  $SSH "ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw allow 3001 && ufw --force enable"

  echo ""
  echo "╔══════════════════════════════════════════════╗"
  echo "  App läuft auf: http://$SERVER_IP:3001"
  echo "╚══════════════════════════════════════════════╝"
  echo ""
  echo "Admin anlegen:"
  echo "  bash deploy-hetzner.sh admin $SERVER_IP joergbieri@hotmail.com 'Joerg Bieri' dasistgeheim"
  echo ""
  echo "HTTPS einrichten (nach Domain-Zuweisung):"
  echo "  bash deploy-hetzner.sh https $SERVER_IP ihre-domain.ch"

# ── UPDATE: neues Image bauen und deployen ───────────────────────
elif [ "$COMMAND" = "update" ]; then

  echo "=== Image neu bauen ==="
  docker build -t peerskills:latest .

  echo "=== Image übertragen ==="
  docker save peerskills:latest | gzip | $SSH "gunzip | docker load"

  echo "=== Container neu starten ==="
  $SSH "cd $APP_DIR && docker compose up -d --force-recreate"
  echo "=== Update fertig ==="

# ── ADMIN: Nutzer anlegen ────────────────────────────────────────
elif [ "$COMMAND" = "admin" ]; then

  EMAIL=${3:-""}
  NAME=${4:-"Admin"}
  PASS=${5:-""}
  if [ -z "$EMAIL" ] || [ -z "$PASS" ]; then
    echo "Verwendung: bash deploy-hetzner.sh admin SERVER_IP email 'Name' passwort"
    exit 1
  fi
  $SSH "cd $APP_DIR && docker compose exec peerskills node create-admin.js '$EMAIL' '$NAME' '$PASS'"

# ── HTTPS: nginx + Let's Encrypt einrichten ──────────────────────
elif [ "$COMMAND" = "https" ]; then

  DOMAIN=${3:-""}
  if [ -z "$DOMAIN" ]; then
    echo "Verwendung: bash deploy-hetzner.sh https SERVER_IP ihre-domain.ch"
    exit 1
  fi

  $SSH << ENDSSH
apt-get install -y nginx certbot python3-certbot-nginx

cat > /etc/nginx/sites-available/peerskills << 'EOF'
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/peerskills /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN
echo "HTTPS aktiv auf https://$DOMAIN"
ENDSSH

fi
