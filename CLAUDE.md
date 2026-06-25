# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Brainwave EduSys — WhatsApp Broadcast & User Management Platform for educational institutes. Sends WhatsApp/web-push notifications to students organized into groups, with CSV/Excel import, role-based access, and full audit logging.

## Commands

### Development

```bash
# Start infrastructure (MySQL + Redis)
docker compose up -d

# Install all workspace deps
npm install

# Run servers (separate terminals)
npm run dev:backend      # Express API on :4000
npm run dev:frontend     # Vite React PWA on :5173
npm run dev:worker       # BullMQ worker (optional)
```

### Database

```bash
npm run db:generate      # Regenerate Prisma client after schema changes
npm run db:migrate       # Create + apply migration (dev)
npm run db:migrate:prod  # Deploy pending migrations (prod)
npm run db:seed          # Seed roles, permissions, master user
npm run db:studio        # Open Prisma Studio GUI
```

### Build & Lint

```bash
npm run build            # Build all workspaces
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only
npm run lint             # Lint all workspaces
npm run clean            # Remove all dist/ and node_modules/
```

No test framework is configured — there are no `test` scripts in any workspace.

### Environment

- Dev env: `.env.development` (loaded via `dotenv-cli` in npm scripts — no manual sourcing needed)
- Prod env: `.env.production`
- Backend reads env via `apps/backend/src/config/env.ts` (validated at startup); Prisma reads `DATABASE_URL` from `apps/backend/prisma.config.ts`
- Frontend reads `VITE_API_URL` (empty string in dev → Vite proxy at `vite.config.ts` forwards `/api` to `:4000`)

---

## Architecture

### Workspace layout

```
apps/backend/   — Express 5 API (@brainwave/backend)
apps/frontend/  — React 19 Vite PWA (@brainwave/frontend)
apps/worker/    — BullMQ background worker (@brainwave/worker)
packages/shared/ — Shared TypeScript types & constants (@brainwave/shared)
infra/caddy/    — Caddyfile (reverse proxy, prod HTTPS)
infra/docker/   — MySQL init scripts
```

All `apps/*` depend on `@brainwave/shared` via npm workspaces (`"*"` version).

### Backend (`apps/backend/src/`)

Module-per-feature pattern: each domain lives in `modules/<name>/` with four files: `*.routes.ts` → `*.controller.ts` → `*.service.ts` + `*.validator.ts`.

Modules: `auth`, `users`, `roles`, `permissions`, `groups`, `imports`, `messages`, `push`, `audit`.

Middleware stack (applied in `app.ts`):
1. `cors` / `helmet` / `compression` / `express.json`
2. `requestLogger` (pino-http)
3. `apiLimiter` (express-rate-limit)
4. Per-route: `authenticate()` → `requirePermission(...perms)` → handler
5. Global `errorHandler` (last)

`authenticate()` verifies JWT, loads user + role from DB, attaches to `req.user`.

`requirePermission()` resolves effective permissions by merging `role_permissions` + per-user `user_permissions` overrides (grant=true adds, grant=false removes). Result cached on `req.user.resolvedPermissions` for the request lifetime. MASTER role always bypasses permission checks.

All API responses use `sendSuccess(res, data, message)` / `sendError(res, message, status)` from `utils/response.ts`.

### Queue / Worker

`apps/backend/src/services/queue/` enqueues jobs to BullMQ. Two named queues:
- `message-campaigns` — processed by `message.processor.ts` (WhatsApp sends, concurrency 5, rate-limited 10/sec)
- `push-notifications` — processed by `push.processor.ts` (web-push, concurrency 10)

The worker is a **separate process** (`apps/worker/`) that connects to the same Redis and Prisma. It must be running for WhatsApp/push jobs to execute.

### Frontend (`apps/frontend/src/`)

- **Routing**: React Router v7 (`App.tsx`)
- **Server state**: TanStack Query (queries/mutations in `api/endpoints.ts`)
- **Client state**: Zustand stores (`stores/auth.store.ts`, `stores/ui.store.ts`)
- **HTTP**: `api/client.ts` — axios instance with auto token-refresh interceptor (retries original request after silent `/auth/refresh-token`)
- **UI**: Tailwind CSS v4 + lucide-react icons + react-hot-toast

Auth tokens (access + refresh) are stored in Zustand. On 401, the interceptor silently refreshes and retries once; on refresh failure it calls `logout()`.

### Database (Prisma + MySQL 8)

Schema at `apps/backend/prisma/schema.prisma`. Key relationships:
- `User` → `Role` (many-to-one); `Role` → `Permission` via `RolePermission`
- Per-user overrides: `UserPermission` (granted boolean, overrides role perms)
- Soft deletes on `User` and `Group` via `deletedAt`
- Messaging: `MessageCampaign` → `MessageRecipient[]` → `MessageLog[]`
- Push: `PushNotification` → `PushNotificationRecipient[]`, `PushSubscription[]`
- `ImportBatch` → `ImportRow[]` (CSV/XLSX bulk user creation)
- `AuditLog` — append-only, records all mutations with old/new JSON values

### Permissions model

Four system roles: `MASTER` > `ADMIN` > `MODERATOR` > `USER`. Permissions are named strings (e.g. `users.view`, `messages.send`). Moderators get their permissions per-user via `UserPermission` rows. Adding a new permission requires: defining the name in `packages/shared/src/constants/permissions.ts`, seeding it, and adding `requirePermission('...')` to the relevant route.

### Prod deployment

`docker-compose.prod.yml` — all services containerized (frontend nginx, backend, worker, MySQL, Redis, Caddy). Caddy handles TLS automatically given `FRONTEND_DOMAIN` / `API_DOMAIN` env vars.

---

## Rules

### Migration rules

- **Never edit existing migration files** — they are immutable once committed. Create a new migration instead.
- **Always commit migration files** alongside the schema change (`prisma/migrations/<timestamp>/migration.sql` + `schema.prisma` in the same commit).
- **`migration_lock.toml` must stay committed** — it locks the provider (`mysql`). Deleting or changing it can cause Prisma to destroy and recreate migrations.
- **Prefer additive migrations** (ADD COLUMN, CREATE TABLE) over destructive ones (DROP, RENAME). If destructive is required, add a data-migration step before the destructive SQL.
- **Dev workflow**: `npm run db:migrate` → generates + applies + regenerates client. Run `npm run db:generate` only when client is out of sync without a schema change.
- **Prod workflow**: `npm run db:migrate:prod` (`prisma migrate deploy`) — never run `migrate dev` in production; it can prompt interactively and reset data.
- **`prisma.config.ts` reads `DATABASE_URL` from raw `process.env`** (not Zod-validated `env`). This is intentional — Prisma CLI runs outside the app process. Ensure `DATABASE_URL` is set in `.env.development` / `.env.production` before running any `db:*` commands.
- When adding a new field to schema: check if it needs a default (required for non-nullable columns on existing tables), otherwise `migrate dev` will fail or prompt for a fill value.
- **After every migration** — update `docs/DATABASE_SCHEMA.md`: add/remove/modify the affected table block in the ERD, update the table summary row, update the "Last updated" + migration name in the header, and add a changelog entry under `### Changed` in `docs/CHANGELOG.md`.

### Permission rules

- New permission name must be defined in `packages/shared/src/constants/permissions.ts` first.
- Seed it via `npm run db:seed` after adding.
- Add `requirePermission('...')` to the route — never protect routes with ad-hoc role checks; use the permission system.
- MASTER role bypasses all permission checks — never add explicit MASTER guards in service layer.
