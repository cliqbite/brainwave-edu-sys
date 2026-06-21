// ============================================================
// Brainwave EduSys - Status Constants
// ============================================================

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const GROUP_STATUS = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;

export type GroupStatus = (typeof GROUP_STATUS)[keyof typeof GROUP_STATUS];

export const GROUP_TYPE = {
  CLASS: 'CLASS',
  DEPARTMENT: 'DEPARTMENT',
  CUSTOM: 'CUSTOM',
} as const;

export type GroupType = (typeof GROUP_TYPE)[keyof typeof GROUP_TYPE];

export const MESSAGE_CHANNEL = {
  WHATSAPP: 'WHATSAPP',
  PUSH: 'PUSH',
  BOTH: 'BOTH',
} as const;

export type MessageChannel = (typeof MESSAGE_CHANNEL)[keyof typeof MESSAGE_CHANNEL];

export const RECIPIENT_TYPE = {
  SINGLE: 'SINGLE',
  MULTIPLE: 'MULTIPLE',
  GROUP: 'GROUP',
  ALL: 'ALL',
} as const;

export type RecipientType = (typeof RECIPIENT_TYPE)[keyof typeof RECIPIENT_TYPE];

export const CAMPAIGN_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  PARTIAL_FAILED: 'PARTIAL_FAILED',
} as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export const MESSAGE_RECIPIENT_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;

export type MessageRecipientStatus = (typeof MESSAGE_RECIPIENT_STATUS)[keyof typeof MESSAGE_RECIPIENT_STATUS];

export const IMPORT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type ImportStatus = (typeof IMPORT_STATUS)[keyof typeof IMPORT_STATUS];

export const IMPORT_ROW_STATUS = {
  SUCCESS: 'SUCCESS',
  SKIPPED: 'SKIPPED',
  FAILED: 'FAILED',
} as const;

export type ImportRowStatus = (typeof IMPORT_ROW_STATUS)[keyof typeof IMPORT_ROW_STATUS];

export const IMPORT_FILE_TYPE = {
  CSV: 'CSV',
  XLSX: 'XLSX',
} as const;

export type ImportFileType = (typeof IMPORT_FILE_TYPE)[keyof typeof IMPORT_FILE_TYPE];

export const PUSH_STATUS = {
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;

export type PushStatus = (typeof PUSH_STATUS)[keyof typeof PUSH_STATUS];

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  IMPORT: 'IMPORT',
  SEND_MESSAGE: 'SEND_MESSAGE',
  SEND_BROADCAST: 'SEND_BROADCAST',
  SEND_NOTIFICATION: 'SEND_NOTIFICATION',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
