"use strict";

import { Undo2 } from 'lucide-react-native';
import { Modal, Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const DebugOverlay = ({
  visible,
  onClose,
  isServerEnabled,
  onToggleServer,
  serverStatus,
  connectionInfo
}) => {
  const statusStyles = {
    running: {
      text: styles.statusTextGreen,
      container: styles.statusContainerGreen
    },
    starting: {
      text: styles.statusTextYellow,
      container: styles.statusContainerYellow
    },
    stopping: {
      text: styles.statusTextYellow,
      container: styles.statusContainerYellow
    },
    stopped: {
      text: styles.statusTextGray,
      container: styles.statusContainerGray
    },
    error: {
      text: styles.statusTextRed,
      container: styles.statusContainerRed
    }
  };
  const currentStatusStyle = statusStyles[serverStatus];
  const capitalizedStatus = serverStatus.charAt(0).toUpperCase() + serverStatus.slice(1);
  return /*#__PURE__*/_jsx(SafeAreaView, {
    style: styles.safeArea,
    pointerEvents: "box-none",
    children: /*#__PURE__*/_jsx(Modal, {
      animationType: "slide",
      transparent: true,
      visible: visible,
      onRequestClose: onClose,
      children: /*#__PURE__*/_jsxs(View, {
        style: styles.modalContainer,
        children: [/*#__PURE__*/_jsx(Text, {
          style: styles.title,
          children: "Debug Menu"
        }), /*#__PURE__*/_jsxs(View, {
          style: styles.qrContainer,
          children: [/*#__PURE__*/_jsx(Text, {
            style: styles.qrLabel,
            children: "Scan this QR code to connect to the DB viewer"
          }), connectionInfo ? /*#__PURE__*/_jsx(View, {
            style: styles.qrCode,
            children: /*#__PURE__*/_jsx(QRCode, {
              value: `http://${connectionInfo.ipAddress}:${connectionInfo.port}`,
              size: 200,
              color: "black",
              backgroundColor: "white"
            })
          }) : /*#__PURE__*/_jsx(Text, {
            children: "Starting server..."
          }), /*#__PURE__*/_jsx(Text, {
            style: styles.ipAddressText,
            children: connectionInfo ? `Device IP: ${connectionInfo.ipAddress}:${connectionInfo.port}` : 'Server not running'
          })]
        }), /*#__PURE__*/_jsxs(View, {
          style: styles.serverStatusRow,
          children: [/*#__PURE__*/_jsxs(View, {
            style: styles.serverStatusLabelContainer,
            children: [/*#__PURE__*/_jsx(Text, {
              style: styles.serverStatusLabel,
              children: "DB Viewer Server"
            }), /*#__PURE__*/_jsx(View, {
              style: [styles.statusBadge, currentStatusStyle.container],
              children: /*#__PURE__*/_jsx(Text, {
                style: [styles.statusBadgeText, currentStatusStyle.text],
                children: capitalizedStatus
              })
            })]
          }), /*#__PURE__*/_jsx(Switch, {
            trackColor: {
              false: '#767577',
              true: '#34D399'
            },
            thumbColor: '#f4f3f4',
            ios_backgroundColor: "#3e3e3e",
            onValueChange: onToggleServer,
            value: isServerEnabled
          })]
        }), /*#__PURE__*/_jsxs(Pressable, {
          style: styles.closeButton,
          onPress: onClose,
          children: [/*#__PURE__*/_jsx(Undo2, {
            size: 16
          }), /*#__PURE__*/_jsx(Text, {
            style: styles.closeButtonText,
            children: "Close"
          })]
        })]
      })
    })
  });
};
const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'center',
    backgroundColor: 'red',
    padding: 24,
    borderRadius: 16
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold'
  },
  qrContainer: {
    alignItems: 'center'
  },
  qrLabel: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16
  },
  qrCode: {
    marginBottom: 16
  },
  ipAddressText: {
    fontSize: 12,
    color: '#4B5563'
  },
  serverStatusRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16
  },
  serverStatusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  serverStatusLabel: {
    fontWeight: '600'
  },
  statusBadge: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  statusContainerGreen: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0'
  },
  statusTextGreen: {
    color: '#065F46'
  },
  statusContainerYellow: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A'
  },
  statusTextYellow: {
    color: '#92400E'
  },
  statusContainerGray: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB'
  },
  statusTextGray: {
    color: '#374151'
  },
  statusContainerRed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA'
  },
  statusTextRed: {
    color: '#991B1B'
  },
  closeButton: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    gap: 8
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600'
  }
});
//# sourceMappingURL=debug-overlay.js.map