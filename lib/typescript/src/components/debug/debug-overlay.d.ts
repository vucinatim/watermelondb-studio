import type { ServerStatus } from '../../db-server';
interface DebugOverlayProps {
    visible: boolean;
    onClose: () => void;
    isServerEnabled: boolean;
    onToggleServer: () => void;
    serverStatus: ServerStatus;
    connectionInfo: {
        ipAddress: string;
        port: number;
    } | null;
}
export declare const DebugOverlay: ({ visible, onClose, isServerEnabled, onToggleServer, serverStatus, connectionInfo, }: DebugOverlayProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=debug-overlay.d.ts.map