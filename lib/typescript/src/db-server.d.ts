import { Database } from '@nozbe/watermelondb';
export type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
export declare class DbServerManager {
    private server;
    private sseClients;
    private dbUnsubscribe;
    private isClosing;
    private port;
    private ipAddress;
    private _status;
    private onStatusChange;
    private database;
    constructor(database: Database);
    private set status(value);
    get status(): ServerStatus;
    subscribe(callback: (status: ServerStatus) => void): () => void;
    getConnectionInfo(): {
        ipAddress: string;
        port: number;
    } | null;
    private handleDbRequest;
    private handleFullDbRequest;
    private handleExecuteSqlRequest;
    private handleDeviceInfoRequest;
    private handleHeartbeatRequest;
    private startDbObserver;
    private attemptToStart;
    start: () => Promise<void>;
    stop: () => void;
}
//# sourceMappingURL=db-server.d.ts.map