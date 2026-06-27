#!/bin/bash
# =============================================================
# update.sh — UPDATE ALL SERVICES (full redeploy)
# Run after: git pull origin main
# =============================================================
set -e

COMPOSE="docker compose -f docker-compose.prod.yml"

echo ""
echo "======================================================"
echo "  Brainwave EduSys — Update All Services"
echo "======================================================"
echo ""

# ── Step 1: Pull latest code ──────────────────────────────
echo "📥  Pulling latest code from git..."
git pull origin main
echo "✅  Code updated"

# ── Step 2: Rebuild and restart all containers ─────────────
echo ""
echo "📦  Rebuilding and restarting all containers..."
$COMPOSE up -d --build
echo "✅  All containers restarted"

# ── Step 3: Run any pending migrations ────────────────────
echo ""
echo "🗄️   Checking for pending database migrations..."
$COMPOSE exec -T backend npx prisma migrate deploy
echo "✅  Migrations up to date"

# ── Step 4: Status ────────────────────────────────────────
echo ""
echo "======================================================"
echo "  Update Complete!"
echo "======================================================"
$COMPOSE ps
echo ""
