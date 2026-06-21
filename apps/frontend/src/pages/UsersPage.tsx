import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { usersApi } from '../api/endpoints';
import { Table, Card, Input, Button, Badge, showToast } from '../components/ui';
import { Search, Plus, Mail, Phone, Shield } from 'lucide-react';
import { PermissionGuard } from '../components/guards/PermissionGuard';
import { useAuthStore } from '../stores/auth.store';
import { UserFormModal } from '../components/users/UserFormModal';

const columnHelper = createColumnHelper<any>();

const UsersPage = () => {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', { page, limit, search }],
    queryFn: () => usersApi.list({ page, limit, search }),
    placeholderData: (prev) => prev, // Keep previous data while fetching
  });

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await usersApi.delete(id);
        showToast.success('User deleted successfully');
        refetch();
      } catch (err: any) {
        showToast.error(err.message || 'Failed to delete user');
      }
    }
  };

  const handleResetPassword = async (id: number) => {
    const newPassword = window.prompt('Enter new password for this user (min 6 characters):');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      showToast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      await usersApi.resetPassword(id, { password: newPassword });
      showToast.success('Password reset successfully');
    } catch (err: any) {
      showToast.error(err.message || 'Failed to reset password');
    }
  };

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-sm">
            {info.getValue()?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{info.getValue()}</p>
            <p className="text-xs text-slate-500">ID: {info.row.original.uuid}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      header: 'Contact',
      cell: info => (
        <div className="text-sm">
          <div className="flex items-center gap-1"><Mail size={12} className="text-slate-500"/> {info.getValue()}</div>
          {info.row.original.phone && (
            <div className="flex items-center gap-1 mt-1"><Phone size={12} className="text-slate-500"/> {info.row.original.phone}</div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('role.displayName', {
      header: 'Role',
      cell: info => (
        <div className="flex items-center gap-1">
          <Shield size={14} className={info.row.original.role.name === 'MASTER' ? 'text-amber-500' : 'text-brand-400'} />
          <Badge variant={info.row.original.role.name === 'USER' ? 'default' : 'info'}>
            {info.getValue()}
          </Badge>
        </div>
      ),
    }),
    columnHelper.accessor('groups', {
      header: 'Groups',
      cell: info => {
        const count = info.row.original._count?.groups || 0;
        return <span className="text-slate-300">{count} groups</span>;
      },
    }),
    columnHelper.accessor('id', {
      header: 'Actions',
      cell: info => (
        <div className="flex items-center gap-3">
          <PermissionGuard permission="USER_UPDATE">
            <button 
              className="text-brand-400 hover:text-brand-300 transition-colors text-sm font-medium"
              onClick={() => handleEdit(info.row.original)}
            >
              Edit
            </button>
          </PermissionGuard>
          {user?.role?.name === 'MASTER' && info.row.original.role.name !== 'MASTER' && (
            <button 
              className="text-amber-500 hover:text-amber-400 transition-colors text-sm font-medium"
              onClick={() => handleResetPassword(info.getValue())}
            >
              Reset Pwd
            </button>
          )}
          <PermissionGuard permission="USER_DELETE">
            <button 
              className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleDelete(info.getValue())}
              disabled={info.row.original.role.name === 'MASTER'}
            >
              Delete
            </button>
          </PermissionGuard>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    pageCount: data?.meta?.totalPages || -1,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex: page - 1, pageSize: limit });
        setPage(newState.pageIndex + 1);
      }
    },
    manualPagination: true,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-slate-400">Manage system users and students</p>
        </div>
        <PermissionGuard permission="USER_CREATE">
          <Button leftIcon={<Plus size={18} />} onClick={handleAdd}>Add User</Button>
        </PermissionGuard>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-white/10 flex gap-4">
          <Input 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset page on search
            }}
            icon={<Search size={18} className="text-slate-500" />}
            className="max-w-md"
          />
        </div>
        
        <Table 
          table={table}
          isLoading={isLoading}
          isEmpty={!isLoading && (!data?.data || data.data.length === 0)}
          emptyStateTitle="No users found"
          emptyStateDescription={search ? "Try adjusting your search query." : "There are no users in the system yet."}
        />
      </Card>

      {isModalOpen && (
        <UserFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default UsersPage;
