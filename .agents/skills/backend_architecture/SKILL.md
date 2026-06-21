---
name: Backend API and Architecture
description: Guidelines for building Express.js backend services, using Prisma, standard response formats, and audit logging.
---

# Backend API Guidelines

When building or modifying backend modules in `apps/backend/src/modules/`, follow these strict architectural patterns.

## 1. Directory Structure (Modular)
Each feature should have its own module directory containing:
- `[module].routes.ts`: Defines Express routes and attaches middlewares.
- `[module].controller.ts`: Handles Request/Response objects, calls services, and sends standard responses.
- `[module].service.ts`: Contains all core business logic and Prisma database interactions.
- `[module].validator.ts`: Contains Zod schemas for input validation.

## 2. Standard Responses & Error Handling
- **Success**: NEVER use `res.json()` directly in controllers. Always use the `sendSuccess` utility from `../../utils/response.ts`.
  - Example: `sendSuccess(res, data, 'Success message');`
- **Errors**: Throw specific error classes from `../../utils/errors.ts` inside your services or controllers. Do NOT use `try/catch` in controllers.
  - Example: `throw new NotFoundError('User not found');`
  - Example: `throw new UnauthorizedError('Invalid token');`
  - Example: `throw new ConflictError('Email already exists');`
- **Async Handling**: Wrap all controller methods in `asyncHandler` in the routes file. This automatically catches thrown errors and passes them to the global error handler middleware.

## 3. Prisma Database Access
- Use the shared `prisma` client from `../../config/database.ts`.
- **Transactions**: For operations modifying multiple tables (e.g., creating a user and their audit log), always use `$transaction`.
- **Soft Deletes**: When "deleting" a record, do not use `prisma.user.delete()`. Instead, update the `deletedAt` field: `prisma.user.update({ data: { deletedAt: new Date() } })`.

## 4. Audit Logging
- Critical actions (CREATE, UPDATE, DELETE) on core entities (Users, Roles, Groups) MUST generate an audit log record.
- Do this inside a `$transaction` along with the primary operation.
- Be careful with variable scoping when building the `newValues` object for the audit log (avoid `ReferenceError` by not accessing the entity variable before it is initialized).

## 5. Authentication & Authorization
- Use the `authenticate()` middleware to protect routes that require a logged-in user.
- Use the `requirePermission('PERMISSION_NAME')` middleware to enforce RBAC.
- Access the logged-in user's ID via `req.user.id`.
