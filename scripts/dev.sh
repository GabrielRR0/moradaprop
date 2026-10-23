#!/usr/bin/env sh
# Levanta el proyecto. Uso:
#   ./scripts/dev.sh          -> todo (db, redis, mailpit, api, web)
#   ./scripts/dev.sh api      -> solo la API (y sus dependencias)
#   ./scripts/dev.sh web      -> solo la web
#   ./scripts/dev.sh db       -> solo db + redis + mailpit
#   ./scripts/dev.sh stop     -> detiene todo
set -e
cd "$(dirname "$0")/.."

case "${1:-all}" in
  all)  docker compose up ;;
  api)  docker compose up api ;;
  web)  docker compose up web ;;
  db)   docker compose up db redis mailpit ;;
  stop) docker compose down ;;
  *)    echo "Opciones: all | api | web | db | stop"; exit 1 ;;
esac
