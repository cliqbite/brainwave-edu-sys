import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { Bell, Search, LogOut, User } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, pushApi } from '../../api/endpoints';

import { usePushNotifications } from '../../hooks/usePushNotifications';
import { NotificationDrawer } from './NotificationDrawer';

export const Header = () => {
  const { user, logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { hasPushPermission, isSubscribing } = usePushNotifications();

  // Handle URL param from clicking push notification
  useEffect(() => {
    const readPushId = searchParams.get('readPush');
    if (readPushId) {
      pushApi.markAsReadPush(Number(readPushId)).catch(console.error);
      searchParams.delete('readPush');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Handle postMessage from Service Worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_READ') {
        pushApi.markAsReadPush(Number(event.data.recipientId)).catch(console.error);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, []);

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await pushApi.getNotifications();
      return res.data || [];
    },
    refetchInterval: 30000, // Poll every 30s for new notifs
  });

  const unreadCount = notificationsData ? notificationsData.filter((n: any) => !n.inAppRead).length : 0;

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (e) {
        console.error('Logout failed', e);
      }
    }
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-8 z-30 sticky top-0 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="form-input !pl-9 !py-1.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              className={`btn-icon relative ${isSubscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setIsDrawerOpen(true)}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {!hasPushPermission && unreadCount === 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></span>}
            </button>
          </div>

        <div className="relative">
          <button 
            className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-500/30">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">{user?.name}</span>
              <span className="text-xs text-muted mt-1">{user?.role?.displayName}</span>
            </div>
          </button>

          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 glass-card z-20 py-1 overflow-hidden animate-slide-up">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-white/10 mb-1">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </header>
      <NotificationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};
