import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Modal, Button, showToast, Input } from '../ui';
import { groupsApi, usersApi } from '../../api/endpoints';
import { Search, Loader2 } from 'lucide-react';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any;
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({ isOpen, onClose, group }) => {
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [initialUserIds, setInitialUserIds] = useState<Set<number>>(new Set());

  // Fetch all users to select from
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => usersApi.list({ limit: 1000 }), // Fetching a large limit for simplicity
    enabled: isOpen,
  });

  // Fetch group details to get current members
  const { data: groupData, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['groups', group?.id],
    queryFn: () => groupsApi.getById(group!.id),
    enabled: isOpen && !!group,
  });

  useEffect(() => {
    if (groupData?.data?.users) {
      const ids = new Set<number>(groupData.data.users.map((u: any) => u.id));
      setSelectedUserIds(ids);
      setInitialUserIds(ids);
    }
  }, [groupData]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedUserIds(new Set());
      setInitialUserIds(new Set());
    }
  }, [isOpen]);

  const handleToggleUser = (userId: number) => {
    const next = new Set(selectedUserIds);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedUserIds(next);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!group) return;
      const currentArray = Array.from(selectedUserIds);
      const initialArray = Array.from(initialUserIds);

      const added = currentArray.filter((id) => !initialArray.includes(id));
      const removed = initialArray.filter((id) => !currentArray.includes(id));

      const promises: Promise<any>[] = [];

      if (added.length > 0) {
        promises.push(groupsApi.addUsers(group.id, added));
      }

      for (const rId of removed) {
        promises.push(groupsApi.removeUser(group.id, rId));
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      showToast.success('Group members updated successfully');
      onClose();
    },
    onError: (err: any) => {
      showToast.error(err.message || 'Failed to update members');
    }
  });

  const handleSave = () => {
    mutation.mutate();
  };

  const users = usersData?.data || [];
  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = isLoadingUsers || isLoadingGroup;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Members: ${group?.name}`}
    >
      <div className="space-y-4">
        <Input
          placeholder="Search users..."
          icon={<Search size={18} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="border border-slate-200 dark:border-white/10 rounded-xl max-h-96 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-800/30">
          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mb-2" size={24} />
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No users found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredUsers.map((user: any) => {
                const isSelected = selectedUserIds.has(user.id);
                return (
                  <label 
                    key={user.id} 
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors ${isSelected ? 'bg-brand-50 dark:bg-brand-500/5' : ''}`}
                  >
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={isSelected}
                        onChange={() => handleToggleUser(user.id)}
                      />
                      <div className="w-5 h-5 rounded border border-slate-300 dark:border-white/20 flex items-center justify-center bg-white dark:bg-slate-900 peer-checked:bg-brand-500 peer-checked:border-brand-500 transition-colors">
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email} • {user.role?.displayName || user.role?.name}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-white/10">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-white">{selectedUserIds.size}</span> users selected
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={mutation.isPending || isLoading}>
              {mutation.isPending ? 'Saving...' : 'Save Members'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
