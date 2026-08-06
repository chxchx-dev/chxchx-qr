#!/usr/bin/env bash
# E2E de la web: arranca la API (con CORS para el origen del dev server) y la
# web (Vite), espera a que respondan y ejecuta Playwright. Limpia al salir.
set -euo pipefail
cd "$(dirname "$0")/.."

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
nvm use 24 >/dev/null 2>&1 || true

# La API debe permitir el origen del dev server (CORS para el navegador).
export NODE_ENV=test
export PORT=4000
export WEB_ORIGIN=http://127.0.0.1:5173

# Archivos (Fase 05): activos y con la URL pública en el host del dev server.
export FILE_UPLOAD_ENABLED=true
export FILE_PUBLIC_BASE_URL=http://127.0.0.1:4000
export FILE_TEMP_DIR=$(mktemp -d)
# Web: el tipo "Archivo" solo aparece con este flag (web-config).
export VITE_FILE_UPLOAD_ENABLED=true

API_LOG=$(mktemp)
WEB_LOG=$(mktemp)
API_PID=""
WEB_PID=""

cleanup() {
  [ -n "$WEB_PID" ] && kill "$WEB_PID" >/dev/null 2>&1 || true
  [ -n "$API_PID" ] && kill "$API_PID" >/dev/null 2>&1 || true
  rm -f "$API_LOG" "$WEB_LOG"
  rm -rf "$FILE_TEMP_DIR"
}
trap cleanup EXIT

echo "[e2e] compilando paquetes…"
(cd ../../ && npm run build:packages) >/dev/null

echo "[e2e] arrancando API en :4000 (WEB_ORIGIN=$WEB_ORIGIN)…"
(cd ../../apps/api && npm run dev >"$API_LOG" 2>&1 </dev/null) &
API_PID=$!

echo "[e2e] arrancando web en :5173…"
npm run dev >"$WEB_LOG" 2>&1 </dev/null &
WEB_PID=$!

echo "[e2e] esperando a los servidores…"
for _ in $(seq 1 60); do
  API_OK=$(curl -s -m 1 -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/health/live || true)
  WEB_OK=$(curl -s -m 1 -o /dev/null -w '%{http_code}' http://127.0.0.1:5173/ || true)
  if [ "$API_OK" = "200" ] && [ "$WEB_OK" = "200" ]; then
    break
  fi
  sleep 1
done
if [ "$API_OK" != "200" ] || [ "$WEB_OK" != "200" ]; then
  echo "[e2e] los servidores no respondieron (api=$API_OK web=$WEB_OK)" >&2
  echo "--- log api ---" >&2
  tail -20 "$API_LOG" >&2 || true
  echo "--- log web ---" >&2
  tail -20 "$WEB_LOG" >&2 || true
  exit 1
fi

echo "[e2e] ejecutando Playwright…"
npx playwright test
