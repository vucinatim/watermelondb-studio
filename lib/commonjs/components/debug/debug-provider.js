"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DebugProvider = void 0;
var _react = require("react");
var _reactNative = require("react-native");
var _dbServer = require("../../db-server");
var _debugStore = require("../../stores/debug-store");
var _debugOverlay = require("./debug-overlay");
var _jsxRuntime = require("react/jsx-runtime");
/* eslint-disable react-native/no-inline-styles */

// Instantiate the server manager outside the component
// so it persists across re-renders.
let dbServerManager = null;
const DebugProvider = ({
  children,
  enabled = false,
  database
}) => {
  const [debugOverlayVisible, setDebugOverlayVisible] = (0, _react.useState)(false);
  const {
    isDbServerEnabled,
    toggleDbServer
  } = (0, _debugStore.useDebugStore)();
  const [serverStatus, setServerStatus] = (0, _react.useState)('stopped');
  const [connectionInfo, setConnectionInfo] = (0, _react.useState)(null);

  // Initialize the server manager once with the database instance
  if (!dbServerManager) {
    dbServerManager = new _dbServer.DbServerManager(database);
  }

  // Subscribe to live status changes from the server manager
  (0, _react.useEffect)(() => {
    const unsubscribe = dbServerManager.subscribe(status => {
      setServerStatus(status);
      if (status === 'running') {
        setConnectionInfo(dbServerManager.getConnectionInfo());
      } else {
        setConnectionInfo(null);
      }
    });
    return () => {
      if (_debugStore.useDebugStore.getState().isDbServerEnabled) {
        console.log('Stopping db server on component unmount (hot reload)');
        dbServerManager.stop();
      }
      unsubscribe();
    };
  }, []);

  // Sync desired state (from store) with the server's actual state
  (0, _react.useEffect)(() => {
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
  const panResponder = (0, _react.useRef)(_reactNative.PanResponder.create({
    onStartShouldSetPanResponderCapture: (_evt, gestureState) => {
      return gestureState.numberActiveTouches === 4;
    },
    onPanResponderGrant: () => {
      setDebugOverlayVisible(true);
    }
  })).current;
  if (!enabled) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
      children: children
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.View, {
    style: {
      flex: 1
    },
    ...panResponder.panHandlers,
    children: [children, /*#__PURE__*/(0, _jsxRuntime.jsx)(_debugOverlay.DebugOverlay, {
      visible: debugOverlayVisible,
      onClose: () => setDebugOverlayVisible(false),
      isServerEnabled: isDbServerEnabled,
      onToggleServer: toggleDbServer,
      serverStatus: serverStatus,
      connectionInfo: connectionInfo
    })]
  });
};
exports.DebugProvider = DebugProvider;
//# sourceMappingURL=debug-provider.js.map