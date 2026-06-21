import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import type { PermissionName, RoleName } from '@brainwave/shared';

export const PermissionGuard = ({ 
  permission, 
  children, 
  fallback = <Navigate to="/dashboard" replace />
}: { 
  permission: PermissionName; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const { hasPermission } = useAuthStore();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export const RoleGuard = ({ 
  role, 
  children, 
  fallback = <Navigate to="/dashboard" replace />
}: { 
  role: RoleName; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const { hasRole } = useAuthStore();

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
