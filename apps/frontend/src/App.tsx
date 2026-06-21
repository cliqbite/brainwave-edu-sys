import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import UserImportPage from './pages/UserImportPage';
import { ProfilePage } from './pages/ProfilePage';
import GroupsPage from './pages/GroupsPage';
import MessagesPage from './pages/MessagesPage';
import MessageHistoryPage from './pages/MessageHistoryPage';
import ModeratorsPage from './pages/ModeratorsPage';
import PermissionsPage from './pages/PermissionsPage';
import SettingsPage from './pages/SettingsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import NotFoundPage from './pages/NotFoundPage';

// Root layout that includes Toaster
const RootLayout = () => (
  <>
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155',
        },
      }} 
    />
    <Outlet />
  </>
);

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'import', element: <UserImportPage /> },
          { path: 'groups', element: <GroupsPage /> },
          { path: 'messages/send', element: <MessagesPage /> },
          { path: 'messages/history', element: <MessageHistoryPage /> },
          { path: 'moderators', element: <ModeratorsPage /> },
          { path: 'permissions', element: <PermissionsPage /> },
          { path: 'activity', element: <ActivityLogPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
