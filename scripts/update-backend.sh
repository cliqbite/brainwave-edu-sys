#!/bin/bash
# =============================================================
# update-backend.sh — REBUILD & RESTART BACKEND + RUN MIGRATIONS
# Use when API / backend logic changed.
# =============================================================
set -e

COMPOSE="docker compose -f docker-compose.prod.yml"

echo ""
echo "⚙️   Rebuilding backend..."
$COMPOSE up -d --build backend

echo ""
echo "🗄️   Running pending migrations..."
$COMPOSE exec -T backend npx prisma migrate deploy
echo "✅  Backend updated + migrations applied"
echo ""
$COMPOSE ps backend
