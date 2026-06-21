---
name: Database and Prisma
description: Guidelines for managing the database schema, running migrations safely, and using dotenv-cli.
---

# Database and Prisma Guidelines

This project uses Prisma ORM.

## 1. Local Environment Variables
- Prisma operations often require environment variables defined in `.env.development`.
- Because the `.env` file is not located in the exact same directory as the `prisma` folder or is named differently, you MUST use `dotenv-cli` to inject the variables when running manual prisma commands in the terminal.
- **Example**: To run a migration locally inside `apps/backend/`:
  `npx dotenv-cli -e ../../.env.development -- npx prisma migrate dev --name <migration_name>`
- Do NOT use standard `npx prisma migrate dev` without `dotenv-cli` as it will fail to connect to the database.
- Alternatively, you can run the npm scripts defined in `apps/backend/package.json` (e.g., `npm run db:migrate`), but passing specific flags (like `--name`) to npm scripts can sometimes be tricky.

## 2. Schema Changes
- All schema definitions are in `apps/backend/prisma/schema.prisma`.
- When modifying the schema:
  1. Make the changes to `schema.prisma`.
  2. Run the migration command (using dotenv-cli).
  3. Ensure the generated Prisma client is updated.
  4. **CRITICAL**: If you modify the schema and are communicating with the user, explicitly tell them to **Restart their backend and worker terminals** (`npm run dev:backend` and `npm run dev:worker`) so the Node processes pick up the new generated client code.

## 3. Seeding
- The database requires initial seed data (Roles, Permissions, Master user) to function.
- The seed script is located at `apps/backend/prisma/seed.ts`.
- Run it using: `npx dotenv-cli -e ../../.env.development -- npx prisma db seed`
