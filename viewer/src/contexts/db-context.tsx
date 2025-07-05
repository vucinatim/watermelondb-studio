import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useSettingsStore } from '../stores/settings-store';

// --- Configuration ---
const PORT_RANGE_START = 12345;
const PORT_RANGE_END = 12355;
const DEVICE_IP = import.meta.env.VITE_DEVICE_IP;

type RecordItem = Record<string, unknown>;
type DbData = Record<string, RecordItem[]>;
type ConnectionStatus = 'alive' | 'dead';

interface DeviceInfo {
  name: string;
  os: string;
}

interface DbContextType {
  dbData: DbData;
  error: string | null;
  loading: boolean;
  deviceInfo: DeviceInfo | null;
  connectionStatus: ConnectionStatus;
  baseUrl: string | null;
  restartConnection: () => void;
  tables: string[];
  executeSql: (sql: string, params?: unknown[]) => Promise<{ ok: boolean }>;
  setManualIp: (ip: string | null) => void;
  manualIp: string | null;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export function DbProvider({ children }: PropsWithChildren) {
  const [dbData, setDbData] = useState<DbData>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('dead');
  const [restartCounter, setRestartCounter] = useState(0);
  const [hasManuallyDisconnected, setHasManuallyDisconnected] = useState(false);
  const { manualIp, setManualIp: setPersistedManualIp } = useSettingsStore();
  const lastEventIdRef = useRef<string | null>(null);

  const tables = useMemo(() => Object.keys(dbData), [dbData]);

  const restartConnection = useCallback(() => {
    setHasManuallyDisconnected(true);
    setPersistedManualIp(null);
    setBaseUrl(null);
    setRestartCounter((c) => c + 1);
  }, [setPersistedManualIp]);

  const fetchInitialData = useCallback(async () => {
    if (!baseUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/db`);
      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`,
        );
      }
      const data = await response.json();
      setDbData(data.data);
      setConnectionStatus('alive');
      setError(null);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred during initial fetch');
      }
      setConnectionStatus('dead');
      setBaseUrl(null); // This will trigger re-discovery
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const executeSql = useCallback(
    async (sql: string, params: unknown[] = []) => {
      if (!baseUrl) return { ok: false };
      try {
        const response = await fetch(`${baseUrl}/api/execute-sql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql, params }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to execute SQL');
        }
        // After a successful execution, refetch all data to ensure UI is in sync.
        await fetchInitialData();
        return await response.json();
      } catch (e) {
        console.error('Failed to execute SQL', e);
        if (e instanceof Error) {
          setError(e.message);
        }
        return { ok: false };
      }
    },
    [baseUrl, fetchInitialData],
  );

  const setManualIp = useCallback(
    (ip: string | null) => {
      // Allow reconnecting after manual disconnect
      if (ip) {
        setHasManuallyDisconnected(false);
      }
      setPersistedManualIp(ip);
    },
    [setPersistedManualIp],
  );

  useEffect(() => {
    // This effect runs to discover the server when no connection exists.
    if (baseUrl) {
      return; // We have a connection, do nothing.
    }

    if (hasManuallyDisconnected && !manualIp) {
      setLoading(false);
      setError(
        'Disconnected. Scan a QR code or refresh the page to reconnect.',
      );
      return;
    }

    // When starting a search, we are in a loading state until a server is found.
    setLoading(true);
    setConnectionStatus('dead'); // Explicitly set to dead while searching

    let retryTimeoutId: number;
    const findServer = async () => {
      const ip = manualIp || DEVICE_IP || 'localhost';
      console.log(`Starting server discovery on IP: ${ip}`);

      for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
        const url = `http://${ip}:${port}`;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms timeout per port
          const response = await fetch(`${url}/api/heartbeat`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            console.log(`✅ Server found at ${url}`);
            setBaseUrl(url);
            setError(null);
            return; // Exit after finding the first server
          }
        } catch {
          // Ignore connection errors and timeouts, just try the next port.
        }
      }
      console.error(
        `❌ Could not find a server on IP ${ip} in port range ${PORT_RANGE_START}-${PORT_RANGE_END}.`,
      );
      setError(
        `Failed to connect. Retrying... Ensure the device is on the same network and the app is running. IP: ${ip}`,
      );
      setLoading(false);

      // If we got here, no server was found. Retry after a delay.
      retryTimeoutId = window.setTimeout(findServer, 2000);
    };

    findServer();

    // Cleanup the timeout if the component unmounts or a server is found
    return () => {
      window.clearTimeout(retryTimeoutId);
    };
  }, [restartCounter, baseUrl, manualIp, hasManuallyDisconnected]); // Depend on baseUrl to re-trigger search

  useEffect(() => {
    // This effect runs once when the base url is available to fetch the initial state.
    if (!baseUrl) {
      return;
    }

    const fetchDeviceInfo = async () => {
      if (!baseUrl) return;
      try {
        const response = await fetch(`${baseUrl}/api/device-info`);
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`,
          );
        }
        const data = await response.json();
        setDeviceInfo(data);
      } catch (e) {
        console.error('Failed to fetch device info', e);
      }
    };

    fetchInitialData();
    fetchDeviceInfo();
  }, [baseUrl, restartCounter, fetchInitialData]);

  useEffect(() => {
    if (!baseUrl) {
      return;
    }

    const sseUrl = lastEventIdRef.current
      ? `${baseUrl}/events?lastEventId=${lastEventIdRef.current}`
      : `${baseUrl}/events`;

    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log('✅ SSE connection established.');
      setConnectionStatus('alive');
      setError(null);
    };

    eventSource.onerror = (e) => {
      console.error('❌ SSE connection error', e);
      setConnectionStatus('dead');
      // EventSource will automatically try to reconnect
    };

    type DbChanges = Record<
      string,
      {
        created: RecordItem[];
        updated: RecordItem[];
        deleted: RecordItem[];
      }
    >;

    type CatchUpData = Record<string, RecordItem[]>;

    const processDbChanges = (changes: DbChanges) => {
      setDbData((currentDbData) => {
        const newDbData = { ...currentDbData };
        let dataChanged = false;

        for (const tableName in changes) {
          if (!newDbData[tableName]) {
            newDbData[tableName] = [];
          }

          const changeSet = changes[tableName];
          let tableData = [...newDbData[tableName]]; // Work on a copy

          // Handle created records
          if (changeSet.created && changeSet.created.length > 0) {
            tableData.push(...changeSet.created);
            dataChanged = true;
          }

          // Handle updated records
          if (changeSet.updated && changeSet.updated.length > 0) {
            changeSet.updated.forEach((updatedRecord: RecordItem) => {
              const index = tableData.findIndex(
                (record) => record.id === updatedRecord.id,
              );
              if (index !== -1) {
                tableData[index] = updatedRecord;
              } else {
                tableData.push(updatedRecord); // If not found, add it
              }
            });
            dataChanged = true;
          }

          // Handle deleted records
          if (changeSet.deleted && changeSet.deleted.length > 0) {
            const deletedIds = new Set(
              changeSet.deleted.map((record: RecordItem) => record.id),
            );
            tableData = tableData.filter(
              (record) => !deletedIds.has(record.id as string),
            );
            dataChanged = true;
          }

          newDbData[tableName] = tableData;
        }

        if (dataChanged) {
          // No need to bump a counter, the state update is enough
        }

        return newDbData;
      });
    };

    const processCatchUp = (catchUpData: CatchUpData) => {
      setDbData((currentDbData) => {
        const newDbData = { ...currentDbData };
        for (const tableName in catchUpData) {
          if (!newDbData[tableName]) {
            newDbData[tableName] = [];
          }
          const recordsToUpsert = catchUpData[tableName];
          const tableData = [...newDbData[tableName]];

          recordsToUpsert.forEach((record: RecordItem) => {
            const index = tableData.findIndex((r) => r.id === record.id);
            if (index > -1) {
              tableData[index] = record; // Update
            } else {
              tableData.push(record); // Insert
            }
          });
          newDbData[tableName] = tableData;
        }
        return newDbData;
      });
      // No need to bump a counter, the state update is enough
    };

    eventSource.addEventListener('db_change', (event) => {
      lastEventIdRef.current = event.lastEventId;
      const changes = JSON.parse(event.data);
      processDbChanges(changes);
    });

    eventSource.addEventListener('db_catch_up', (event) => {
      lastEventIdRef.current = event.lastEventId;
      const catchUpData = JSON.parse(event.data);
      console.log('Processing catch-up data...', catchUpData);
      processCatchUp(catchUpData);
    });

    // Cleanup on component unmount
    return () => {
      eventSource.close();
    };
  }, [baseUrl]);

  return (
    <DbContext.Provider
      value={{
        dbData,
        error,
        loading,
        deviceInfo,
        connectionStatus,
        baseUrl,
        restartConnection,
        tables,
        executeSql,
        setManualIp,
        manualIp,
      }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb(tableName?: string | null) {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider');
  }

  const selectedTableData = useMemo(() => {
    if (tableName) {
      return context.dbData[tableName] || [];
    }
    return null;
  }, [tableName, context.dbData]);

  return { ...context, selectedTableData };
}
