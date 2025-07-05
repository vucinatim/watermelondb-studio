import { IconLoader2, IconTrash, IconX } from '@tabler/icons-react';
import { type Table } from '@tanstack/react-table';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDb } from '@/contexts/db-context';
import { DataTableViewOptions } from './data-table-view-options';

interface DataTableNavbarProps<TData> {
  table: Table<TData>;
  tableName: string;
}

export function DataTableNavbar<TData>({
  table,
  tableName,
}: DataTableNavbarProps<TData>) {
  const { executeSql } = useDb();
  const [filterBy, setFilterBy] = React.useState<string>('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  const filterableColumns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            column.getCanFilter() &&
            column.id !== 'select' &&
            typeof column.accessorFn !== 'undefined',
        ),
    [table],
  );

  const handleDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const idsToDelete = selectedRows.map(
      (row) => (row.original as { id: string }).id,
    );

    if (idsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      const sql = `DELETE FROM ${tableName} WHERE id IN (${idsToDelete
        .map(() => '?')
        .join(',')})`;
      await executeSql(sql, idsToDelete);
      table.resetRowSelection();
    } finally {
      setIsDeleting(false);
    }
  };

  React.useEffect(() => {
    if (filterableColumns.length > 0 && !filterBy) {
      setFilterBy(filterableColumns[0].id);
    }
  }, [filterableColumns, filterBy]);

  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex items-center justify-between px-4 pb-3 lg:px-6">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder={filterBy ? `Filter ${filterBy}...` : 'Select a column'}
          value={
            filterBy
              ? ((table.getColumn(filterBy)?.getFilterValue() as string) ?? '')
              : ''
          }
          onChange={(event) => {
            if (filterBy) {
              table.getColumn(filterBy)?.setFilterValue(event.target.value);
            }
          }}
          className="h-8 w-[150px] lg:w-[250px]"
          disabled={!filterBy}
        />
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="h-8 w-fit text-xs">
            <span className="text-muted-foreground mr-1">Search by:</span>
            <SelectValue placeholder="Search by" />
          </SelectTrigger>
          <SelectContent>
            {filterableColumns.map((column) => {
              return (
                <SelectItem key={column.id} value={column.id}>
                  {column.id}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3">
            Reset
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={selectedRowCount === 0 ? 'outline' : 'destructive'}
          onClick={handleDelete}
          className="relative h-8 justify-center overflow-hidden px-2 text-center lg:px-3"
          disabled={isDeleting || selectedRowCount === 0}>
          <>
            <IconTrash className="mr-2 h-4 w-4" />
            <span>
              Delete Selected
              {selectedRowCount > 0 ? ` (${selectedRowCount})` : ''}
            </span>
          </>
          {isDeleting && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm">
              <IconLoader2 className="h-4 w-4 animate-spin text-white" />
            </div>
          )}
        </Button>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
