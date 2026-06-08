#!/bin/zsh
ROOT="$(cd "$(dirname "$0")" && pwd)"
PIDFILE="$ROOT/.dev-pids"

BACKEND_PORT=3001
FRONTEND_PORT=5173

# ── Bereits laufend? ──────────────────────────────────────────────────────────
if [ -f "$PIDFILE" ]; then
  echo "Dev server läuft bereits (PIDs in $PIDFILE). Zuerst dev-stop.sh ausführen."
  exit 1
fi

# ── Port-Konflikte prüfen ─────────────────────────────────────────────────────
check_port() {
  local port=$1
  local name=$2
  if lsof -iTCP:$port -sTCP:LISTEN -t &>/dev/null; then
    echo "FEHLER: Port $port ($name) wird bereits verwendet."
    echo "  Prozess: $(lsof -iTCP:$port -sTCP:LISTEN -n -P | awk 'NR==2 {print $1, "(PID "$2")"}')"
    exit 1
  fi
}

check_port $BACKEND_PORT  "Backend"
check_port $FRONTEND_PORT "Frontend"

# ── .env prüfen ───────────────────────────────────────────────────────────────
if [ ! -f "$ROOT/server/.env" ]; then
  echo "FEHLER: server/.env fehlt. Vorlage:"
  echo "  DATABASE_URL=postgresql://..."
  echo "  JWT_SECRET=..."
  echo "  PORT=3001"
  exit 1
fi

# ── Backend starten ───────────────────────────────────────────────────────────
echo "Backend starten  (Port $BACKEND_PORT)..."
cd "$ROOT/server"
npm run dev &> "$ROOT/.backend.log" &
BACKEND_PID=$!

# ── Frontend starten ──────────────────────────────────────────────────────────
echo "Frontend starten (Port $FRONTEND_PORT)..."
cd "$ROOT/peer-skills-lab-kurse"
npm run dev &> "$ROOT/.frontend.log" &
FRONTEND_PID=$!

echo "$BACKEND_PID $FRONTEND_PID" > "$PIDFILE"

# ── Kurz warten und prüfen ob Prozesse noch laufen ───────────────────────────
sleep 2
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "FEHLER: Backend ist sofort abgestürzt. Log:"
  tail -20 "$ROOT/.backend.log"
  kill $FRONTEND_PID 2>/dev/null
  rm -f "$PIDFILE"
  exit 1
fi
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo "FEHLER: Frontend ist sofort abgestürzt. Log:"
  tail -20 "$ROOT/.frontend.log"
  kill $BACKEND_PID 2>/dev/null
  rm -f "$PIDFILE"
  exit 1
fi

echo ""
echo "Backend:  http://localhost:$BACKEND_PORT  (Log: .backend.log)"
echo "Frontend: http://localhost:$FRONTEND_PORT  (Log: .frontend.log)"
echo "Stoppen:  ./dev-stop.sh"
