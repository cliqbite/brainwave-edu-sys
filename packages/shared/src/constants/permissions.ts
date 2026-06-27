// ============================================================
// Brainwave EduSys - Permission Constants
// ============================================================

export const PERMISSIONS = {
  // User Management
  USER_VIEW: 'USER_VIEW',
  USER_CREATE: 'USER_CREATE',
  USER_IMPORT: 'USER_IMPORT',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',

  // Group Management
  GROUP_VIEW: 'GROUP_VIEW',
  GROUP_CREATE: 'GROUP_CREATE',
  GROUP_UPDATE: 'GROUP_UPDATE',
  GROUP_DELETE: 'GROUP_DELETE',

  // Messaging
  MESSAGE_SEND: 'MESSAGE_SEND',
  MESSAGE_BROADCAST: 'MESSAGE_BROADCAST',
  MESSAGE_HISTORY_VIEW: 'MESSAGE_HISTORY_VIEW',

  // Moderator Management
  MODERATOR_CREATE: 'MODERATOR_CREATE',
  MODERATOR_UPDATE: 'MODERATOR_UPDATE',

  // Push Notifications
  PUSH_NOTIFICATION_SEND: 'PUSH_NOTIFICATION_SEND',

  // Settings
  SETTINGS_MANAGE: 'SETTINGS_MANAGE',

  // Audit Logs
  AUDIT_LOG_VIEW: 'AUDIT_LOG_VIEW',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_MODULES = {
  USERS: 'USERS',
  GROUPS: 'GROUPS',
  MESSAGES: 'MESSAGES',
  MODERATORS: 'MODERATORS',
  PUSH: 'PUSH',
  SETTINGS: 'SETTINGS',
  AUDIT: 'AUDIT',
} as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[keyof typeof PERMISSION_MODULES];

/** All permission definitions with metadata for seeding */
export const PERMISSION_DEFINITIONS: Array<{
  name: PermissionName;
  displayName: string;
  module: PermissionModule;
  description: string;
}> = [
  { name: PERMISSIONS.USER_VIEW, displayName: 'View Users', module: 'USERS', description: 'View user list and details' },
  { name: PERMISSIONS.USER_CREATE, displayName: 'Create Users', module: 'USERS', description: 'Create new users' },
  { name: PERMISSIONS.USER_IMPORT, displayName: 'Import Users', module: 'USERS', description: 'Import users from CSV/Excel' },
  { name: PERMISSIONS.USER_UPDATE, displayName: 'Update Users', module: 'USERS', description: 'Edit user information' },
  { name: PERMISSIONS.USER_DELETE, displayName: 'Delete Users', module: 'USERS', description: 'Delete users' },

  { name: PERMISSIONS.GROUP_VIEW, displayName: 'View Groups', module: 'GROUPS', description: 'View group list and details' },
  { name: PERMISSIONS.GROUP_CREATE, displayName: 'Create Groups', module: 'GROUPS', description: 'Create new groups/categories' },
  { name: PERMISSIONS.GROUP_UPDATE, displayName: 'Update Groups', module: 'GROUPS', description: 'Edit group information' },
  { name: PERMISSIONS.GROUP_DELETE, displayName: 'Delete Groups', module: 'GROUPS', description: 'Delete groups' },

  { name: PERMISSIONS.MESSAGE_SEND, displayName: 'Send Messages', module: 'MESSAGES', description: 'Send individual messages' },
  { name: PERMISSIONS.MESSAGE_BROADCAST, displayName: 'Broadcast Messages', module: 'MESSAGES', description: 'Send broadcast messages to groups' },
  { name: PERMISSIONS.MESSAGE_HISTORY_VIEW, displayName: 'View Message History', module: 'MESSAGES', description: 'View message campaigns and delivery status' },

  { name: PERMISSIONS.MODERATOR_CREATE, displayName: 'Create Moderators', module: 'MODERATORS', description: 'Create moderator accounts' },
  { name: PERMISSIONS.MODERATOR_UPDATE, displayName: 'Update Moderators', module: 'MODERATORS', description: 'Edit moderator permissions' },

  { name: PERMISSIONS.PUSH_NOTIFICATION_SEND, displayName: 'Send Push Notifications', module: 'PUSH', description: 'Send web push notifications' },

  { name: PERMISSIONS.SETTINGS_MANAGE, displayName: 'Manage Settings', module: 'SETTINGS', description: 'Manage system settings' },

  { name: PERMISSIONS.AUDIT_LOG_VIEW, displayName: 'View Audit Logs', module: 'AUDIT', description: 'View activity/changelog logs' },
];

/** Default permissions granted to each role during seeding */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionName[]> = {
  MASTER: Object.values(PERMISSIONS),
  ADMIN: Object.values(PERMISSIONS).filter(p => p !== PERMISSIONS.AUDIT_LOG_VIEW && p !== PERMISSIONS.USER_IMPORT),
  MODERATOR: [], // Moderators get NO default permissions — admin grants individually
  USER: [],      // Normal users get NO management permissions
};
