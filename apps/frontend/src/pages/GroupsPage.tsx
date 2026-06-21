import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { groupsApi } from '../api/endpoints';
import { Table, Card, Input, Button, showToast } from '../components/ui';
import { Search, Plus, UsersRound } from 'lucide-react';
import { PermissionGuard } from '../components/guards/PermissionGuard';
import { GroupFormModal } from '../components/groups/GroupFormModal';
import { GroupMembersModal } from '../components/groups/GroupMembersModal';

const columnHelper = createColumnHelper<any>();

const GroupsPage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['groups', { page, limit, search }],
    queryFn: () => groupsApi.list({ page, limit, search }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => groupsApi.delete(id),
    onSuccess: () => {
      showToast.success('Group deleted successfully');
      refetch();
    },
    onError: (err: any) => {
      showToast.error(err.message || 'Failed to delete group');
    }
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this group?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (group: any) => {
    setSelectedGroup(group);
    setIsFormModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedGroup(null);
    setIsFormModalOpen(true);
  };

  const handleManageMembers = (group: any) => {
    setSelectedGroup(group);
    setIsMembersModalOpen(true);
  };

  const columns = [
    columnHelper.accessor('name', {
      header: 'Group Name',
      cell: info => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm">
            <UsersRound size={16} />
          </div>
          <div>
            <p className="font-medium">{info.getValue()}</p>
            {info.row.original.description && (
              <p className="text-xs text-muted truncate max-w-[200px]">{info.row.original.description}</p>
            )}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('_count.users', {
      header: 'Members',
      cell: info => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created On',
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.accessor('id', {
      header: 'Actions',
      cell: info => (
        <div className="flex gap-2">
          <PermissionGuard permission="GROUP_UPDATE">
            <button 
              className="text-primary hover:underline text-sm font-medium"
              onClick={() => handleEdit(info.row.original)}
            >
              Manage
            </button>
            <button 
              className="text-brand-400 hover:underline text-sm font-medium ml-2"
              onClick={() => handleManageMembers(info.row.original)}
            >
              Members
            </button>
          </PermissionGuard>
          <PermissionGuard permission="GROUP_DELETE">
            <button 
              className="text-danger hover:underline text-sm font-medium ml-2"
              onClick={() => handleDelete(info.getValue())}
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
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-muted">Organize users into broadcast groups</p>
        </div>
        <PermissionGuard permission="GROUP_CREATE">
          <Button leftIcon={<Plus size={18} />} onClick={handleCreate}>Create Group</Button>
        </PermissionGuard>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-[rgba(255,255,255,0.1)] flex gap-4">
          <Input 
            placeholder="Search groups..." 
            icon={<Search size={18} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-md"
          />
        </div>
        
        <Table 
          table={table}
          isLoading={isLoading}
          isEmpty={!isLoading && (!data?.data || data.data.length === 0)}
          emptyStateTitle="No groups found"
          emptyStateDescription="Create a group to organize users for messaging."
        />
      </Card>

      <GroupFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => refetch()}
        group={selectedGroup}
      />

      <GroupMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => {
          setIsMembersModalOpen(false);
          refetch();
        }}
        group={selectedGroup}
      />
    </div>
  );
};

export default GroupsPage;
