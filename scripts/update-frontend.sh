#!/bin/bash
# =============================================================
# update-frontend.sh — REBUILD & RESTART FRONTEND ONLY
# Faster than full update when only UI changed.
# =============================================================
set -e

COMPOSE="docker compose -f docker-compose.prod.yml"

echo ""
echo "🖥️   Rebuilding frontend..."
$COMPOSE up -d --build frontend
echo "✅  Frontend updated"
echo ""
$COMPOSE ps frontend
