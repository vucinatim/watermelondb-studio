"use strict";

/* eslint-disable react-native/no-inline-styles */

import { useEffect, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { DbServerManager } from "../../db-server.js";
import { useDebugStore } from "../../stores/debug-store.js";
import { DebugOverlay } from "./debug-overlay.js";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const DebugProviderContent = ({
  children,
  database
}) => {
  const [debugOverlayVisible, setDebugOverlayVisible] = useState(false);
  const {
    isDbServerEnabled,
    toggleDbServer
  } = useDebugStore();
  const [serverStatus, setServerStatus] = useState('stopped');
  const [connectionInfo, setConnectionInfo] = useState(null);
  const dbServerManagerRef = useRef(null);
  useEffect(() => {
    const manager = new DbServerManager(database);
    dbServerManagerRef.current = manager;
    const unsubscribe = manager.subscribe(status => {
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
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponderCapture: (_evt, gestureState) => {
      return gestureState.numberActiveTouches === 4;
    },
    onPanResponderGrant: () => {
      setDebugOverlayVisible(true);
    }
  })).current;
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
export const DebugProvider = ({
  children,
  enabled = false,
  database
}) => {
  if (!enabled) {
    return /*#__PURE__*/_jsx(_Fragment, {
      children: children
    });
  }
  return /*#__PURE__*/_jsx(DebugProviderContent, {
    database: database,
    children: children
  });
};
//# sourceMappingURL=debug-provider.js.map