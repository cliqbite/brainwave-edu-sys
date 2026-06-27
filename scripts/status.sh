#!/bin/bash
# =============================================================
# status.sh — CHECK STATUS OF ALL PRODUCTION SERVICES
# =============================================================

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

echo ""
echo "======================================================"
echo "  Brainwave EduSys — Service Status"
echo "======================================================"
echo ""
$COMPOSE ps
echo ""
echo "======================================================"
echo "  Resource Usage"
echo "======================================================"
docker stats --no-stream \
  brainwave-mysql \
  brainwave-redis \
  brainwave-backend \
  brainwave-worker \
  brainwave-frontend \
  brainwave-caddy \
  2>/dev/null || true
echo ""
