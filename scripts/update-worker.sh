#!/bin/bash
# =============================================================
# update-worker.sh — REBUILD & RESTART WORKER ONLY
# Use when background job processor logic changed.
# =============================================================
set -e

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

echo ""
echo "⚙️   Rebuilding worker..."
$COMPOSE up -d --build worker
echo "✅  Worker updated"
echo ""
$COMPOSE ps worker
