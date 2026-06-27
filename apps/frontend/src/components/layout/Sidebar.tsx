import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useUiStore } from '../../stores/ui.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UsersRound,
  MessageSquare,
  History,
  ShieldAlert,
  KeyRound,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

import type { PermissionName, RoleName } from '@brainwave/shared';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  permission?: PermissionName;
  role?: RoleName;
}

export const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();
  const { hasPermission, hasRole } = useAuthStore();
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, setMobileSidebarOpen]);

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/users', label: 'Users', icon: Users, permission: 'USER_VIEW' },
    { to: '/import', label: 'Import', icon: UserPlus, permission: 'USER_IMPORT' },
    { to: '/groups', label: 'Groups', icon: UsersRound, permission: 'GROUP_VIEW' },
    { to: '/messages/send', label: 'Send Message', icon: MessageSquare, permission: 'MESSAGE_SEND' },
    { to: '/messages/history', label: 'Campaigns', icon: History, permission: 'MESSAGE_HISTORY_VIEW' },
    { to: '/moderators', label: 'Moderators', icon: ShieldAlert, permission: 'MODERATOR_UPDATE' },
    { to: '/permissions', label: 'Permissions', icon: KeyRound, permission: 'MODERATOR_UPDATE' },
    { to: '/activity', label: 'Activity Log', icon: Activity, role: 'MASTER' },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50
      md:relative md:z-40 md:translate-x-0
      bg-white/95 dark:bg-slate-800/40 backdrop-blur-xl
      border-r border-slate-200 dark:border-white/10
      flex flex-col transition-all duration-300
      w-72 md:w-auto
      ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      ${sidebarCollapsed ? 'md:w-17.5' : 'md:w-64'}
    `}>
      <div className="h-16 flex items-center px-5 border-b border-slate-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2 text-brand-500 dark:text-brand-400 font-bold text-lg overflow-hidden whitespace-nowrap">
          <GraduationCap size={24} className="shrink-0" />
          {(!sidebarCollapsed || mobileSidebarOpen) && <span>Brainwave EduSys</span>}
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;
          if (item.role && !hasRole(item.role)) return null;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 ${isActive ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'}`}
              title={(sidebarCollapsed && !mobileSidebarOpen) ? item.label : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {(!sidebarCollapsed || mobileSidebarOpen) && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-end shrink-0 hidden md:flex">
        <button
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
};
