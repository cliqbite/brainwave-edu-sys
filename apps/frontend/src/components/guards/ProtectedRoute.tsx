import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../api/endpoints';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, accessToken, user, setUser, logout, refreshToken } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && accessToken && !user) {
      authApi.getMe()
        .then((res) => {
          if (res.data) setUser(res.data);
        })
        .catch(() => {
          // getMe failed — token corrupt/expired. Attempt revoke if we have a refresh token,
          // then clear local state regardless of API result.
          if (refreshToken) {
            authApi.logout(refreshToken).catch(() => {});
          }
          logout();
        });
    }
  }, [isAuthenticated, accessToken, user, setUser, logout, refreshToken]);

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
