#!/bin/bash
# =============================================================
# migrate-db.sh — RUN PENDING DATABASE MIGRATIONS IN PRODUCTION
# Safe to run multiple times — only applies unapplied migrations.
# =============================================================
set -e

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

echo ""
echo "🗄️   Running pending database migrations..."
$COMPOSE exec -T backend npx prisma migrate deploy
echo ""
echo "✅  Done. All migrations applied."
