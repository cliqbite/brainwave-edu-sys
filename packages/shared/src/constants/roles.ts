// ============================================================
// Brainwave EduSys - Role Constants
// ============================================================

export const ROLES = {
  MASTER: 'MASTER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  USER: 'USER',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_DISPLAY_NAMES: Record<RoleName, string> = {
  MASTER: 'Master',
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
  USER: 'User',
};

export const ROLE_HIERARCHY: Record<RoleName, number> = {
  MASTER: 100,
  ADMIN: 80,
  MODERATOR: 40,
  USER: 10,
};
