import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';
import { z } from 'zod';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDb } from '@/contexts/db-context';
import { useHighlightOnChange } from '@/hooks/use-highlight-on-change';
import { cn } from '@/lib/utils';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableNavbar } from './data-table-navbar';
import { DataTablePagination } from './data-table-pagination';
import { DataTableRowDetailsDialog } from './data-table-row-details-dialog';

export interface DataTableData {
  rows: Record<string, unknown>[];
  columns: string[];
}

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
});
export function DataTable({
  tableName,
  data: propData,
  pageSize = 10,
}: {
  tableName: string | null;
  data?: DataTableData;
  pageSize?: number;
}) {
  const { selectedTableData, loading } = useDb(tableName);
  const data = React.useMemo(
    () => (propData ? propData.rows : selectedTableData) || [],
    [propData, selectedTableData]
  );
  const highlightedRows = useHighlightOnChange(data);

  const [selectedRowId, setSelectedRowId] = React.useState<
    string | number | null
  >(null);

  const selectedRowData = React.useMemo(() => {
    if (selectedRowId === null) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.find((row: any) => row.id === selectedRowId) ?? null;
  }, [data, selectedRowId]);

  const columnKeysString = React.useMemo(
    () =>
      propData
        ? propData.columns.join(',')
        : data.length > 0
          ? Object.keys(data[0]).join(',')
          : '',
    [data, propData]
  );

  const columns = React.useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!columnKeysString) {
      return [];
    }
    const keys = columnKeysString.split(',');
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <div
            className="flex items-center justify-center pr-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div
            className="flex items-center justify-center pr-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...keys.map((key) => ({
        accessorKey: key,
        header: ({ column }: { column: Column<Record<string, unknown>> }) => (
          <DataTableColumnHeader column={column} title={key} />
        ),
        cell: ({ row }: { row: Row<Record<string, unknown>> }) => (
          <div className="max-w-sm truncate">{String(row.original[key])}</div>
        ),
      })),
    ];
  }, [columnKeysString]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id as string,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  if (loading && data.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!tableName) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        Select a table to view its data.
      </div>
    );
  }

  return (
    <div className="w-full flex-col justify-start gap-6">
      <DataTableNavbar table={table} tableName={tableName} />
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() =>
                      setSelectedRowId(
                        (row.original as { id: string | number }).id
                      )
                    }
                    className={cn(
                      'cursor-pointer transition-colors duration-500',
                      highlightedRows.has(
                        (row.original as { id: string | number }).id
                      ) && 'bg-zinc-200/50'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>
      <DataTableRowDetailsDialog
        open={selectedRowId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRowId(null);
          }
        }}
        rowData={selectedRowData}
      />
    </div>
  );
}
