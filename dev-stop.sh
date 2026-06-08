#!/bin/zsh
ROOT="$(cd "$(dirname "$0")" && pwd)"
PIDFILE="$ROOT/.dev-pids"

if [ ! -f "$PIDFILE" ]; then
  echo "Kein laufender Dev-Server gefunden."
  exit 0
fi

read BACKEND_PID FRONTEND_PID < "$PIDFILE"

kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null && echo "Gestoppt." || echo "Prozesse bereits beendet."
rm -f "$PIDFILE"
