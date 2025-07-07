/* eslint-disable react-native/no-inline-styles */
import type { Database } from '@nozbe/watermelondb';
import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { DbServerManager, type ServerStatus } from '../../db-server';
import { useDebugStore } from '../../stores/debug-store';
import { DebugOverlay } from './debug-overlay';

export interface DebugProviderProps extends PropsWithChildren {
  enabled?: boolean;
  database: Database;
}

// Instantiate the server manager outside the component
// so it persists across re-renders.
let dbServerManager: DbServerManager | null = null;

export const DebugProvider = ({
  children,
  enabled = false,
  database,
}: DebugProviderProps) => {
  const [debugOverlayVisible, setDebugOverlayVisible] = useState(false);
  const { isDbServerEnabled, toggleDbServer } = useDebugStore();
  const [serverStatus, setServerStatus] = useState<ServerStatus>('stopped');
  const [connectionInfo, setConnectionInfo] = useState<{
    ipAddress: string;
    port: number;
  } | null>(null);

  // Initialize the server manager once with the database instance
  if (!dbServerManager) {
    dbServerManager = new DbServerManager(database);
  }

  // Subscribe to live status changes from the server manager
  useEffect(() => {
    const unsubscribe = dbServerManager!.subscribe((status) => {
      setServerStatus(status);
      if (status === 'running') {
        setConnectionInfo(dbServerManager!.getConnectionInfo());
      } else {
        setConnectionInfo(null);
      }
    });
    return () => {
      if (useDebugStore.getState().isDbServerEnabled) {
        console.log('Stopping db server on component unmount (hot reload)');
        dbServerManager!.stop();
      }
      unsubscribe();
    };
  }, []);

  // Sync desired state (from store) with the server's actual state
  useEffect(() => {
    if (isDbServerEnabled) {
      // IMPORTANT: Give the server a chance to stop before starting it again
      // (to prevent race condition of the tcp port)
      setTimeout(() => {
        dbServerManager!.start();
      }, 500);
    } else {
      dbServerManager!.stop();
    }
  }, [isDbServerEnabled]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (_evt, gestureState) => {
        return gestureState.numberActiveTouches === 4;
      },
      onPanResponderGrant: () => {
        setDebugOverlayVisible(true);
      },
    })
  ).current;

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
      <DebugOverlay
        visible={debugOverlayVisible}
        onClose={() => setDebugOverlayVisible(false)}
        isServerEnabled={isDbServerEnabled}
        onToggleServer={toggleDbServer}
        serverStatus={serverStatus}
        connectionInfo={connectionInfo}
      />
    </View>
  );
};
