# Brainwave Education System (Brainwave EduSys)

> WhatsApp Broadcast & User Management Platform for Education Institutes

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey)](https://expressjs.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)](https://mysql.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://docs.docker.com/compose/)

---

## Overview

Brainwave EduSys is a production-grade platform designed for educational institutes and small-to-medium businesses to:

- **Import** students/users from CSV/Excel files
- **Organize** users into groups/categories
- **Send** WhatsApp broadcast messages
- **Push** web push notifications
- **Manage** roles and permissions dynamically
- **Track** all activities via an audit/changelog system

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Caddy      │────▶│   Backend    │
│  React PWA   │     │  (HTTPS)     │     │  Express API │
└─────────────┘     └──────────────┘     └──────┬───────┘
                                                │
                                         ┌──────┴───────┐
                                         │              │
                                    ┌────▼────┐   ┌────▼────┐
                                    │  MySQL  │   │  Redis  │
                                    │   8.0   │   │  Queue  │
                                    └─────────┘   └────┬────┘
                                                       │
                                                  ┌────▼────┐
                                                  │  Worker  │
                                                  │ BullMQ   │
                                                  └─────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Zustand, TanStack Query, TanStack Table |
| Backend | Express 5, TypeScript, Prisma ORM |
| Database | MySQL 8.0 |
| Queue | BullMQ + Redis 7 |
| Auth | JWT (access + refresh tokens) |
| Proxy | Caddy (automatic HTTPS) |
| Container | Docker Compose |

## Quick Start (Development)

### Prerequisites

- Node.js >= 22.12
- Docker & Docker Compose
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd brainwave-edu-sys

# For local development, the default .env.development works out of the box.
# If you need to override values, create a .env.development.local file.
```

### 2. Start Database & Redis

```bash
docker compose up -d
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed roles, permissions, and master user
npm run db:seed
```

### 5. Start Development Servers

```bash
# Terminal 1: Backend API (port 4000)
npm run dev:backend

# Terminal 2: Frontend (port 5173)
npm run dev:frontend

# Terminal 3: Worker (optional, for background jobs)
npm run dev:worker
```

### 6. Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/api/v1/health
- **Prisma Studio**: `npm run db:studio`

### Default Login

| Role | Email | Password |
|------|-------|----------|
| Master | master@brainwave.edu | Master@123 |

> Change these in your `.env` file before production deployment!

---

## Production Deployment (VPS)

### Prerequisites

- VPS (e.g., Hostinger) with Docker installed
- Domain with DNS A records pointing to your VPS IP:
  - `app.yourdomain.com` → VPS IP
  - `api.yourdomain.com` → VPS IP

### 1. Server Setup

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Install Docker (if not installed)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone project
git clone <repository-url>
cd brainwave-edu-sys

# Configure environment
cp .env.example .env
nano .env
```

### 2. Configure .env for Production

```env
NODE_ENV=production

# Use strong, unique secrets
JWT_ACCESS_SECRET=<generate-with-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-32>
DB_PASSWORD=<strong-password>
DB_ROOT_PASSWORD=<strong-root-password>

# Your domains
FRONTEND_DOMAIN=app.yourdomain.com
API_DOMAIN=api.yourdomain.com

# Generate VAPID keys
# npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
```

### 3. Deploy

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Run database seed (first time only)
docker compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

### 4. Verify

- `https://app.yourdomain.com` — Frontend (should have SSL)
- `https://api.yourdomain.com/api/v1/health` — Backend health check

### Updating

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Project Structure

```
brainwave-edu-sys/
├── apps/
│   ├── backend/          # Express.js API (TypeScript)
│   ├── frontend/         # React + Vite PWA (TypeScript)
│   └── worker/           # BullMQ background workers
├── packages/
│   └── shared/           # Shared types & constants
├── infra/
│   ├── caddy/            # Caddyfile (reverse proxy)
│   └── docker/           # MySQL init scripts
├── docs/                 # Documentation
├── docker-compose.yml    # Development
├── docker-compose.prod.yml # Production
└── .env.example          # Environment template
```

## Roles & Permissions

| Role | Description |
|------|-------------|
| **Master** | Superuser — full system access, audit log viewer |
| **Admin** | Manages users, groups, messages, moderators |
| **Moderator** | Limited access — permissions granted by Admin/Master |
| **User** | Basic access — view profile, receive messages |

Permissions are dynamically assigned. Moderator access is fully configurable per-user.

## API Documentation

See [docs/api.md](docs/api.md) for complete API documentation.

## Security

See [docs/security-checklist.md](docs/security-checklist.md) for the security checklist.

## License

Private — All rights reserved.
