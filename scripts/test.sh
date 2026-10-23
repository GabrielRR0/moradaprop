#!/usr/bin/env sh
# Corre los tests. Uso:
#   ./scripts/test.sh               -> todos
#   ./scripts/test.sh api           -> solo la API
#   ./scripts/test.sh web           -> solo la web
#   ./scripts/test.sh module auth   -> solo un modulo de la API
#   ./scripts/test.sh e2e           -> end-to-end de la API
set -e
cd "$(dirname "$0")/.."

case "${1:-all}" in
  all)    pnpm test ;;
  api)    pnpm test:api ;;
  web)    pnpm test:web ;;
  e2e)    pnpm test:e2e ;;
  module) [ -n "$2" ] || { echo "Uso: ./scripts/test.sh module <nombre>"; exit 1; }
          pnpm test:module "$2" ;;
  *)      echo "Opciones: all | api | web | e2e | module <nombre>"; exit 1 ;;
esac
