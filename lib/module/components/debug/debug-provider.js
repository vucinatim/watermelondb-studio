"use strict";

/* eslint-disable react-native/no-inline-styles */

import { useEffect, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { DbServerManager } from "../../db-server.js";
import { useDebugStore } from "../../stores/debug-store.js";
import { DebugOverlay } from "./debug-overlay.js";
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Instantiate the server manager outside the component
// so it persists across re-renders.
let dbServerManager = null;
export const DebugProvider = ({
  children,
  enabled = false,
  database
}) => {
  const [debugOverlayVisible, setDebugOverlayVisible] = useState(false);
  const {
    isDbServerEnabled,
    toggleDbServer
  } = useDebugStore();
  const [serverStatus, setServerStatus] = useState('stopped');
  const [connectionInfo, setConnectionInfo] = useState(null);

  // Initialize the server manager once with the database instance
  if (!dbServerManager) {
    dbServerManager = new DbServerManager(database);
  }

  // Subscribe to live status changes from the server manager
  useEffect(() => {
    const unsubscribe = dbServerManager.subscribe(status => {
      setServerStatus(status);
      if (status === 'running') {
        setConnectionInfo(dbServerManager.getConnectionInfo());
      } else {
        setConnectionInfo(null);
      }
    });
    return () => {
      if (useDebugStore.getState().isDbServerEnabled) {
        console.log('Stopping db server on component unmount (hot reload)');
        dbServerManager.stop();
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
        dbServerManager.start();
      }, 500);
    } else {
      dbServerManager.stop();
    }
  }, [isDbServerEnabled]);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponderCapture: (_evt, gestureState) => {
      return gestureState.numberActiveTouches === 4;
    },
    onPanResponderGrant: () => {
      setDebugOverlayVisible(true);
    }
  })).current;
  if (!enabled) {
    return /*#__PURE__*/_jsx(_Fragment, {
      children: children
    });
  }
  return /*#__PURE__*/_jsxs(View, {
    style: {
      flex: 1
    },
    ...panResponder.panHandlers,
    children: [children, /*#__PURE__*/_jsx(DebugOverlay, {
      visible: debugOverlayVisible,
      onClose: () => setDebugOverlayVisible(false),
      isServerEnabled: isDbServerEnabled,
      onToggleServer: toggleDbServer,
      serverStatus: serverStatus,
      connectionInfo: connectionInfo
    })]
  });
};
//# sourceMappingURL=debug-provider.js.map