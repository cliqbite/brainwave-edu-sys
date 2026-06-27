import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, Badge, Table } from '../components/ui';
import { 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  UsersRound, 
  Bell
} from 'lucide-react';
import { usersApi, groupsApi, messagesApi, pushApi } from '../api/endpoints';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useAuthStore } from '../stores/auth.store';
import { usePushNotifications } from '../hooks/usePushNotifications';

const columnHelper = createColumnHelper<any>();

const columns = [
  // ... (keep columns as is)
  columnHelper.accessor('title', {
    header: 'Campaign',
    cell: info => info.getValue() || 'Untitled Broadcast',
  }),
  columnHelper.accessor('channel', {
    header: 'Channel',
    cell: info => <Badge variant="default">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue();
      const variant = status === 'SENT' ? 'success' : status === 'FAILED' ? 'danger' : status === 'PENDING' ? 'warning' : 'info';
      return <Badge variant={variant}>{status}</Badge>;
    },
  }),
  columnHelper.accessor('totalRecipients', {
    header: 'Recipients',
  }),
  columnHelper.accessor('createdAt', {
    header: 'Date',
    cell: info => new Date(info.getValue()).toLocaleDateString(),
  }),
];

const PushNotificationBanner = () => {
  const { hasPushPermission, isSubscribing, subscribe } = usePushNotifications();

  if (hasPushPermission) return null;

  return (
    <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-500/20 text-brand-400 rounded-lg">
          <Bell size={20} className="animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold text-brand-100">Enable Push Notifications</h3>
          <p className="text-sm text-brand-200/70 mt-0.5">Get instantly notified about important updates and new messages.</p>
        </div>
      </div>
      <button 
        onClick={subscribe} 
        disabled={isSubscribing}
        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
      >
        {isSubscribing ? 'Enabling...' : 'Enable Now'}
      </button>
    </div>
  );
};

const UserDashboard = () => {
  const queryClient = useQueryClient();
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await pushApi.getNotifications();
      return res.data || [];
    },
  });

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

  return (
    <div className="space-y-6 animate-fade-in">
      <PushNotificationBanner />
      <div>
        <h1 className="text-2xl font-bold">My Notifications</h1>
        <p className="text-slate-400">View your latest messages and alerts</p>
      </div>

      <Card>
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-slate-500">Loading notifications...</p>
          </div>
        ) : !notificationsData || notificationsData.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Bell className="text-slate-400 dark:text-slate-500" size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">You're all caught up!</h3>
            <p className="text-slate-500 mt-2">You have no new notifications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notificationsData.map((notification: any) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-xl border flex gap-4 transition-colors cursor-pointer ${
                  !notification.inAppRead
                    ? 'border-brand-500/30 bg-brand-500/5 hover:bg-brand-500/10'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className={`p-2 rounded-lg h-fit ${!notification.inAppRead ? 'bg-brand-500/20 text-brand-500 dark:text-brand-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-semibold ${!notification.inAppRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                      {notification.notification?.title}
                    </h3>
                    {!notification.inAppRead && (
                      <span className="w-2.5 h-2.5 bg-brand-500 rounded-full mt-1 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${!notification.inAppRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {notification.notification?.body}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const AdminDashboard = () => {
  // Fetch high-level stats
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users', { limit: 1 }],
    queryFn: () => usersApi.list({ limit: 1 }),
  });

  const { data: groupsData, isLoading: loadingGroups } = useQuery({
    queryKey: ['groups', { limit: 1 }],
    queryFn: () => groupsApi.list({ limit: 1 }),
  });

  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', { limit: 5 }],
    queryFn: () => messagesApi.getCampaigns({ limit: 5 }),
  });

  const stats = [
    {
      title: 'Total Users',
      value: loadingUsers ? '...' : usersData?.meta?.total || 0,
      icon: Users,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
    },
    {
      title: 'Active Groups',
      value: loadingGroups ? '...' : groupsData?.meta?.total || 0,
      icon: UsersRound,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Campaigns Sent',
      value: loadingMessages ? '...' : messagesData?.meta?.total || 0,
      icon: MessageSquare,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      title: 'Delivery Rate',
      value: '98%', // Mock for now until we build stats endpoint
      icon: CheckCircle2,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  const table = useReactTable({
    data: messagesData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PushNotificationBanner />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Overview of your institution's activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/20 transition-colors">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Campaigns</h3>
            <button className="text-sm text-brand-400 hover:text-brand-300 transition-colors">View All</button>
          </div>
          <Table 
            table={table} 
            isLoading={loadingMessages} 
            isEmpty={!messagesData?.data || messagesData.data.length === 0}
            emptyStateTitle="No recent campaigns"
            emptyStateDescription="You haven't sent any messages yet."
          />
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/messages/send" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <div className="p-2 bg-brand-500/10 text-brand-500 dark:text-brand-400 rounded-lg group-hover:bg-brand-500 group-hover:text-white transition-colors">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="font-medium text-sm">Send Broadcast</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Create a new message campaign</p>
              </div>
            </Link>
            <Link to="/import" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg group-hover:bg-slate-600 group-hover:text-white transition-colors">
                <Users size={18} />
              </div>
              <div>
                <p className="font-medium text-sm">Import Users</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Upload CSV or Excel file</p>
              </div>
            </Link>
            <Link to="/groups" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <UsersRound size={18} />
              </div>
              <div>
                <p className="font-medium text-sm">Manage Groups</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Organize students into classes</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuthStore();
  
  if (user?.role?.name === 'USER') {
    return <UserDashboard />;
  }
  
  return <AdminDashboard />;
};

export default DashboardPage;
