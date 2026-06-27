# Brainwave EduSys — Deployment & Operations Guide

> All scripts live in `scripts/`. Run every command from the **project root directory**.

---

## Which guide is for me?

| I am... | Go to |
|---|---|
| Non-technical (owner, manager, support staff) | [👤 Simple Guide (Non-Tech)](#-simple-guide-non-tech) |
| Developer / DevOps / Technical staff | [🛠️ Technical Guide (Dev)](#️-technical-guide-dev) |

---

---

# 👤 Simple Guide (Non-Tech)

> You don't need to understand code. Just follow the steps exactly.
> Every command starts with `bash scripts/` — copy-paste it as written.

---

## What is each piece?

| Name | What it does |
|---|---|
| **Frontend** | The website users see in their browser |
| **Backend** | The engine that handles logins, data, and logic |
| **Worker** | Sends WhatsApp messages and push notifications in the background |
| **Database** | Stores all your data (users, groups, messages, logs) |

---

## 🚀 First Time Setup (Someone does this once)

> Give this to a technical person the first time. After setup, you can use the other sections yourself.

1. Open terminal on the server
2. Go to the project folder: `cd brainwave-edu-sys`
3. Run: `bash scripts/deploy.sh`
4. Wait 5 minutes
5. Visit your website — it should be live ✅

---

## 🔄 Update the App (After a code change)

Someone pushed a new version. You want the live site to reflect it.

```bash
bash scripts/update.sh
```

Wait 2–3 minutes. Refresh the website. Done.

---

## 🖥️ Update Only the Website (Frontend)

Only the look/design changed, not the logic.

```bash
bash scripts/update-frontend.sh
```

---

## ⚙️ Update Only the App Engine (Backend)

Only the logic/API changed, not the design.

```bash
bash scripts/update-backend.sh
```

---

## 📨 Update Only the Message Sender (Worker)

Only the background message/notification sender changed.

```bash
bash scripts/update-worker.sh
```

---

## 💾 Take a Database Backup

**Do this before any update or change. Takes 30 seconds.**

```bash
bash scripts/backup-db.sh
```

A file will be saved in the `backups/` folder with today's date in the name.
Copy it to your computer for safekeeping:

```bash
# Run this on YOUR computer (not the server):
scp user@YOUR_SERVER_IP:/path/to/brainwave-edu-sys/backups/db_backup_*.sql.gz ./
```

---

## ♻️ Restore a Backup

Something went wrong and you want to go back to a previous backup.

> ⚠️ **This will erase the current data and replace it with the backup.**
> Take a new backup first just in case.

```bash
bash scripts/backup-db.sh    # safety backup first

bash scripts/restore-db.sh ./backups/db_backup_20260627_020000.sql.gz
```

It will ask you to type `YES` before doing anything.

---

## 🩺 Check if Everything is Running

```bash
bash scripts/status.sh
```

All services should show `Up`. If any shows `Exit` or `Restarting`, something is wrong — check logs.

---

## 📋 View Logs (What's happening inside)

```bash
# See everything
bash scripts/logs.sh

# See only the app engine
bash scripts/logs.sh backend

# See only the message sender
bash scripts/logs.sh worker
```

Press `Ctrl+C` to stop.

---

## 🆘 Something is Broken — What to Do

| Problem | What to run |
|---|---|
| Site not loading | `bash scripts/logs.sh frontend` |
| Login not working | `bash scripts/logs.sh backend` |
| Messages not sending | `bash scripts/logs.sh worker` |
| All else fails | `bash scripts/logs.sh` |

Share the log output with your technical contact.

---

## 📅 Recommended Routine

| When | Action |
|---|---|
| Every night (auto) | Backup runs automatically if cron is set up |
| Before every update | `bash scripts/backup-db.sh` |
| After every update | `bash scripts/status.sh` to confirm all green |
| Every week | Copy latest backup file off the server |

---

---

# 🛠️ Technical Guide (Dev)

---

## Table of Contents

1. [Initial Deployment](#1-initial-deployment)
2. [Environment Configuration](#2-environment-configuration)
3. [Service-Level Updates](#3-service-level-updates)
4. [Database Operations](#4-database-operations)
5. [Monitoring & Logs](#5-monitoring--logs)
6. [Troubleshooting](#6-troubleshooting)
7. [Local Development](#7-local-development)
8. [Scripts Reference](#8-scripts-reference)

---

## 1. Initial Deployment

### Server Requirements

- Ubuntu 22.04+ (or any Linux with Docker)
- Min 2 GB RAM / 1 vCPU — Recommended 4 GB / 2 vCPU
- Ports 80 + 443 open in firewall

### DNS — Set before deploying

| Record | Type | Value |
|---|---|---|
| `app.yourdomain.com` | A | `YOUR_VPS_IP` |
| `api.yourdomain.com` | A | `YOUR_VPS_IP` |

DNS must resolve **before** starting Caddy, or SSL provisioning fails.

### Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
docker --version && docker compose version
```

### Clone + configure

```bash
git clone <repository-url> && cd brainwave-edu-sys
cp .env.production .env.production.bak
nano .env.production
```

See [Environment Configuration](#2-environment-configuration) for all required values.

### Deploy

```bash
bash scripts/deploy.sh
```

Script does: validate env → build images → `docker compose up -d` → wait for MySQL health → `prisma migrate deploy` → `prisma db seed` → status print.

### Verify

```bash
bash scripts/status.sh
curl https://api.yourdomain.com/api/v1/health
```

---

## 2. Environment Configuration

### `.env.production` — Required values

```env
# App
NODE_ENV=production
APP_NAME=Brainwave EduSys

# Domains
FRONTEND_DOMAIN=app.yourdomain.com
API_DOMAIN=api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
API_URL=https://api.yourdomain.com

# Database (used by backend + worker via DATABASE_URL constructed in docker-compose.prod.yml)
DB_NAME=brainwave_edusys
DB_USER=brainwave
DB_PASSWORD=<strong>
DB_ROOT_PASSWORD=<different-strong>

# Redis
REDIS_PASSWORD=<strong>

# JWT — generate: openssl rand -hex 32
JWT_ACCESS_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<different-64-char-hex>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# VAPID — generate: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=<key>
VAPID_PRIVATE_KEY=<key>
VAPID_EMAIL=mailto:admin@yourdomain.com

# WhatsApp (optional)
WHATSAPP_ENABLED=false
WHATSAPP_API_URL=
WHATSAPP_API_KEY=

# Master user (seeded on first deploy)
MASTER_EMAIL=admin@yourdomain.com
MASTER_PASSWORD=<strong>
MASTER_NAME=System Master

# Misc
UPLOAD_MAX_SIZE_MB=5
LOG_LEVEL=info
```

### Notes

- `DATABASE_URL` is **not** in `.env.production` — it's constructed in `docker-compose.prod.yml` as `mysql://${DB_USER}:${DB_PASSWORD}@mysql:3306/${DB_NAME}`.
- Prisma v7 reads `DATABASE_URL` via `apps/backend/prisma.config.ts` for CLI commands; runtime uses `@prisma/adapter-mariadb`.
- Frontend `VITE_VAPID_PUBLIC_KEY` is injected at build time as a Docker build arg — rebuilding frontend is required if VAPID keys change.

---

## 3. Service-Level Updates

```bash
# All services
git pull origin main && bash scripts/update.sh

# Frontend only (static rebuild)
git pull origin main && bash scripts/update-frontend.sh

# Backend + migrations
git pull origin main && bash scripts/update-backend.sh

# Worker only
git pull origin main && bash scripts/update-worker.sh

# Migrations only (no rebuild)
bash scripts/migrate-db.sh
```

`update-backend.sh` runs `prisma migrate deploy` automatically after container restart.

`migrate-db.sh` is idempotent — tracks applied migrations via `_prisma_migrations` table.

---

## 4. Database Operations

### Backup

```bash
bash scripts/backup-db.sh
# Output: ./backups/db_backup_YYYYMMDD_HHMMSS.sql.gz
```

**Automate with cron:**
```bash
crontab -e
# 2 AM daily
0 2 * * * cd /path/to/brainwave-edu-sys && bash scripts/backup-db.sh >> /var/log/brainwave-backup.log 2>&1
```

### Restore

```bash
bash scripts/backup-db.sh          # safety snapshot
bash scripts/restore-db.sh ./backups/db_backup_YYYYMMDD_HHMMSS.sql.gz
```

Prompts `YES` confirmation. Pipes `gunzip | mysql` directly into the running container.

### Run SQL

```bash
# Interactive shell
bash scripts/run-query.sh

# Inline query
bash scripts/run-query.sh "SELECT COUNT(*) FROM users WHERE status='ACTIVE';"

# SQL file
bash scripts/run-query.sh ./scripts/fix-data.sql
```

### Common admin queries

```sql
-- Check active users
SELECT id, email, role_id, status FROM users WHERE deleted_at IS NULL;

-- Remove stale role permission (e.g. ADMIN + USER_IMPORT)
DELETE rp FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'ADMIN' AND p.name = 'USER_IMPORT';

-- Check pending message campaigns
SELECT id, title, status, total_recipients, sent_count, failed_count FROM message_campaigns WHERE status IN ('PENDING','PROCESSING');

-- View recent audit log
SELECT u.email, al.action, al.module, al.created_at FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id ORDER BY al.created_at DESC LIMIT 20;
```

---

## 5. Monitoring & Logs

```bash
bash scripts/status.sh           # container status + resource usage

bash scripts/logs.sh             # all services, last 50 lines + live stream
bash scripts/logs.sh backend     # API logs (pino JSON)
bash scripts/logs.sh worker      # BullMQ job processor
bash scripts/logs.sh mysql       # MySQL server logs
bash scripts/logs.sh redis       # Redis logs
bash scripts/logs.sh caddy       # Reverse proxy + TLS logs
bash scripts/logs.sh frontend    # nginx serving built frontend
```

---

## 6. Troubleshooting

### 502 Bad Gateway

Backend or frontend crashed on startup. Check:
```bash
bash scripts/logs.sh backend
bash scripts/logs.sh frontend
```
Most common: invalid / missing env var. Zod validation kills the process at startup with a clear error message.

### Migrations fail (`P1001` / `ECONNREFUSED`)

MySQL not ready. Wait 30s, then:
```bash
bash scripts/migrate-db.sh
```

### Worker stuck — broadcasts never send

```bash
bash scripts/logs.sh worker
```
Check `REDIS_PASSWORD` in `.env.production` matches the value Redis was started with.

### Push notifications not arriving

1. Verify `VAPID_PUBLIC_KEY` in `.env.production` = `VITE_VAPID_PUBLIC_KEY` used at frontend build time.
2. Rebuild frontend: `bash scripts/update-frontend.sh`

### SSL not provisioning

- Confirm DNS resolves: `dig app.yourdomain.com`
- Check Caddy logs: `bash scripts/logs.sh caddy`
- If behind Cloudflare: set SSL mode to **Full (Strict)** or grey-cloud temporarily.

### File uploads fail

```bash
docker compose -f docker-compose.prod.yml exec backend chown -R node:node /app/data/uploads
```

### Permissions not showing for a role after seed

Seed upserts only — doesn't delete removed permissions. Manually delete stale rows:
```bash
bash scripts/run-query.sh "DELETE rp FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.name='ADMIN' AND p.name='USER_IMPORT';"
```
Then ask affected users to re-login (Zustand state is stale until fresh login).

---

## 7. Local Development

### Prerequisites

- Node.js >= 22.12
- Docker & Docker Compose v2+

### Setup

```bash
git clone <repo> && cd brainwave-edu-sys

# Start MySQL + Redis
docker compose up -d

# Install all workspace deps
npm install

# DB setup
npm run db:generate    # generate Prisma client
npm run db:migrate     # apply migrations
npm run db:seed        # seed roles, permissions, master user

# Start services (3 terminals)
npm run dev:backend    # → http://localhost:4000
npm run dev:frontend   # → http://localhost:5173
npm run dev:worker     # background processor (optional)
```

Env: `.env.development` loaded automatically via `dotenv-cli`. No manual sourcing needed.

### Useful dev commands

```bash
npm run db:studio      # Prisma Studio GUI → http://localhost:5555
npm run build          # build all workspaces
npm run lint           # lint all workspaces
npm run clean          # remove all dist/ and node_modules/
```

---

## 8. Scripts Reference

| Script | What it does |
|---|---|
| `bash scripts/deploy.sh` | Full first-time production deployment |
| `bash scripts/update.sh` | Pull latest + rebuild + restart all |
| `bash scripts/update-frontend.sh` | Rebuild + restart frontend only |
| `bash scripts/update-backend.sh` | Rebuild + restart backend + run migrations |
| `bash scripts/update-worker.sh` | Rebuild + restart worker only |
| `bash scripts/migrate-db.sh` | Run pending DB migrations only |
| `bash scripts/backup-db.sh` | Compressed DB backup → `backups/` |
| `bash scripts/restore-db.sh <file>` | Restore DB from backup (with confirm prompt) |
| `bash scripts/run-query.sh` | Interactive MySQL shell |
| `bash scripts/run-query.sh "SQL"` | Run inline SQL query |
| `bash scripts/run-query.sh file.sql` | Run SQL from file |
| `bash scripts/status.sh` | Container status + resource usage |
| `bash scripts/logs.sh [service]` | Live log stream (all or specific) |
