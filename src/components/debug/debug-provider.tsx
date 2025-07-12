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

const DebugProviderContent = ({
  children,
  database,
}: PropsWithChildren<{ database: Database }>) => {
  const [debugOverlayVisible, setDebugOverlayVisible] = useState(false);
  const { isDbServerEnabled, toggleDbServer } = useDebugStore();
  const [serverStatus, setServerStatus] = useState<ServerStatus>('stopped');
  const [connectionInfo, setConnectionInfo] = useState<{
    ipAddress: string;
    port: number;
  } | null>(null);

  const dbServerManagerRef = useRef<DbServerManager | null>(null);

  useEffect(() => {
    const manager = new DbServerManager(database);
    dbServerManagerRef.current = manager;

    const unsubscribe = manager.subscribe((status) => {
      setServerStatus(status);
      if (status === 'running') {
        setConnectionInfo(manager.getConnectionInfo());
      } else {
        setConnectionInfo(null);
      }
    });

    if (useDebugStore.getState().isDbServerEnabled) {
      setTimeout(() => {
        manager.start();
      }, 500);
    }

    return () => {
      manager.stop();
      unsubscribe();
    };
  }, [database]);

  useEffect(() => {
    const manager = dbServerManagerRef.current;
    if (!manager) {
      return;
    }
    if (isDbServerEnabled) {
      setTimeout(() => {
        manager.start();
      }, 500);
    } else {
      manager.stop();
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

export const DebugProvider = ({
  children,
  enabled = false,
  database,
}: DebugProviderProps) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <DebugProviderContent database={database}>{children}</DebugProviderContent>
  );
};
