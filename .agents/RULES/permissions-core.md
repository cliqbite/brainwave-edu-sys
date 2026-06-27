# Permission Core Rules

## Source of truth
- Permission names: `packages/shared/src/constants/permissions.ts` (`PERMISSIONS`).
- Role defaults: `DEFAULT_ROLE_PERMISSIONS` in same file.
- Runtime merge logic: `apps/backend/src/middlewares/requirePermission.ts`.

## Permission set
- `USER_VIEW`
- `USER_CREATE`
- `USER_IMPORT`
- `USER_UPDATE`
- `USER_DELETE`
- `GROUP_VIEW`
- `GROUP_CREATE`
- `GROUP_UPDATE`
- `GROUP_DELETE`
- `MESSAGE_SEND`
- `MESSAGE_BROADCAST`
- `MESSAGE_HISTORY_VIEW`
- `MODERATOR_CREATE`
- `MODERATOR_UPDATE`
- `PUSH_NOTIFICATION_SEND`
- `SETTINGS_MANAGE`
- `AUDIT_LOG_VIEW`

## Default role grants
- `MASTER` -> all permissions.
- `ADMIN` -> all except `AUDIT_LOG_VIEW`, `USER_IMPORT`.
- `MODERATOR` -> none by default.
- `USER` -> none by default.

## Resolution algorithm (authoritative)
1. Load role permissions (`role_permissions`).
2. Load user overrides (`user_permissions`).
3. Merge overrides:
- `granted = true` -> add permission.
- `granted = false` -> remove permission.
4. Cache on `req.user.resolvedPermissions` for request lifetime.

## Enforcement rules
- `requirePermission(...x)` requires ALL listed permissions.
- `MASTER` bypasses permission checks in `requirePermission`.
- Unauthenticated request -> `UnauthorizedError`.
- Missing permission -> `ForbiddenError` with missing set.

## Change checklist
1. Add/update permission in `PERMISSIONS` (shared).
2. Update `PERMISSION_DEFINITIONS` metadata.
3. Update `DEFAULT_ROLE_PERMISSIONS` matrix intent.
4. Run seed (`npm run db:seed`).
5. Add backend guard: `requirePermission('PERMISSION_NAME')`.
6. Add/update frontend gate (`hasPermission` or `hasRole`).
7. Update files in `.agents/RULES`.
