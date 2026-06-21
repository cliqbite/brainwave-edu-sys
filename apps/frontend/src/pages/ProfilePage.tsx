import { useState } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { Card } from '../components/ui';
import { Mail, Shield, Key } from 'lucide-react';
import { authApi } from '../api/endpoints';

export const ProfilePage = () => {
  const { user } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await authApi.changePassword(oldPassword, newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-slate-400">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="flex flex-col items-center text-center p-6">
            <div className="w-24 h-24 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-brand-500/30 mb-4">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-bold text-slate-200">{user?.name}</h2>
            <p className="text-slate-400 text-sm mb-4">{user?.role?.displayName || 'User'}</p>
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-white/5">
              <Mail size={16} className="text-slate-400" />
              <span className="text-sm text-slate-300 truncate">{user?.email}</span>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
                <Shield size={20} />
              </div>
              <h2 className="text-lg font-semibold">Account Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <div className="px-4 py-2 bg-slate-900/50 rounded-lg border border-white/5 text-slate-300">
                  {user?.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
                <div className="px-4 py-2 bg-slate-900/50 rounded-lg border border-white/5 text-slate-300">
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                <div className="px-4 py-2 bg-slate-900/50 rounded-lg border border-white/5 text-slate-300">
                  {user?.role?.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                <div className="px-4 py-2 bg-slate-900/50 rounded-lg border border-white/5 text-slate-300">
                  <span className="text-emerald-400 font-medium">Active</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
                <Key size={20} />
              </div>
              <h2 className="text-lg font-semibold">Change Password</h2>
            </div>

            {message.text && (
              <div className={`p-3 mb-4 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full sm:w-auto"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
