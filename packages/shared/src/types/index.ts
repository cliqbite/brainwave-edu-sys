// ============================================================
// Brainwave EduSys - Shared Types
// ============================================================

import type { RoleName } from '../constants/roles.js';
import type { PermissionName } from '../constants/permissions.js';
import type { UserStatus, GroupStatus, GroupType, CampaignStatus, RecipientType, MessageChannel } from '../constants/statuses.js';

// ---- API Response ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ApiError[];
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ---- Auth ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UserProfile {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  whatsappNumber: string | null;
  rollNumber: string | null;
  department: string | null;
  className: string | null;
  role: {
    id: number;
    name: RoleName;
    displayName: string;
  };
  permissions: PermissionName[];
  status: UserStatus;
  createdAt: string;
}

// ---- Users ----

export interface UserListItem {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  whatsappNumber: string | null;
  rollNumber: string | null;
  department: string | null;
  className: string | null;
  role: { name: RoleName; displayName: string };
  status: UserStatus;
  groupCount: number;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  whatsappNumber?: string;
  rollNumber?: string;
  department?: string;
  className?: string;
  roleId?: number;
  groupIds?: number[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  rollNumber?: string;
  department?: string;
  className?: string;
  status?: UserStatus;
  roleId?: number;
}

// ---- Groups ----

export interface GroupListItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  type: GroupType;
  status: GroupStatus;
  userCount: number;
  createdAt: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  type?: GroupType;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  type?: GroupType;
  status?: GroupStatus;
}

// ---- Messages ----

export interface SendMessageRequest {
  messageBody: string;
  channel: MessageChannel;
  recipientType: RecipientType;
  userIds?: number[];
  groupIds?: number[];
  title?: string;
}

export interface CampaignListItem {
  id: number;
  uuid: string;
  title: string | null;
  messageBody: string;
  channel: MessageChannel;
  recipientType: RecipientType;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdBy: { name: string };
  createdAt: string;
  completedAt: string | null;
}

// ---- Import ----

export interface ImportSummary {
  batchId: string;
  filename: string;
  totalRows: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  status: string;
  errors: Array<{ row: number; message: string }>;
}

// ---- Push Notifications ----

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface SendPushRequest {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, unknown>;
  recipientType: RecipientType;
  userIds?: number[];
  groupIds?: number[];
}

// ---- Audit Log ----

export interface AuditLogEntry {
  id: number;
  user: { id: number; name: string; email: string } | null;
  action: string;
  module: string;
  targetType: string | null;
  targetId: number | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

// ---- WhatsApp Provider ----

export interface SendWhatsAppPayload {
  to: string;
  message: string;
  type?: 'text' | 'template' | 'media';
  templateName?: string;
  mediaUrl?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
