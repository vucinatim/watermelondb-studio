import { Database, Q } from '@nozbe/watermelondb';
import { Buffer } from 'buffer';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import TcpSocket from 'react-native-tcp-socket';
import { executeSql } from './utils/execute-sql';

const BASE_PORT = 12345;
const MAX_PORT = 12355; // Stop after 10 attempts
const VIEWER_ORIGIN = '*';

/**
 * A helper for timestamped logs to clearly see the sequence of events during reloads.
 * @param message The message to log.
 */
const log = (message: string) => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now
    .getMilliseconds()
    .toString()
    .padStart(3, '0')}`;
  console.log(`💾 [DB Studio Server ${time}] ${message}`);
};

// #region HTTP Helpers
const parseHttpRequest = (
  requestString: string
): {
  method: string;
  path: string;
  body: string;
  headers: Record<string, string>;
} => {
  const [requestLine, ...rest] = requestString.split('\r\n');
  const [method = '', path = ''] = (requestLine || '').split(' ');

  const emptyLineIndex = rest.findIndex((line) => line === '');
  const headerLines =
    emptyLineIndex === -1 ? rest : rest.slice(0, emptyLineIndex);
  const body =
    emptyLineIndex === -1 ? '' : rest.slice(emptyLineIndex + 1).join('\r\n');

  const headers = headerLines.reduce(
    (acc, header) => {
      const [key, value] = header.split(': ');
      if (key && value) {
        acc[key.toLowerCase()] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  return { method, path, body, headers };
};

const createHttpResponse = (
  body: Record<string, any>,
  statusCode = 200,
  statusMessage = 'OK'
) => {
  const bodyString = JSON.stringify(body);
  return [
    `HTTP/1.1 ${statusCode} ${statusMessage}`,
    'Content-Type: application/json; charset=utf-8',
    `Content-Length: ${Buffer.byteLength(bodyString, 'utf8')}`,
    `Access-Control-Allow-Origin: ${VIEWER_ORIGIN}`,
    'Connection: close',
    '',
    bodyString,
  ].join('\r\n');
};

const createCorsResponse = () => {
  return [
    'HTTP/1.1 204 No Content',
    `Access-Control-Allow-Origin: ${VIEWER_ORIGIN}`,
    'Access-Control-Allow-Methods: GET, POST, OPTIONS',
    'Access-Control-Allow-Headers: Content-Type, Last-Event-ID',
    'Connection: close',
    '',
    '',
  ].join('\r\n');
};
// #endregion

export type ServerStatus =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error';

export class DbServerManager {
  private server: TcpSocket.Server | null = null;
  private sseClients = new Set<TcpSocket.Socket>();
  private dbUnsubscribe: (() => void) | null = null;
  private isClosing = false;
  private port: number | null = null;
  private ipAddress: string | null = null;
  private _status: ServerStatus = 'stopped';
  private onStatusChange: ((status: ServerStatus) => void) | null = null;
  private database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  private set status(newStatus: ServerStatus) {
    if (this._status !== newStatus) {
      this._status = newStatus;
      this.onStatusChange?.(this._status);
    }
  }

  get status(): ServerStatus {
    return this._status;
  }

  subscribe(callback: (status: ServerStatus) => void): () => void {
    this.onStatusChange = callback;
    callback(this.status); // Immediately send the current status
    // Return an unsubscribe function
    return () => {
      this.onStatusChange = null;
    };
  }

  getConnectionInfo(): { ipAddress: string; port: number } | null {
    if (this.ipAddress && this.port) {
      return { ipAddress: this.ipAddress, port: this.port };
    }
    return null;
  }

  // #region Route Handlers
  private handleDbRequest = async (lastEventId?: number) => {
    const tableNames = Object.keys(this.database.schema.tables);
    const allData: Record<string, unknown[]> = {};
    let maxLastModified = lastEventId || 0;

    for (const tableName of tableNames) {
      const collection = this.database.collections.get(tableName);
      if (!collection) continue;

      const tableSchema = this.database.schema.tables[tableName];
      if (!tableSchema) continue;

      const hasLastModified = !!tableSchema.columns.last_modified;
      let query = collection.query();

      if (lastEventId && hasLastModified) {
        query = collection.query(Q.where('last_modified', Q.gt(lastEventId)));
      }

      const records = await query.fetch();
      const rawRecords = records.map((record: any) => {
        if (hasLastModified) {
          const recordLastModified = (record._raw as any).last_modified as
            | number
            | null;
          if (recordLastModified && recordLastModified > maxLastModified) {
            maxLastModified = recordLastModified;
          }
        }
        return record._raw;
      });

      if (rawRecords.length > 0) {
        allData[tableName] = rawRecords;
      }
    }

    return { data: allData, maxLastModified };
  };

  private handleFullDbRequest = async () => {
    const { data } = await this.handleDbRequest();
    return createHttpResponse({ data });
  };

  private handleExecuteSqlRequest = async (request: {
    method: string;
    path: string;
    body: string;
  }) => {
    const { body } = request;
    let requestData: { sql?: string; params?: unknown[] } = {};
    try {
      if (body) {
        requestData = JSON.parse(body);
      }
    } catch (e) {
      log(`Invalid JSON in body: ${e}`);
      return createHttpResponse({ error: 'Invalid JSON in body' }, 400);
    }

    const { sql, params = [] } = requestData;
    if (!sql) {
      return createHttpResponse({ error: 'Missing SQL query' }, 400);
    }

    const results = await executeSql(this.database, sql, params);
    return createHttpResponse({ ok: true, results });
  };

  private handleDeviceInfoRequest = async () => {
    return createHttpResponse({
      name: Device.modelName,
      os: Platform.OS,
    });
  };

  private handleHeartbeatRequest = async () => {
    return createHttpResponse({ status: 'ok', timestamp: Date.now() });
  };
  // #endregion

  private startDbObserver = () => {
    log('Starting DB observer.');
    const allTableNames = Object.keys(this.database.schema.tables);
    const validCollections = allTableNames
      .map((tableName) => ({
        tableName,
        collection: this.database.collections.get(tableName),
      }))
      .filter(({ collection, tableName }) => {
        if (!collection) {
          log(
            `[Warning] No collection found for table "${tableName}" in schema. Skipping observer.`
          );
          return false;
        }
        return true;
      });

    const tableNames = validCollections.map((vc) => vc.tableName);

    if (tableNames.length === 0) {
      log('No valid tables found to observe. Skipping DB observer.');
      return;
    }

    const subscription = this.database
      .withChangesForTables(tableNames)
      .subscribe((changes: any) => {
        if (!changes || !Array.isArray(changes) || changes.length === 0) {
          return;
        }

        const sanitizedChanges: Record<
          string,
          { created: any[]; updated: any[]; deleted: any[] }
        > = {};
        let maxLastModified = 0;

        for (const change of changes) {
          const tableName = change.record.collection.table;
          const tableSchema = this.database.schema.tables[tableName];
          if (!tableSchema) continue;

          if (tableSchema.columns.last_modified) {
            const recordLastModified = (change.record._raw as any)
              .last_modified as number | null;
            if (recordLastModified && recordLastModified > maxLastModified) {
              maxLastModified = recordLastModified;
            }
          }

          if (!sanitizedChanges[tableName]) {
            sanitizedChanges[tableName] = {
              created: [],
              updated: [],
              deleted: [],
            };
          }

          switch (change.type) {
            case 'created':
              sanitizedChanges[tableName].created.push(change.record._raw);
              break;
            case 'updated':
              sanitizedChanges[tableName].updated.push(change.record._raw);
              break;
            case 'deleted':
              sanitizedChanges[tableName].deleted.push(change.record._raw);
              break;
          }
        }

        if (Object.keys(sanitizedChanges).length === 0) {
          return;
        }

        log(`DB changes detected. Notifying ${this.sseClients.size} clients.`);
        const eventId = maxLastModified || Date.now();
        const message = `id: ${eventId}\nevent: db_change\ndata: ${JSON.stringify(
          sanitizedChanges
        )}\n\n`;
        for (const client of this.sseClients) {
          client.write(message);
        }
      });

    this.dbUnsubscribe = () => {
      log('Stopping DB observer.');
      subscription.unsubscribe();
    };
  };

  private attemptToStart = (port: number) => {
    if (port > MAX_PORT) {
      log(`All ports from ${BASE_PORT} to ${MAX_PORT} are in use. Aborting.`);
      this.status = 'error';
      return;
    }

    if (this.server) {
      this.server.removeAllListeners();
      this.server = null;
    }

    this.isClosing = false;
    log(`Attempting to start server on port ${port}.`);

    const newServer = TcpSocket.createServer((socket) => {
      socket.on('data', async (data) => {
        try {
          const request = parseHttpRequest(data.toString());
          log(`-> ${request.method} ${request.path}`);

          const url = new URL(request.path, `http://${this.ipAddress}`);

          if (url.pathname === '/events') {
            const lastEventIdStr = request.headers['last-event-id'];
            log(
              `SSE client connected. ${
                lastEventIdStr ? `Last ID: ${lastEventIdStr}` : 'New client.'
              }`
            );

            const headers = [
              'HTTP/1.1 200 OK',
              'Content-Type: text/event-stream',
              'Connection: keep-alive',
              'Cache-Control: no-cache',
              `Access-Control-Allow-Origin: ${VIEWER_ORIGIN}`,
              '',
              '',
            ].join('\r\n');
            socket.write(headers);
            this.sseClients.add(socket);

            if (lastEventIdStr) {
              const parsedId = parseInt(lastEventIdStr, 10);
              if (!isNaN(parsedId)) {
                const { data: catchUpData, maxLastModified } =
                  await this.handleDbRequest(parsedId);

                if (Object.keys(catchUpData).length > 0) {
                  log('Sending catch-up data to client.');
                  const message = `id: ${maxLastModified}\nevent: db_catch_up\ndata: ${JSON.stringify(
                    catchUpData
                  )}\n\n`;
                  socket.write(message);
                }
              }
            }

            socket.on('close', () => {
              log('SSE client disconnected.');
              this.sseClients.delete(socket);
            });
            return; // Keep connection open for SSE
          }

          let httpResponse;

          if (request.method === 'OPTIONS') {
            httpResponse = createCorsResponse();
          } else {
            switch (url.pathname) {
              case '/api/db':
                httpResponse = await this.handleFullDbRequest();
                break;
              case '/api/execute-sql':
                httpResponse = await this.handleExecuteSqlRequest(request);
                break;
              case '/api/device-info':
                httpResponse = await this.handleDeviceInfoRequest();
                break;
              case '/api/heartbeat':
                httpResponse = await this.handleHeartbeatRequest();
                break;
              default:
                httpResponse = createHttpResponse({ error: 'Not Found' }, 404);
            }
          }
          socket.end(httpResponse);
        } catch (e: any) {
          log(`Error processing request: ${e.message}`);
          const responseBody = { error: 'Server Error', details: e.message };
          socket.end(createHttpResponse(responseBody, 500));
        }
      });
      socket.on('error', (error) => log(`Socket error: ${error.message}`));
    });

    newServer.on('error', (e: any) => {
      if (this.isClosing) {
        log('Ignoring error on already-closing server.');
        return;
      }
      if (
        e.code === 'EADDRINUSE' ||
        (e.message && e.message.includes('EADDRINUSE'))
      ) {
        log(
          `Port ${port} is in use. Closing this instance and trying next port...`
        );
        this.isClosing = true;
        newServer.close(() => {
          // Add a small delay before trying the next port
          setTimeout(() => {
            this.isClosing = false;
            this.attemptToStart(port + 1);
          }, 100);
        });
      } else {
        log(`An unexpected error occurred: ${e.toString()}`);
        this.status = 'error';
      }
    });

    newServer.listen({ port, host: '0.0.0.0', reuseAddress: true }, () => {
      log(`✅ Server started successfully on port ${port}.`);
      this.server = newServer;
      this.port = port;
      this.status = 'running';
      this.startDbObserver();
    });
  };

  start = async () => {
    if (this.status === 'running' || this.status === 'starting') {
      log('Server is already running or starting.');
      return;
    }
    log('Request to start DB server received.');
    this.status = 'starting';
    this.ipAddress = await Network.getIpAddressAsync();
    // Add a small delay for the UI to update before starting
    setTimeout(() => this.attemptToStart(BASE_PORT), 100);
  };

  stop = () => {
    if (this.status !== 'running' && this.status !== 'error') {
      log('Server is not running or already stopped.');
      return;
    }
    log('Request to stop DB server received.');
    this.status = 'stopping';
    this.isClosing = true;

    this.dbUnsubscribe?.();
    this.dbUnsubscribe = null;

    for (const client of this.sseClients) {
      client.end();
    }
    this.sseClients.clear();

    if (this.server) {
      this.server.close(() => {
        log(`Server on port ${this.port} stopped.`);
        this.server = null;
        this.port = null;
        this.status = 'stopped';
        this.isClosing = false;
      });
    } else {
      // If server wasn't even created (e.g. error state from start)
      this.status = 'stopped';
      this.isClosing = false;
    }
  };
}
