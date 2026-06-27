#!/bin/bash
# =============================================================
# deploy.sh — INITIAL PRODUCTION DEPLOYMENT
# Run this ONCE on a fresh server.
# =============================================================
set -e

COMPOSE="docker compose -f docker-compose.prod.yml"

echo ""
echo "======================================================"
echo "  Brainwave EduSys — Initial Production Deployment"
echo "======================================================"
echo ""

# ── Step 1: Check .env.production exists ──────────────────
if [ ! -f ".env.production" ]; then
  echo "❌  ERROR: .env.production file not found."
  echo "   Create it by copying the template:"
  echo "   cp .env.production.example .env.production"
  echo "   Then fill in all the values and re-run this script."
  exit 1
fi
echo "✅  .env.production found"

# ── Step 2: Check Docker is running ───────────────────────
if ! docker info > /dev/null 2>&1; then
  echo "❌  ERROR: Docker is not running. Start Docker and try again."
  exit 1
fi
echo "✅  Docker is running"

# ── Step 3: Build and start all containers ─────────────────
echo ""
echo "📦  Building Docker images (this may take 3-5 minutes)..."
$COMPOSE up -d --build

# ── Step 4: Wait for MySQL to be healthy ──────────────────
echo ""
echo "⏳  Waiting for MySQL to be ready..."
until $COMPOSE exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
  printf "."
  sleep 3
done
echo ""
echo "✅  MySQL is ready"

# ── Step 5: Run database migrations ───────────────────────
echo ""
echo "🗄️   Running database migrations..."
$COMPOSE exec -T backend npx prisma migrate deploy
echo "✅  Migrations complete"

# ── Step 6: Seed the database ─────────────────────────────
echo ""
echo "🌱  Seeding database (roles, permissions, master user)..."
$COMPOSE exec -T backend npx prisma db seed
echo "✅  Seed complete"

# ── Step 7: Final status ──────────────────────────────────
echo ""
echo "======================================================"
echo "  Deployment Complete!"
echo "======================================================"
$COMPOSE ps
echo ""
echo "👉  Visit your site at the domain configured in .env.production"
echo "👉  SSL certificate will be issued automatically by Caddy (takes ~1 min)"
echo ""
