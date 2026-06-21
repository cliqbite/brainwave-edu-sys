---
name: Web-Push Notifications
description: Architecture and guidelines for working with the Brainwave EduSys web-push notification and broadcast system.
---

# Web-Push Notification System Architecture

This project uses a combination of OS-level Web-Push notifications and in-app polling to deliver broadcasts to users.

## 1. Components
- **BullMQ Background Worker**: Handles the actual dispatch of push payloads to browser vendors (FCM, Apple Push) using `web-push` and VAPID keys.
- **Service Worker (`sw.js`)**: Runs in the background of the user's browser, receives the push event, and draws the OS desktop notification popup.
- **Backend API**: The `push.service.ts` and `messages.service.ts` handle storing notifications in the database.

## 2. Database Schema (`PushNotificationRecipient`)
When a broadcast is sent, you MUST create records in the `PushNotificationRecipient` table.
- **Crucial Note**: The `subscriptionId` is OPTIONAL. You should create a recipient record for EVERY targeted user, regardless of whether they have an active web-push subscription. This ensures the notification appears in their in-app dashboard.
- **Read States**: There are two separate read states:
  - `inAppRead`: Triggered when the user views the notification inside the React dashboard.
  - `pushRead`: Triggered silently when the user clicks the OS desktop notification popup.

## 3. Read Endpoints
Always use the specific endpoints for marking read states:
- `PUT /api/v1/push/notifications/:id/read-in-app`
- `PUT /api/v1/push/notifications/:id/read-push`
- `PUT /api/v1/push/notifications/read-all`

## 4. Service Worker Interaction
- When the user clicks the desktop notification, `sw.js` intercepts the `notificationclick` event.
- It attempts to find an open window for the app. If found, it sends a `postMessage({ type: 'PUSH_READ', recipientId })`.
- If no window is open, it opens a new window and appends `?readPush=<recipientId>` to the URL.
- The frontend `Header.tsx` listens for both of these events to silently call the `read-push` API.
