# RULES

Repo-scoped implementation rules for Brainwave EduSys.

## Scope
- Source: `CLAUDE.md`, permission constants, backend middleware/routes, and frontend permission gates.
- Purpose: keep authz behavior consistent across backend, frontend, and seed data.

## Files
- `permissions-core.md` -> source-of-truth permissions + role defaults + merge semantics.
- `permissions-invariants.md` -> non-negotiable behavior rules (must not regress).
- `permissions-route-map.md` -> backend route guards and frontend nav/form gates.

## Usage
- Before adding/changing protected feature: update permission constant, seed behavior, route guard, frontend visibility, and docs in this folder.
