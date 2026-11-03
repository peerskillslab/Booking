# ---- Stage 1: Frontend bauen ----
FROM node:23-alpine AS frontend-builder

WORKDIR /build/frontend
COPY peer-skills-lab-kurse/ ./
RUN npm install

# Produktions-API-URL: relativ, damit der Container überall funktioniert
ENV VITE_API_BASE_URL=/api
RUN npm run build

# ---- Stage 2: Production Image ----
FROM node:23-alpine

RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Server-Abhängigkeiten installieren
COPY server/package*.json ./
RUN npm ci --omit=dev

# Server-Code kopieren
COPY server/ ./

# Gebautes Frontend (inkl. Bilder aus peer-skills-lab-kurse/public) in den
# Server-Ordner kopieren. Express serviert es aus /app/public (siehe index.js).
COPY --from=frontend-builder /build/frontend/dist ./public

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "index.js"]
