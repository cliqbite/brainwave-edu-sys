# Changelog

All notable changes to the Brainwave EduSys project will be documented in this file.

## [Unreleased] - 2026-06-27

### Added
- **Profile Page**: Added a `/profile` route displaying user details and an interface to update their password.
- **Change Password API**: Created the `POST /api/v1/auth/change-password` endpoint.
- **Notification Drawer**: Replaced the small notifications dropdown with a slide-out drawer component for a better user experience.
- **Independent Notification Read States**: Added separate tracking for OS-level Push reads (`pushRead`) and In-App reads (`inAppRead`).
- **Notification Read APIs**: Added `PUT /api/v1/push/notifications/:id/read-in-app`, `PUT /api/v1/push/notifications/:id/read-push`, and `PUT /api/v1/push/notifications/read-all`.
- **UI/UX Overhaul**: Upgraded the frontend to use Tailwind CSS v4 with a premium glassmorphism dark mode aesthetic.
- **Master Password Reset**: Added a new feature allowing users with the `MASTER` role to reset any user's password directly from the UI.
  - Added `POST /api/v1/users/:id/reset-password` backend endpoint.
  - Added "Reset Pwd" action button to the Users table for MASTER accounts.
- **Premium Data Tables**: Completely restyled the generic `Table.tsx` component (powered by `@tanstack/react-table`) to match the new dark mode aesthetics with proper hover states, borders, and loaders.

### Changed
- **Prisma 7 Migration**: Upgraded `prisma`, `@prisma/client` (v5.22 → v7.8) in both `backend` and `worker` workspaces.
  - Prisma 7 dropped native binary engine. New `"client"` engine requires a driver adapter for direct DB connections.
  - Removed `url` from `datasource db` in `schema.prisma` and removed `engineType = "library"` from generator (both invalid in v7).
  - Created `apps/backend/prisma.config.ts` with `defineConfig({ datasource: { url } })` — CLI commands (`migrate`, `studio`, etc.) read the connection URL from here.
  - Installed `@prisma/adapter-mariadb` (Prisma 7's MySQL-compatible adapter) in `backend` and `worker`.
  - Updated `PrismaClient` in `database.ts` and `worker/index.ts` to use `new PrismaMariaDb(DATABASE_URL)` as the adapter — adapter manages the connection pool internally.
- **Decoupled Push Subscriptions**: Modified the database schema (`PushNotificationRecipient`) to make `subscriptionId` optional. Broadcasts now successfully generate in-app notifications even if the user has not explicitly subscribed to OS-level web push notifications.
- **Service Worker Interaction**: Updated `sw.js` to intelligently append `recipientId` data when focusing application windows, enabling background read-tracking of offline web-pushes.
- **React Router Upgrade**: Migrated from `<BrowserRouter>` to the modern `createBrowserRouter` API (React Router v6/v7) for better data loading support and future-proofing.
- **Dashboard Navigation**: Upgraded all Quick Action links on the Dashboard from standard `<a>` tags to React Router `<Link>` components to enable fast client-side routing without full page reloads.

### Added
- **Light/Dark Theme**: Full light and dark mode support across entire frontend using Tailwind v4 class strategy (`.dark` on `<html>`).
  - `ThemeProvider` in `main.tsx` syncs `<html>` class with Zustand `ui.store.ts` `theme` field.
  - Theme persisted via `zustand/middleware` `persist` under key `ui-storage`.
  - Default theme: `dark`. Switchable per user in Profile → Appearance section.
  - `index.css` defines all semantic utilities: `text-muted`, `text-primary`, `text-danger`, `text-success`, `text-muted-foreground`, `bg-primary`, `bg-muted`, `border-border` — all themed for light/dark.
  - All glass-card, btn-secondary, btn-danger, btn-icon, form-label, form-input, badge variants have `.dark` overrides.
  - Files updated: `Sidebar.tsx`, `Header.tsx`, `NotificationDrawer.tsx`, `Modal.tsx`, `Table.tsx`, `Select.tsx`, `Button.tsx`, `GroupFormModal.tsx`, `GroupMembersModal.tsx`, `DashboardPage.tsx`, `UsersPage.tsx`, `GroupsPage.tsx`, `MessagesPage.tsx`, `MessageHistoryPage.tsx`, `ProfilePage.tsx`.
- **Theme Toggle UI**: Sun/Moon toggle buttons added to `ProfilePage.tsx` under "Appearance" card — calls `useUiStore().setTheme()`.
- **Dynamic Toaster**: `App.tsx` `Toaster` reads `useUiStore().theme` and switches `background`, `color`, `border` styles between light and dark.
- **CLAUDE.md Rules**: Added `## Rules` section with migration rules and permission rules to guide AI-assisted development. Covers migration immutability, additive-first strategy, dev vs prod workflow differences, and `prisma.config.ts` env note.
- **Database Schema Diagram**: Created `docs/DATABASE_SCHEMA.md` — full Mermaid ERD of all 17 tables with column types, relationships, table summary, and key design notes. Rule added: update this file after every migration.

### Fixed
- **User Update Bug**: Fixed a `ReferenceError` (`Cannot access 'user' before initialization`) in `users.service.ts` that caused the user update API to crash during audit log creation.
- **API Pagination Types**: Fixed a critical TypeScript bug where the frontend incorrectly expected nested paginated data (`data.data.data`), causing data tables (Users, Groups, Campaigns, etc.) to incorrectly show "No data found". The frontend now correctly parses the array (`data.data`) and pagination metadata (`data.meta`).
- **Sidebar State Synchronization**: Ensured that the sidebar navigation correctly triggers UI updates when using client-side routing.
- **Vite Configuration**: Cleaned up the `vite.config.ts` to fully integrate the new `@tailwindcss/vite` plugin and removed stale `.js` configuration files generated by `tsc`.
