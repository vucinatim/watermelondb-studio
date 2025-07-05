import { DataTable } from '@/components/data-table';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DbProvider, useDb } from '@/contexts/db-context';
import { useQueryState } from 'nuqs';
import * as React from 'react';
import { SidebarPanel } from './components/sidebar-panel';
import { SqlRunner } from './components/sql-runner';

function AppContent() {
  const { tables } = useDb();
  const [selectedTable, setSelectedTable] = useQueryState('table');
  const [page, setPage] = useQueryState('page');

  React.useEffect(() => {
    if (tables.length > 0 && !page) {
      setPage('table');
    }
    if (page === 'table' && !selectedTable && tables.length > 0) {
      setSelectedTable(tables[0]);
    }
  }, [tables, selectedTable, setSelectedTable, page, setPage]);

  const handleSelectTable = (table: string) => {
    setSelectedTable(table);
    setPage('table');
  };

  const handleSelectSql = () => {
    setPage('sql');
    setSelectedTable(null);
  };

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }>
      <SidebarPanel
        variant="inset"
        onSelectTable={handleSelectTable}
        onSelectSql={handleSelectSql}
        selectedTable={selectedTable}
        page={page || 'table'}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {page === 'sql' ? (
                <SqlRunner />
              ) : (
                <DataTable tableName={selectedTable} />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Page() {
  return (
    <DbProvider>
      <AppContent />
    </DbProvider>
  );
}
