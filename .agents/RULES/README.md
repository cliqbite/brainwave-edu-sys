# RULES

Repo-scoped implementation rules for Brainwave EduSys.

## Scope
- Source: `CLAUDE.md`, permission constants, backend middleware/routes, and frontend permission gates.
- Purpose: keep authz behavior consistent across backend, frontend, and seed data.

## Files
- `permissions-core.md` → source-of-truth permissions + role defaults + merge semantics.
- `permissions-invariants.md` → non-negotiable behavior rules (must not regress).
- `permissions-route-map.md` → backend route guards and frontend nav/form gates.
- `workflow.md` → end-of-session doc rules, deployment scripts, seed behaviour, Prisma v7 adapter requirement.

## Usage
- Before adding/changing a protected feature: update permission constant, seed behaviour, route guard, frontend visibility, and this folder.
- **End of every conversation**: update affected rule files + `CLAUDE.md` + `docs/CHANGELOG.md` + `docs/DATABASE_SCHEMA.md` (if schema changed). See `workflow.md` for full checklist.
