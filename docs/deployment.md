# Brainwave EduSys — Deployment Guide

## Development Setup

### Prerequisites

- **Node.js** >= 22.12 (required for Vite 8)
- **Docker** & **Docker Compose** v2+
- **Git**

### Steps

```bash
# 1. Clone
git clone <repository-url>
cd brainwave-edu-sys

# 2. Environment
# We use two environment files:
# - .env.development (for local and remote dev)
# - .env.production (for live production)

# Copy the development template
cp .env.development .env.development.local
# Edit .env.development.local if needed (git ignored)

# 3. Start MySQL & Redis
docker compose up -d

# 4. Install dependencies
npm install

# 5. Database setup
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed roles, permissions, master user

# 6. Start services (3 terminals)
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
npm run dev:worker     # Background job processor

# 7. Open Prisma Studio (optional)
npm run db:studio      # http://localhost:5555
```

---

## Production Deployment (Hostinger VPS)

### 1. Server Requirements

- Ubuntu 22.04+ or any Linux with Docker
- Minimum 2GB RAM, 1 vCPU
- Recommended: 4GB RAM, 2 vCPU

### 2. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### 3. Configure DNS

Create A records in your domain DNS:

| Record | Type | Value |
|--------|------|-------|
| app.yourdomain.com | A | YOUR_VPS_IP |
| api.yourdomain.com | A | YOUR_VPS_IP |

Wait for DNS propagation (5-30 minutes).

### 4. Deploy Application

```bash
# Clone project
git clone <repository-url>
cd brainwave-edu-sys

# Configure environment
cp .env.production .env.production.local
nano .env.production.local
```

**Critical `.env.production.local` values for production:**

```env
NODE_ENV=production

# Strong secrets (generate with: openssl rand -hex 32)
JWT_ACCESS_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<64-char-hex>
DB_PASSWORD=<strong-password>
DB_ROOT_PASSWORD=<strong-root-password>

# Domains
FRONTEND_DOMAIN=app.yourdomain.com
API_DOMAIN=api.yourdomain.com

# VAPID keys (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=<your-key>
VAPID_PRIVATE_KEY=<your-key>

# Master user
MASTER_EMAIL=admin@yourdomain.com
MASTER_PASSWORD=<strong-password>
```

### 5. Build & Launch

```bash
# Build all images and start
docker compose -f docker-compose.prod.yml up -d --build

# Wait for MySQL to be healthy
docker compose -f docker-compose.prod.yml logs -f mysql

# Seed database (first time only)
docker compose -f docker-compose.prod.yml exec backend \
  npx prisma db seed --schema=prisma/schema.prisma

# Verify all services
docker compose -f docker-compose.prod.yml ps
```

### 6. Verify SSL

Visit `https://app.yourdomain.com` — Caddy will automatically obtain SSL certificates.

---

## Updating

```bash
cd brainwave-edu-sys
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

## Backup

### Database Backup

```bash
# Manual backup
docker compose -f docker-compose.prod.yml exec mysql \
  mysqldump -u root -p brainwave_edusys > backup_$(date +%Y%m%d).sql

# Automated daily backup (add to crontab)
0 2 * * * cd /path/to/brainwave-edu-sys && docker compose -f docker-compose.prod.yml exec -T mysql mysqldump -u root -p${DB_ROOT_PASSWORD} brainwave_edusys | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

### Upload Files Backup

```bash
# Upload data is in Docker volume: upload_data
docker run --rm -v brainwave-edu-sys_upload_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz /data
```

## Monitoring

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Check resource usage
docker stats
```

## Troubleshooting & Common Pitfalls (Where it could go wrong)

Deploying to production involves multiple moving parts. If something goes wrong, it is usually one of the following:

### 1. Database Migration Failures
**What goes wrong:** The backend container restarts repeatedly with a `P1001` or `P2002` error.
**Why:** Prisma migrations failed to run, or the database is not ready.
**Solution:**
- Run `docker compose -f docker-compose.prod.yml logs backend` to see the exact Prisma error.
- Manually run migrations inside the container: `docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy`
- Ensure `DB_URL` uses the exact docker service name (`mysql`) and correct password.

### 2. Redis Connection Issues (Background Worker)
**What goes wrong:** Broadcasts or background tasks are stuck in "PENDING" and the worker logs show `ECONNREFUSED`.
**Why:** The BullMQ worker cannot connect to Redis.
**Solution:**
- Verify Redis is running: `docker compose -f docker-compose.prod.yml ps redis`
- Check worker logs: `docker compose -f docker-compose.prod.yml logs worker`
- Ensure `REDIS_URL` in `.env.production.local` is exactly `redis://redis:6379`.

### 3. Web-Push Notifications Failing
**What goes wrong:** Desktop push notifications aren't arriving.
**Why:** VAPID keys are mismatched or missing.
**Solution:**
- You MUST generate new VAPID keys for production: `npx web-push generate-vapid-keys`.
- Ensure `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` match exactly in `.env.production.local`.
- Ensure the frontend `.env` has `VITE_VAPID_PUBLIC_KEY` set to the exact same public key, and that the frontend was completely rebuilt (`npm run build`) after setting it.

### 4. SSL Certificate Generation Fails
**What goes wrong:** Site shows "Not Secure" or doesn't load.
**Why:** Caddy failed to automatically provision Let's Encrypt certificates.
**Solution:**
- Your DNS A records **must** point to your VPS IP address *before* you start Caddy.
- If you use Cloudflare proxy (orange cloud), you must disable it (grey cloud) initially, or configure Cloudflare strict SSL mode.
- Check logs: `docker compose -f docker-compose.prod.yml logs caddy`.

### 5. 502 Bad Gateway
**What goes wrong:** Visiting the site shows a 502 error from Caddy/Nginx.
**Why:** The frontend or backend node server crashed.
**Solution:**
- Check logs: `docker compose -f docker-compose.prod.yml logs frontend` or `logs backend`.
- Often caused by an invalid `.env` variable (e.g., missing JWT Secret). Node will crash on startup if required env vars are missing.

### 6. Permission Denied for Uploads
**What goes wrong:** File uploads fail in the UI.
**Why:** Docker volume permissions mismatch.
**Solution:**
- Execute into the backend and fix permissions:
  `docker compose -f docker-compose.prod.yml exec backend chown -R node:node /app/data/uploads`
