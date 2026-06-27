# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Brainwave EduSys — WhatsApp Broadcast & User Management Platform for educational institutes. Sends WhatsApp/web-push notifications to students organized into groups, with CSV/Excel import, role-based access, and full audit logging.

## Tech Stack

### Runtime & Language
| Layer | Tech | Version |
|---|---|---|
| Language | TypeScript | ^5.8 |
| Runtime | Node.js | v24 |
| Package manager | npm workspaces | — |

### Backend (`apps/backend`)
| Tech | Version | Role |
|---|---|---|
| Express | ^5.0.1 | HTTP API server |
| Prisma | ^7.8.0 | ORM + migrations |
| `@prisma/client` | ^7.8.0 | DB client (v7 — requires adapter) |
| `@prisma/adapter-mariadb` | ^7.8.0 | Prisma v7 driver adapter for MySQL |
| `mariadb` | ^3.5.3 | Underlying MySQL connector |
| MySQL | 8 | Primary database (via Docker) |
| BullMQ | ^5.30.0 | Job queues (message campaigns, push) |
| ioredis | ^5.4.2 | Redis client for BullMQ |
| Redis | 7 | Queue broker (via Docker) |
| `jsonwebtoken` | ^9.0.2 | JWT access + refresh tokens |
| `bcrypt` | ^5.1.1 | Password hashing (12 rounds) |
| `zod` | ^3.24.0 | Env + request validation |
| `pino` / `pino-http` | ^9.6 | Structured JSON logging |
| `web-push` | ^3.6.7 | VAPID web push notifications |
| `express-rate-limit` | ^7.5 | API rate limiting |
| `helmet` | ^8.0 | Security headers |
| `multer` | ^1.4.5 | File upload (CSV/XLSX) |
| `exceljs` | ^4.4 | XLSX parsing |
| `tsx` | ^4.19 | TS execution (dev + seed) |

### Worker (`apps/worker`)
| Tech | Version | Role |
|---|---|---|
| BullMQ | ^5.30.0 | Queue worker (concurrency 5 msg / 10 push) |
| ioredis | ^5.4.2 | Redis connection |
| Prisma | ^7.8.0 | Same DB as backend |
| `@prisma/adapter-mariadb` | ^7.8.0 | Same adapter pattern |

### Frontend (`apps/frontend`)
| Tech | Version | Role |
|---|---|---|
| React | ^19.0.0 | UI framework |
| Vite | ^6.0.0 | Build tool + dev server (port 5173) |
| React Router | ^7.0.0 | Client-side routing (`createBrowserRouter`) |
| TanStack Query | ^5.100 | Server state, caching, mutations |
| TanStack Table | ^8.21 | Data tables |
| TanStack Virtual | ^3.14 | Virtualised lists |
| Zustand | ^5.0.0 | Client state (auth, UI) |
| axios | ^1.7.0 | HTTP client with auto token-refresh interceptor |
| Tailwind CSS | ^4.3.1 | Styling (v4 — uses `@tailwindcss/vite` plugin, no config file) |
| lucide-react | ^0.460 | Icons |
| react-hot-toast | ^2.4.1 | Toast notifications |

### Infrastructure
| Tech | Role |
|---|---|
| Docker Compose | Local dev: MySQL + Redis containers |
| Docker Compose (prod) | Full stack: all services + Caddy |
| Caddy | Reverse proxy + automatic TLS (prod) |
| nginx | Serves built frontend (prod container) |

### Key architectural notes for agents
- **Prisma v7**: `new PrismaClient()` alone throws. Always pass `adapter: new PrismaMariaDb(DATABASE_URL)`. Applies to backend, worker, and seed script.
- **Prisma seed**: configured in `prisma.config.ts` `migrations.seed` (not `package.json` `"prisma".seed` — that was v5/v6 pattern).
- **Tailwind v4**: no `tailwind.config.js`. Config via CSS `@theme` directive. Plugin: `@tailwindcss/vite` in `vite.config.ts`.
- **React Router v7**: uses `createBrowserRouter` API, not `<BrowserRouter>`.
- **TanStack Query**: all API calls go through `api/endpoints.ts`; mutations use `useMutation`, queries use `useQuery`.
- **Token refresh**: axios interceptor in `api/client.ts` silently refreshes on 401 and retries once. On second failure calls `logout()`.

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

#### Role permission matrix (source of truth: `DEFAULT_ROLE_PERMISSIONS` in `permissions.ts`)

| Permission | MASTER | ADMIN | MODERATOR | USER |
|---|:---:|:---:|:---:|:---:|
| `USER_VIEW` | ✓ | ✓ | — | — |
| `USER_CREATE` | ✓ | ✓ | — | — |
| `USER_IMPORT` | ✓ | — | — | — |
| `USER_UPDATE` | ✓ | ✓ | — | — |
| `USER_DELETE` | ✓ | ✓ | — | — |
| `GROUP_VIEW` | ✓ | ✓ | — | — |
| `GROUP_CREATE` | ✓ | ✓ | — | — |
| `GROUP_UPDATE` | ✓ | ✓ | — | — |
| `GROUP_DELETE` | ✓ | ✓ | — | — |
| `MESSAGE_SEND` | ✓ | ✓ | — | — |
| `MESSAGE_BROADCAST` | ✓ | ✓ | — | — |
| `MESSAGE_HISTORY_VIEW` | ✓ | ✓ | — | — |
| `MODERATOR_CREATE` | ✓ | ✓ | — | — |
| `MODERATOR_UPDATE` | ✓ | ✓ | — | — |
| `PUSH_NOTIFICATION_SEND` | ✓ | ✓ | — | — |
| `SETTINGS_MANAGE` | ✓ | ✓ | — | — |
| `AUDIT_LOG_VIEW` | ✓ | — | — | — |

MODERATOR gets no default permissions — ADMIN/MASTER grants individually via `UserPermission` overrides.

#### Invariants (enforced in backend, UI must mirror)

- **Only MASTER can assign MASTER role** — `users.service.ts` `create` + `update` throw `ForbiddenError` if non-MASTER tries to set `roleId` pointing to MASTER role.
- **Only MASTER sees `USER_IMPORT` route** — `Sidebar.tsx` gates `/import` on `USER_IMPORT` permission; only MASTER has it.
- **Only MASTER sees Activity Log** — `/activity` route gated by `role: 'MASTER'` in sidebar, backed by `AUDIT_LOG_VIEW` permission on the API.
- **Frontend role dropdown** — `UserFormModal.tsx` filters MASTER role out of options unless `hasRole('MASTER')`.

#### Changing role permissions

1. Edit `DEFAULT_ROLE_PERMISSIONS` in `packages/shared/src/constants/permissions.ts`.
2. Update the matrix table above.
3. Run `npm run db:seed` — upserts new grants but **does NOT delete removed ones**.
4. Manually delete stale rows: `DELETE rp FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id WHERE r.name = '<ROLE>' AND p.name = '<PERMISSION>';`
5. Affected users must re-login to get fresh permissions in their JWT/Zustand state.

#### Login response includes permissions

`auth.service.ts` `login()` resolves effective permissions (role perms + user overrides) and returns `permissions[]` in the user object. Frontend `hasPermission()` in `auth.store.ts` depends on this — if `permissions` is missing, all gated routes/buttons hide. Never strip `permissions` from the login response.
