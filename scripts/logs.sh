#!/bin/bash
# =============================================================
# logs.sh — VIEW PRODUCTION LOGS
#
# Usage:
#   All services:      bash scripts/logs.sh
#   Specific service:  bash scripts/logs.sh backend
#   Available:         backend | frontend | worker | mysql | redis | caddy
# =============================================================

COMPOSE="docker compose -f docker-compose.prod.yml"
SERVICE="${1:-}"

echo ""
if [ -z "$SERVICE" ]; then
  echo "📋  Streaming logs from ALL services (Ctrl+C to stop)..."
  echo ""
  $COMPOSE logs -f --tail=50
else
  echo "📋  Streaming logs from: $SERVICE (Ctrl+C to stop)..."
  echo ""
  $COMPOSE logs -f --tail=100 "$SERVICE"
fi
