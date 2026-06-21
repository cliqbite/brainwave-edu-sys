# Brainwave EduSys — API Documentation

> Base URL: `/api/v1`

All responses follow the standard format:

```json
{
  "success": true,
  "message": "Description",
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Email is required" }]
}
```

---

## Public Endpoints

### Health Check

```
GET /api/v1/health
```

Response: `{ "success": true, "message": "Brainwave EduSys API is running" }`

### Public Config

```
GET /api/v1/public/config
```

Response: `{ "appName": "Brainwave EduSys", "vapidPublicKey": "..." }`

---

## Authentication

### Register

```
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+919876543210"
}
```

### Login

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhb...",
    "refreshToken": "eyJhb...",
    "user": {
      "id": 1,
      "uuid": "abc-123",
      "name": "Admin",
      "email": "admin@example.com",
      "role": { "name": "ADMIN", "displayName": "Admin" },
      "permissions": ["USER_VIEW", "USER_CREATE", ...]
    }
  }
}
```

### Refresh Token

```
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhb..."
}
```

### Logout

```
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "eyJhb..."
}
```

### Get Current User

```
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

---

## Users

> Requires authentication. Permission checks applied.

### List Users

```
GET /api/v1/users?page=1&limit=20&search=john&sortBy=name&sortOrder=asc
Authorization: Bearer <accessToken>
Permission: USER_VIEW
```

### Get User by ID

```
GET /api/v1/users/:id
Authorization: Bearer <accessToken>
Permission: USER_VIEW
```

### Create User

```
POST /api/v1/users
Authorization: Bearer <accessToken>
Permission: USER_CREATE
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "TempPass123!",
  "phone": "+919876543210",
  "whatsappNumber": "+919876543210",
  "rollNumber": "CS2024001",
  "department": "Computer Science",
  "className": "CSE-A",
  "groupIds": [1, 3]
}
```

### Update User

```
PUT /api/v1/users/:id
Authorization: Bearer <accessToken>
Permission: USER_UPDATE
```

### Delete User

```
DELETE /api/v1/users/:id
Authorization: Bearer <accessToken>
Permission: USER_DELETE
```

---

## Groups

> Permission: GROUP_VIEW / GROUP_CREATE / GROUP_UPDATE / GROUP_DELETE

### List Groups

```
GET /api/v1/groups?page=1&limit=20&search=class
Authorization: Bearer <accessToken>
```

### Create Group

```
POST /api/v1/groups
Authorization: Bearer <accessToken>

{
  "name": "CSE Department",
  "description": "Computer Science students",
  "type": "DEPARTMENT"
}
```

### Add Users to Group

```
POST /api/v1/groups/:id/users
Authorization: Bearer <accessToken>

{
  "userIds": [1, 2, 3, 5]
}
```

### Remove User from Group

```
DELETE /api/v1/groups/:id/users/:userId
Authorization: Bearer <accessToken>
```

---

## Import

> Permission: USER_IMPORT

### Import Users from CSV/Excel

```
POST /api/v1/import/users
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file: <CSV or XLSX file>
groupIds: [1, 2] (optional JSON string)
```

CSV Format:

```csv
name,email,phone,whatsappNumber,rollNumber,department,className
John Doe,john@example.com,+919876543210,+919876543210,CS001,CSE,CSE-A
```

Response:

```json
{
  "data": {
    "batchId": "abc-123",
    "totalRows": 100,
    "successCount": 95,
    "skippedCount": 3,
    "failedCount": 2,
    "errors": [
      { "row": 15, "message": "Invalid email format" },
      { "row": 42, "message": "Duplicate email" }
    ]
  }
}
```

### Import History

```
GET /api/v1/import/history?page=1&limit=20
Authorization: Bearer <accessToken>
```

---

## Messages

> Permission: MESSAGE_SEND / MESSAGE_BROADCAST / MESSAGE_HISTORY_VIEW

### Send Message

```
POST /api/v1/messages/send
Authorization: Bearer <accessToken>

{
  "messageBody": "Hello! Your exam is scheduled for...",
  "channel": "WHATSAPP",
  "recipientType": "SINGLE",
  "userIds": [5]
}
```

### Broadcast Message

```
POST /api/v1/messages/broadcast
Authorization: Bearer <accessToken>

{
  "messageBody": "Attention all students...",
  "channel": "BOTH",
  "recipientType": "GROUP",
  "groupIds": [1, 3],
  "title": "Exam Notification"
}
```

### Campaign History

```
GET /api/v1/messages/campaigns?page=1&limit=20
Authorization: Bearer <accessToken>
```

### Campaign Recipients

```
GET /api/v1/messages/campaigns/:id/recipients
Authorization: Bearer <accessToken>
```

---

## Push Notifications

### Subscribe

```
POST /api/v1/push/subscribe
Authorization: Bearer <accessToken>

{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### Send Push Notification

```
POST /api/v1/push/send
Authorization: Bearer <accessToken>
Permission: PUSH_NOTIFICATION_SEND

{
  "title": "New Announcement",
  "body": "Check the latest exam schedule",
  "recipientType": "GROUP",
  "groupIds": [1]
}
```

---

## Roles & Permissions

### List Roles

```
GET /api/v1/roles
Authorization: Bearer <accessToken>
```

### List Permissions

```
GET /api/v1/permissions
Authorization: Bearer <accessToken>
```

### Set User Permissions

```
POST /api/v1/permissions/users/:userId
Authorization: Bearer <accessToken>
Permission: MODERATOR_UPDATE

{
  "permissions": [
    { "permissionId": 1, "granted": true },
    { "permissionId": 5, "granted": false }
  ]
}
```

---

## Audit Logs

> Requires MASTER role and AUDIT_LOG_VIEW permission

### Get Activity Logs

```
GET /api/v1/audit/logs?page=1&limit=50&module=USERS&action=CREATE
Authorization: Bearer <accessToken>
```
