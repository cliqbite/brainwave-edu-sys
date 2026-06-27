# Permission Invariants

Hard constraints. Do not break.

## Role assignment safety
- Only `MASTER` can assign `MASTER` role.
- Enforced in backend user create/update service:
- `apps/backend/src/modules/users/users.service.ts`
- Throws `ForbiddenError('Only MASTER can assign the MASTER role')` for non-MASTER actor.

## Activity log visibility
- Backend route requires BOTH:
- `authorize('MASTER')`
- `requirePermission('AUDIT_LOG_VIEW')`
- Location: `apps/backend/src/modules/audit/audit.routes.ts`.

## Import visibility
- Backend import endpoints require `USER_IMPORT`.
- Frontend sidebar shows `/import` only when `hasPermission('USER_IMPORT')`.
- Net effect from role defaults: only `MASTER` sees import by default.

## Master role in UI forms
- User role dropdown must hide `MASTER` option for non-MASTER actors.
- Current gate: `apps/frontend/src/components/users/UserFormModal.tsx` uses `hasRole('MASTER')`.

## No ad-hoc role checks for normal feature authz
- Use permission system (`requirePermission`) for feature access.
- Keep explicit role checks only for explicit invariants (example: `MASTER`-only activity log route).

## Login payload requirement
- Auth login response must include resolved `permissions[]`.
- Frontend authorization helpers depend on this; removing it hides gated UI.
