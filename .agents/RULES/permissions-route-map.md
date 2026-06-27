# Permission Route Map

## Backend routes -> required guard

### Users (`apps/backend/src/modules/users/users.routes.ts`)
- `GET /users` -> `USER_VIEW`
- `GET /users/:id` -> `USER_VIEW`
- `POST /users` -> `USER_CREATE`
- `PUT /users/:id` -> `USER_UPDATE`
- `DELETE /users/:id` -> `USER_DELETE`
- `POST /users/:id/groups` (or equivalent group assignment endpoint in users routes) -> `USER_UPDATE`

### Groups (`apps/backend/src/modules/groups/groups.routes.ts`)
- `GET /groups` -> `GROUP_VIEW`
- `GET /groups/:id` -> `GROUP_VIEW`
- `POST /groups` -> `GROUP_CREATE`
- `PUT /groups/:id` -> `GROUP_UPDATE`
- `DELETE /groups/:id` -> `GROUP_DELETE`
- `POST /groups/:id/users` -> `GROUP_UPDATE`
- `DELETE /groups/:id/users/:userId` -> `GROUP_UPDATE`

### Messages (`apps/backend/src/modules/messages/messages.routes.ts`)
- `POST /messages/send` -> `MESSAGE_SEND`
- `POST /messages/broadcast` -> `MESSAGE_BROADCAST`
- `GET /messages/campaigns` -> `MESSAGE_HISTORY_VIEW`
- `GET /messages/campaigns/:id` -> `MESSAGE_HISTORY_VIEW`
- `GET /messages/campaigns/:id/recipients` -> `MESSAGE_HISTORY_VIEW`

### Imports (`apps/backend/src/modules/imports/imports.routes.ts`)
- `POST /imports/*` upload/parse/create flow -> `USER_IMPORT`
- `GET /imports/history` -> `USER_IMPORT`
- `GET /imports/:id` -> `USER_IMPORT`

### Moderation permissions (`apps/backend/src/modules/permissions/permissions.routes.ts`)
- Permission assignment/list endpoints -> `MODERATOR_UPDATE`

### Push (`apps/backend/src/modules/push/push.routes.ts`)
- `POST /push/send` -> `PUSH_NOTIFICATION_SEND`

### Audit (`apps/backend/src/modules/audit/audit.routes.ts`)
- `GET /audit/logs` -> `authorize('MASTER')` + `AUDIT_LOG_VIEW`

## Frontend gates

### Sidebar (`apps/frontend/src/components/layout/Sidebar.tsx`)
- `/users` -> `USER_VIEW`
- `/import` -> `USER_IMPORT`
- `/groups` -> `GROUP_VIEW`
- `/messages/send` -> `MESSAGE_SEND`
- `/messages/history` -> `MESSAGE_HISTORY_VIEW`
- `/moderators` -> `MODERATOR_UPDATE`
- `/permissions` -> `MODERATOR_UPDATE`
- `/activity` -> role `MASTER`

### User form (`apps/frontend/src/components/users/UserFormModal.tsx`)
- Role select hides `MASTER` option unless actor has role `MASTER`.

## Gap watch
- `SETTINGS_MANAGE` exists in shared constants but has no observed backend route guard in current code scan.
- When settings API becomes sensitive, enforce `requirePermission('SETTINGS_MANAGE')` and update this map.
