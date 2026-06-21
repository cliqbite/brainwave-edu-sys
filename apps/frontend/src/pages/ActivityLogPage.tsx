import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { auditApi } from '../api/endpoints';
import { Table, Card, Badge } from '../components/ui';
import { Activity } from 'lucide-react';

const columnHelper = createColumnHelper<any>();

const ActivityLogPage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', { page, limit }],
    queryFn: () => auditApi.getLogs({ page, limit }),
    placeholderData: (prev) => prev,
  });

  const columns = [
    columnHelper.accessor('createdAt', {
      header: 'Timestamp',
      cell: info => <span className="text-sm text-muted">{new Date(info.getValue()).toLocaleString()}</span>,
    }),
    columnHelper.accessor('user.email', {
      header: 'User',
      cell: info => <span className="font-medium text-sm">{info.getValue() || 'System'}</span>,
    }),
    columnHelper.accessor('module', {
      header: 'Module',
      cell: info => <Badge variant="info">{info.getValue()}</Badge>,
    }),
    columnHelper.accessor('action', {
      header: 'Action',
      cell: info => {
        const action = info.getValue();
        const variant = action.includes('CREATE') ? 'success' : action.includes('DELETE') ? 'danger' : 'warning';
        return <Badge variant={variant}>{action}</Badge>;
      },
    }),
    columnHelper.accessor('targetType', {
      header: 'Target',
      cell: info => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('ipAddress', {
      header: 'IP Address',
      cell: info => <span className="text-xs font-mono text-muted">{info.getValue()}</span>,
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
      <div className="flex items-center gap-3">
        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-muted">System-wide audit trail of all actions</p>
        </div>
      </div>

      <Card noPadding>
        <Table 
          table={table}
          isLoading={isLoading}
          isEmpty={!isLoading && (!data?.data || data.data.length === 0)}
          emptyStateTitle="No activity found"
          emptyStateDescription="No audit logs have been recorded yet."
        />
      </Card>
    </div>
  );
};

export default ActivityLogPage;
