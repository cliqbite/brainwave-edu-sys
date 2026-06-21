import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../api/endpoints';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, accessToken, user, setUser, logout } = useAuthStore();

  useEffect(() => {
    // If we have a token but no user object, fetch it
    if (isAuthenticated && accessToken && !user) {
      authApi.getMe()
        .then((res) => {
          if (res.data) setUser(res.data);
        })
        .catch(() => {
          logout();
        });
    }
  }, [isAuthenticated, accessToken, user, setUser, logout]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
