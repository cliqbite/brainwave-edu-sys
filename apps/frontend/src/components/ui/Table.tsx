import React from 'react';
import { flexRender, type Table as ReactTable, type Row } from '@tanstack/react-table';
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface TableProps<T> {
  table: ReactTable<T>;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  renderSubComponent?: (props: { row: Row<T> }) => React.ReactNode;
}

export function Table<T>({ 
  table, 
  isLoading, 
  isEmpty,
  emptyStateTitle = 'No data found',
  emptyStateDescription = 'There are no records to display.',
  renderSubComponent
}: TableProps<T>) {
  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-slate-800/20">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/40 border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider text-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-4" style={{ width: header.getSize() !== 150 ? header.getSize() : 'auto' }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="text-center py-10">
                  <Loader2 className="animate-spin mx-auto text-brand-500 mb-2" size={32} />
                  <p className="text-slate-500">Loading data...</p>
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="p-0">
                  <EmptyState title={emptyStateTitle} description={emptyStateDescription} />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && renderSubComponent && (
                    <tr className="bg-black/20">
                      <td colSpan={row.getVisibleCells().length} className="p-0 border-b border-white/5">
                        {renderSubComponent({ row })}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>
              Page <span className="font-medium text-primary">{table.getState().pagination.pageIndex + 1}</span> of{' '}
              <span className="font-medium text-primary">{table.getPageCount()}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-icon border border-[rgba(255,255,255,0.1)]"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="btn-icon border border-[rgba(255,255,255,0.1)]"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn-icon border border-[rgba(255,255,255,0.1)]"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="btn-icon border border-[rgba(255,255,255,0.1)]"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
