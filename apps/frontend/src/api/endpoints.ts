import { apiClient } from './client';
import type { 
  UserProfile as UserInfo, 
  PaginationQuery, 
  ApiResponse, 
  LoginRequest as LoginInput,
  RegisterRequest as RegisterInput
} from '@brainwave/shared';



// -- Auth --
export const authApi = {
  login: (data: LoginInput) => apiClient.post<any, ApiResponse<{ accessToken: string; refreshToken: string; user: UserInfo }>>('/auth/login', data),
  register: (data: RegisterInput) => apiClient.post<any, ApiResponse<void>>('/auth/register', data),
  logout: (refreshToken: string) => apiClient.post<any, ApiResponse<void>>('/auth/logout', { refreshToken }),
  getMe: () => apiClient.get<any, ApiResponse<UserInfo>>('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) => 
    apiClient.post<any, ApiResponse<void>>('/auth/change-password', { oldPassword, newPassword }),
};

// -- Users --
export const usersApi = {
  list: (params?: PaginationQuery & { role?: string, status?: string }) => 
    apiClient.get<any, ApiResponse<any[]>>('/users', { params }),
  getById: (id: number) => apiClient.get<any, ApiResponse<any>>(`/users/${id}`),
  create: (data: any) => apiClient.post<any, ApiResponse<any>>('/users', data),
  update: (id: number, data: any) => apiClient.put<any, ApiResponse<any>>(`/users/${id}`, data),
  delete: (id: number) => apiClient.delete<any, ApiResponse<void>>(`/users/${id}`),
  resetPassword: (id: number, data: { password: string }) => apiClient.post<any, ApiResponse<void>>(`/users/${id}/reset-password`, data),
};

// -- Groups --
export const groupsApi = {
  list: (params?: PaginationQuery) => apiClient.get<any, ApiResponse<any[]>>('/groups', { params }),
  getById: (id: number) => apiClient.get<any, ApiResponse<any>>(`/groups/${id}`),
  create: (data: any) => apiClient.post<any, ApiResponse<any>>('/groups', data),
  update: (id: number, data: any) => apiClient.put<any, ApiResponse<any>>(`/groups/${id}`, data),
  delete: (id: number) => apiClient.delete<any, ApiResponse<void>>(`/groups/${id}`),
  addUsers: (id: number, userIds: number[]) => apiClient.post<any, ApiResponse<any>>(`/groups/${id}/users`, { userIds }),
  removeUser: (groupId: number, userId: number) => apiClient.delete<any, ApiResponse<void>>(`/groups/${groupId}/users/${userId}`),
};

// -- Messages --
export const messagesApi = {
  send: (data: any) => apiClient.post<any, ApiResponse<any>>('/messages/send', data),
  broadcast: (data: any) => apiClient.post<any, ApiResponse<any>>('/messages/broadcast', data),
  getCampaigns: (params?: PaginationQuery) => apiClient.get<any, ApiResponse<any[]>>('/messages/campaigns', { params }),
  getCampaignById: (id: number) => apiClient.get<any, ApiResponse<any>>(`/messages/campaigns/${id}`),
  getCampaignRecipients: (id: number, params?: PaginationQuery) => apiClient.get<any, ApiResponse<any[]>>(`/messages/campaigns/${id}/recipients`, { params }),
};

// -- Imports --
export const importsApi = {
  uploadUsers: (formData: FormData) => apiClient.post<any, ApiResponse<any>>('/import/users', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getHistory: (params?: PaginationQuery) => apiClient.get<any, ApiResponse<any[]>>('/import/history', { params }),
  getBatchDetails: (id: number) => apiClient.get<any, ApiResponse<any>>(`/import/${id}`),
};

// -- Roles & Permissions --
export const rolesApi = {
  list: () => apiClient.get<any, ApiResponse<any>>('/roles'),
};

export const permissionsApi = {
  list: () => apiClient.get<any, ApiResponse<any>>('/permissions'),
  getUserPermissions: (userId: number) => apiClient.get<any, ApiResponse<any>>(`/permissions/users/${userId}`),
  setUserPermissions: (userId: number, permissions: { permissionId: number, granted: boolean }[]) => 
    apiClient.post<any, ApiResponse<void>>(`/permissions/users/${userId}`, { permissions }),
};

// -- Audit --
export const auditApi = {
  getLogs: (params?: PaginationQuery & { module?: string; action?: string; userId?: string }) => 
    apiClient.get<any, ApiResponse<any[]>>('/audit/logs', { params }),
};

// -- Push --
export const pushApi = {
  subscribe: (data: any) => apiClient.post<any, ApiResponse<any>>('/push/subscribe', data),
  unsubscribe: (endpoint: string) => apiClient.post<any, ApiResponse<void>>('/push/unsubscribe', { endpoint }),
  getSubscriptions: () => apiClient.get<any, ApiResponse<any[]>>('/push/subscriptions'),
  getNotifications: () => apiClient.get<any, ApiResponse<any[]>>('/push/notifications'),
  markAsReadInApp: (id: number) => apiClient.put<any, ApiResponse<void>>(`/push/notifications/${id}/read-in-app`),
  markAsReadPush: (id: number) => apiClient.put<any, ApiResponse<void>>(`/push/notifications/${id}/read-push`),
  markAllAsRead: () => apiClient.put<any, ApiResponse<void>>('/push/notifications/read-all'),
};

export const publicApi = {
  getConfig: () => apiClient.get<any, ApiResponse<{ appName: string, vapidPublicKey: string }>>('/public/config'),
};
