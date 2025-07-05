import type { ServerStatus } from '../../db-server';
import { Undo2 } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export const DebugOverlay = ({
  visible,
  onClose,
  isServerEnabled,
  onToggleServer,
  serverStatus,
  connectionInfo,
}: DebugOverlayProps) => {
  const statusStyles: {
    [key in ServerStatus]: {
      text: object;
      container: object;
    };
  } = {
    running: {
      text: styles.statusTextGreen,
      container: styles.statusContainerGreen,
    },
    starting: {
      text: styles.statusTextYellow,
      container: styles.statusContainerYellow,
    },
    stopping: {
      text: styles.statusTextYellow,
      container: styles.statusContainerYellow,
    },
    stopped: {
      text: styles.statusTextGray,
      container: styles.statusContainerGray,
    },
    error: {
      text: styles.statusTextRed,
      container: styles.statusContainerRed,
    },
  };

  const currentStatusStyle = statusStyles[serverStatus];
  const capitalizedStatus =
    serverStatus.charAt(0).toUpperCase() + serverStatus.slice(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        animationType="slide"
        transparent
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Debug Menu</Text>
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>
              Scan this QR code to connect to the DB viewer
            </Text>
            {connectionInfo ? (
              <View style={styles.qrCode}>
                <QRCode
                  value={`http://${connectionInfo.ipAddress}:${connectionInfo.port}`}
                  size={200}
                  color="black"
                  backgroundColor="white"
                />
              </View>
            ) : (
              <Text>Starting server...</Text>
            )}
            <Text style={styles.ipAddressText}>
              {connectionInfo
                ? `Device IP: ${connectionInfo.ipAddress}:${connectionInfo.port}`
                : 'Server not running'}
            </Text>
          </View>

          <View style={styles.serverStatusRow}>
            <View style={styles.serverStatusLabelContainer}>
              <Text style={styles.serverStatusLabel}>DB Viewer Server</Text>
              <View style={[styles.statusBadge, currentStatusStyle.container]}>
                <Text style={[styles.statusBadgeText, currentStatusStyle.text]}>
                  {capitalizedStatus}
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#34D399' }}
              thumbColor={'#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={onToggleServer}
              value={isServerEnabled}
            />
          </View>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Undo2 size={16} />
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrLabel: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  qrCode: {
    marginBottom: 16,
  },
  ipAddressText: {
    fontSize: 12,
    color: '#4B5563',
  },
  serverStatusRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
  },
  serverStatusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serverStatusLabel: {
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusContainerGreen: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  statusTextGreen: {
    color: '#065F46',
  },
  statusContainerYellow: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusTextYellow: {
    color: '#92400E',
  },
  statusContainerGray: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  statusTextGray: {
    color: '#374151',
  },
  statusContainerRed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  statusTextRed: {
    color: '#991B1B',
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
    gap: 8,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
