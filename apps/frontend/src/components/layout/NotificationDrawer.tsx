import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pushApi } from '../../api/endpoints';
import { X, CheckCheck } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer = ({ isOpen, onClose }: NotificationDrawerProps) => {
  const queryClient = useQueryClient();
  const { hasPushPermission, isSubscribing, subscribe } = usePushNotifications();

  const { data: notificationsData, isLoading: isLoadingNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await pushApi.getNotifications();
      return res.data || [];
    },
    refetchInterval: 30000,
  });

  const handleMarkAllRead = async () => {
    try {
      await pushApi.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.inAppRead) {
      try {
        await pushApi.markAsReadInApp(notif.id);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (e) {
        console.error('Failed to mark as read', e);
      }
    }
  };

  const unreadCount = notificationsData ? notificationsData.filter((n: any) => !n.inAppRead).length : 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-[calc(100vw-16px)] sm:w-96 bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/30">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-brand-400 font-medium mt-0.5">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors group relative"
                title="Mark all as read"
              >
                <CheckCheck size={18} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Desktop Push Banner (if needed) */}
        {!hasPushPermission && (
          <div className="mx-4 mt-4 p-3 rounded-xl border border-brand-500/20 bg-brand-500/10 shrink-0">
            <p className="text-xs text-brand-200/90 mb-2 font-medium">Enable push notifications to get alerts even when the app is closed.</p>
            <button 
              className="px-3 py-1.5 w-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              onClick={() => subscribe()}
              disabled={isSubscribing}
            >
              {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {isLoadingNotifs ? (
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-slate-400">Loading notifications...</p>
            </div>
          ) : notificationsData && notificationsData.length > 0 ? (
            <div className="space-y-2">
              {notificationsData.map((notif: any) => (
                <div 
                  key={notif.id} 
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 rounded-xl border flex gap-3 transition-colors cursor-pointer ${
                    !notif.inAppRead 
                      ? 'border-brand-500/30 bg-brand-500/5 hover:bg-brand-500/10' 
                      : 'border-transparent hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-sm truncate pr-2 ${!notif.inAppRead ? 'font-bold text-white' : 'font-semibold text-slate-300'}`}>
                        {notif.notification?.title}
                      </p>
                      {!notif.inAppRead && (
                        <span className="w-2.5 h-2.5 bg-brand-500 rounded-full mt-1 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed line-clamp-3 ${!notif.inAppRead ? 'text-slate-300' : 'text-slate-400'}`}>
                      {notif.notification?.body}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-white/5">
                <CheckCheck size={28} className="text-slate-500" />
              </div>
              <p className="text-slate-300 font-medium">You're all caught up!</p>
              <p className="text-xs text-slate-500 mt-1">No new notifications.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
