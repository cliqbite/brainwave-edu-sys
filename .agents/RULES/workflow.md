# Workflow Rules

## End-of-session documentation (MANDATORY)

After every conversation where code, config, permissions, DB schema, or scripts changed:

1. **CLAUDE.md** — update relevant section (tech stack, architecture, rules, migration notes).
2. **`.agents/RULES/`** — update the affected rule file(s):
   - Permission changes → `permissions-core.md`, `permissions-invariants.md`, `permissions-route-map.md`
   - Workflow changes → this file (`workflow.md`)
3. **`docs/CHANGELOG.md`** — add entry under `[Unreleased]` describing what changed and why.
4. **`docs/DATABASE_SCHEMA.md`** — update ERD + table summary if any migration was created.
5. **`docs/deployment.md`** — update if deployment process, scripts, or infra changed.
6. **Memory** — save relevant user preferences, project decisions, or non-obvious findings to `~/.claude/projects/.../memory/`.

Do not defer this to "next session". Update before closing.

---

## Deployment scripts

All deployment operations use scripts in `scripts/`. Never instruct manual `docker compose` commands — always reference the script.

| Operation | Script |
|---|---|
| First deploy | `bash scripts/deploy.sh` |
| Full update | `bash scripts/update.sh` |
| Frontend only | `bash scripts/update-frontend.sh` |
| Backend + migrations | `bash scripts/update-backend.sh` |
| Worker only | `bash scripts/update-worker.sh` |
| DB migrations | `bash scripts/migrate-db.sh` |
| Backup | `bash scripts/backup-db.sh` |
| Restore | `bash scripts/restore-db.sh <file>` |
| Run query | `bash scripts/run-query.sh` |
| Status check | `bash scripts/status.sh` |
| Logs | `bash scripts/logs.sh [service]` |

Scripts read credentials from `.env.production` automatically. Run from project root.

---

## Seed behaviour

- `npm run db:seed` is idempotent (all upserts) — safe to re-run.
- Seed does NOT delete removed `role_permissions` rows. After removing a permission from `DEFAULT_ROLE_PERMISSIONS`, manually delete the stale row:
  ```sql
  DELETE rp FROM role_permissions rp
  JOIN roles r ON r.id = rp.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE r.name = '<ROLE>' AND p.name = '<PERMISSION>';
  ```
- After any permission change, affected users must re-login to get fresh `permissions[]` in Zustand state.

---

## Prisma v7 — mandatory adapter pattern

Every `PrismaClient` instantiation (backend, worker, seed) MUST use:

```ts
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
const adapter = new PrismaMariaDb(DATABASE_URL);
const prisma = new PrismaClient({ adapter });
```

`new PrismaClient()` without adapter throws `PrismaClientInitializationError` in v7.

Seed uses `process.env.DATABASE_URL` directly (not Zod-validated `env`) because it runs as a CLI process outside the app.

---

## Login response must include permissions

`auth.service.ts` `login()` must resolve and return `permissions[]` in the user object.

Frontend `hasPermission()` in `auth.store.ts` reads from `user.permissions`. If missing → all gated sidebar items and buttons hide for non-MASTER users.

`refreshToken` service does NOT return user object — existing Zustand user persists across token rotation. Only `login()` and `getMe()` set the user.
