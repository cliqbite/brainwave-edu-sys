import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table';
import { messagesApi } from '../api/endpoints';
import { Table, Card, Badge } from '../components/ui';
import { History, ChevronDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

const columnHelper = createColumnHelper<any>();

const MessageHistoryPage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', { page, limit }],
    queryFn: () => messagesApi.getCampaigns({ page, limit }),
    placeholderData: (prev) => prev,
  });

  const columns = [
    columnHelper.display({
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.preventDefault();
            row.toggleExpanded();
          }}
          className="p-1 hover:bg-white/10 rounded-md transition-colors"
        >
          {row.getIsExpanded() ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
      ),
    }),
    columnHelper.accessor('title', {
      header: 'Campaign Title',
      cell: info => (
        <div className="font-medium">{info.getValue() || 'Untitled'}</div>
      ),
    }),
    columnHelper.accessor('channel', {
      header: 'Channel',
      cell: info => <Badge variant="default">{info.getValue()}</Badge>,
    }),
    columnHelper.accessor('recipientType', {
      header: 'Target',
      cell: info => <span className="text-sm">{info.getValue()}</span>,
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
      cell: info => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: info => new Date(info.getValue()).toLocaleString(),
    }),
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
          <History size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Campaign History</h1>
          <p className="text-muted">Track all broadcast messages and their status</p>
        </div>
      </div>

      <Card noPadding>
        <Table 
          table={table}
          isLoading={isLoading}
          isEmpty={!isLoading && (!data?.data || data.data.length === 0)}
          emptyStateTitle="No campaigns found"
          emptyStateDescription="You haven't sent any messages yet."
          renderSubComponent={({ row }) => (
            <div className="p-6 bg-slate-900/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Message Content</h4>
                  <div className="p-4 rounded-xl border border-white/5 bg-slate-800/30 text-slate-200">
                    <p className="whitespace-pre-wrap">{row.original.content || 'No content available.'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Delivery Stats</h4>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-400 p-3 rounded-xl flex-1 border border-emerald-500/20">
                      <CheckCircle2 size={24} />
                      <div>
                        <p className="text-xs font-medium uppercase opacity-80">Successful</p>
                        <p className="text-xl font-bold">{row.original.successfulDeliveries || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-rose-500/10 text-rose-400 p-3 rounded-xl flex-1 border border-rose-500/20">
                      <XCircle size={24} />
                      <div>
                        <p className="text-xs font-medium uppercase opacity-80">Failed</p>
                        <p className="text-xl font-bold">{row.original.failedDeliveries || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  );
};

export default MessageHistoryPage;
