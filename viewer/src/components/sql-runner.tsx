/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useDb } from '@/contexts/db-context';
import * as React from 'react';
import { DataTable, type DataTableData } from './data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

function isTableData(data: unknown): data is DataTableData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'columns' in data &&
    'rows' in data &&
    Array.isArray((data as any).columns) &&
    Array.isArray((data as any).rows)
  );
}

export function SqlRunner() {
  const { executeSql, tables } = useDb();
  const [sql, setSql] = React.useState('');
  const [results, setResults] = React.useState<unknown>(null);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('results');
  const logsContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleExecute = async () => {
    setError(null);
    setResults(null);

    const newLog = `[${new Date().toLocaleTimeString()}] Executing: ${sql}`;
    setLogs((prev) => [...prev, newLog]);

    try {
      const response = await executeSql(sql);
      if (!response.ok) {
        // The context already handles the error message.
        // We just need to update the logs and switch tabs.
        setLogs((prev) => [...prev, `[ERROR] ${(response as any).error}`]);
        setActiveTab('logs');
      } else {
        const results = (response as any).results;
        setResults(results);
        const successMessage = `[SUCCESS] Query executed. Returned ${
          results.rows?.length ?? 0
        } rows.`;
        setLogs((prev) => [...prev, successMessage]);
        setActiveTab('results');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setLogs((prev) => [...prev, `[FATAL] ${message}`]);
      setActiveTab('logs');
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Execute SQL</h2>
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="SELECT * FROM transcriptions;"
            className="min-h-[100px] font-mono"
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Quick Actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {tables.map((table) => (
                  <React.Fragment key={table}>
                    <DropdownMenuItem
                      onSelect={() => setSql(`SELECT * FROM ${table};`)}>
                      SELECT * FROM {table}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setSql(`SELECT COUNT(*) FROM ${table};`)}>
                      SELECT COUNT(*) FROM {table}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        setSql(
                          `SELECT id, name, created_at FROM ${table} LIMIT 10;`,
                        )
                      }>
                      Partial SELECT from {table}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        setSql(
                          `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 5;`,
                        )
                      }>
                      SELECT with ORDER/LIMIT from {table}
                    </DropdownMenuItem>
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleExecute}>Execute SQL</Button>
          </div>
        </div>

        <div className="mt-4">
          <TabsContent value="results">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Query Result</h2>
              <div>
                {error && <p className="text-red-500">{error}</p>}
                {isTableData(results) ? (
                  <div className="-mx-4 lg:-mx-6">
                    <DataTable
                      tableName="SQL Result"
                      data={results}
                      pageSize={8}
                    />
                  </div>
                ) : (
                  <pre>{JSON.stringify(results, null, 2)}</pre>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="logs">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Execution Logs</h2>
              <div
                ref={logsContainerRef}
                className="h-64 overflow-y-auto rounded-lg bg-zinc-100 p-4 font-mono text-sm">
                {logs.length > 0 ? (
                  logs.map((log, i) => {
                    let color = 'text-zinc-900';
                    if (log.includes('[SUCCESS]')) {
                      color = 'text-green-600';
                    } else if (
                      log.includes('[ERROR]') ||
                      log.includes('[FATAL]')
                    ) {
                      color = 'text-red-600';
                    }
                    return (
                      <div key={i} className={color}>
                        {log}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No logs yet.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
