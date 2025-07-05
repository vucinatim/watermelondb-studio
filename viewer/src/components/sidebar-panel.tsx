import { IconDatabase, IconSearch } from '@tabler/icons-react';
import * as React from 'react';

import { ConnectionStatus } from '@/components/connection-status';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useDb } from '@/contexts/db-context';
import { SidebarDocuments } from './sidebar-documents';

interface SidebarPanelProps extends React.ComponentProps<typeof Sidebar> {
  onSelectTable: (table: string) => void;
  selectedTable: string | null;
  onSelectSql: () => void;
  page: string;
}

export function SidebarPanel({
  onSelectTable,
  selectedTable,
  onSelectSql,
  page,
  ...props
}: SidebarPanelProps) {
  const { dbData, loading } = useDb();

  const tables = Object.keys(dbData).map((table) => ({
    name: table,
    icon: IconDatabase,
    isActive: page === 'table' && selectedTable === table,
    onClick: () => onSelectTable(table),
  }));

  const navSecondary = [
    {
      title: 'Execute SQL',
      tag: 'beta',
      icon: IconSearch,
      onClick: onSelectSql,
      isActive: page === 'sql',
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="hover:bg-transparent data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <span className="text-2xl">🍉</span>
                <span className="text-base font-semibold">WatermelonDB</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {loading ? (
          <div className="px-4 py-6 opacity-50">Loading...</div>
        ) : (
          <SidebarDocuments items={tables} />
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    className={item.isActive ? 'bg-muted' : ''}>
                    <item.icon />
                    <span className="flex items-center gap-3">
                      {item.title}
                      {item.tag && (
                        <span className="rounded-full bg-zinc-300 px-2 py-0.5 text-[10px] text-white">
                          {item.tag}
                        </span>
                      )}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Populate 10 rows into transcriptions table from API"
                  onClick={async () => {
                    await fetch('http://localhost:12345/fetch-test-data', {
                      method: 'POST',
                    });
                    restartConnection();
                  }}>
                  <IconRefresh />
                  <span>Populate Test Data</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>
      <SidebarFooter>
        <ConnectionStatus />
      </SidebarFooter>
    </Sidebar>
  );
}
