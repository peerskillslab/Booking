# PeerSkills Deployment auf Hetzner

Schritt-für-Schritt Anleitung zum Deployen auf einem Hetzner VPS (z.B. CX33).

## 📋 Voraussetzungen

- Hetzner VPS (mindestens CX33: 4 vCPU, 8GB RAM, 80GB SSD)
- IPv4 Adresse (inklusive)
- Zugang zu SSH als root
- Domain (optional aber empfohlen)

## 🚀 Server Setup

### 1. SSH verbinden
```bash
ssh root@your-server-ip
```

### 2. System updaten
```bash
apt update && apt upgrade -y
```

### 3. Docker installieren
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker root
```

### 4. Docker Compose installieren
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 5. Repository klonen
```bash
cd /opt
git clone https://github.com/peerskillslab/Booking.git peerskills
cd peerskills
```

### 6. Environment Variablen setzen
```bash
cp .env.example .env
nano .env
```

**Wichtig:** Folgende Werte setzen:
```env
DB_PASSWORD=<sicheres-passwort-generieren>
JWT_SECRET=<zufalliger-string>
NODE_ENV=production
```

Passwort generieren:
```bash
openssl rand -base64 32
```

### 7. Docker Images bauen und starten
```bash
docker-compose up -d
```

Das startet:
- PostgreSQL (Port 5432, intern)
- PeerSkills App (Port 3001)

### 8. Status überprüfen
```bash
docker-compose ps
docker-compose logs -f peerskills
```

Die App sollte erreichbar sein unter: `http://your-server-ip:3001`

## 🌐 Domain Setup (Optional)

### Mit Nginx Reverse Proxy und Let's Encrypt SSL

#### 1. Nginx installieren
```bash
apt install nginx certbot python3-certbot-nginx -y
```

#### 2. Nginx Config erstellen
```bash
nano /etc/nginx/sites-available/peerskills
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. Config aktivieren
```bash
ln -s /etc/nginx/sites-available/peerskills /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 4. SSL Zertifikat
```bash
certbot --nginx -d your-domain.com
```

Certbot configured Nginx automatisch mit HTTPS.

## 📊 Monitoring

### Logs anschauen
```bash
docker-compose logs -f peerskills
docker-compose logs -f postgres
```

### Container neustarten
```bash
docker-compose restart peerskills
```

### Alles neu bauen (nach Code-Änderungen)
```bash
git pull
docker-compose down
docker-compose up -d --build
```

## 🔐 Sicherheit

- ✅ Firewall: Nur SSH (22), HTTP (80), HTTPS (443) freigeben
```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

- ✅ PostgreSQL: Nur intern erreichbar (Port 5432 nicht public)
- ✅ JWT_SECRET: Starke, zufällige Werte nutzen
- ✅ HTTPS: Immer mit Let's Encrypt verwenden
- ✅ Backups: Regelmäßig Postgres-Backups erstellen

### Database Backup
```bash
docker-compose exec postgres pg_dump -U peerskills peerskills > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore
```bash
docker-compose exec -T postgres psql -U peerskills peerskills < backup_file.sql
```

## 💡 Tipps

- Nutze `docker-compose logs -f` um Live-Logs zu sehen
- Für Updates: `git pull && docker-compose up -d --build`
- Speicher erhöhen wenn viele User: Upgrade auf CX43 oder größer
- DB Backups sollten automatisiert werden (cron job)

## 🆘 Troubleshooting

**App startet nicht:**
```bash
docker-compose logs peerskills
```

**DB Fehler:**
```bash
docker-compose logs postgres
```

**Port schon in Nutzung:**
```bash
netstat -tulpn | grep 3001
kill -9 <pid>
```

**Container löschen und neu starten:**
```bash
docker-compose down -v  # löscht auch Volumes!
docker-compose up -d --build
```

---

**Support:** Bei Fragen GitHub Issues öffnen oder lokal testen mit `docker-compose up -d`
