import { Button } from '@/components/ui/button';
import { useDb } from '@/contexts/db-context';
import { cn } from '@/lib/utils';
import {
  IconBrandAndroid,
  IconBrandApple,
  IconPointFilled,
  IconRefresh,
} from '@tabler/icons-react';
import { useMemo } from 'react';

export function ConnectionStatus() {
  const {
    deviceInfo,
    connectionStatus,
    restartConnection,
    baseUrl,
    loading,
    error,
    manualIp,
  } = useDb();

  const connectionDetails = useMemo(() => {
    if (!manualIp && !baseUrl) {
      return {
        statusText: 'Waiting for connection...',
        subText: 'Scan the QR code on your device.',
        color: 'text-gray-500',
        isPulsing: true,
      };
    }

    if (manualIp && !baseUrl && loading && !error) {
      return {
        statusText: `Scanning for server...`,
        subText: `Trying to connect to ${manualIp}`,
        color: 'text-yellow-500',
        isPulsing: true,
      };
    }

    if (manualIp && !baseUrl && error) {
      return {
        statusText: 'Connection failed',
        subText: 'Retrying automatically...',
        color: 'text-red-500',
        isPulsing: false,
      };
    }

    if (baseUrl && connectionStatus === 'alive') {
      const friendlyUrl = baseUrl.replace(/^https?:\/\//, '');
      return {
        statusText: deviceInfo?.name ?? 'Device Connected',
        subText: `Connected to ${friendlyUrl}`,
        color: 'text-green-500',
        isPulsing: false,
      };
    }

    // Default fallback
    return {
      statusText: 'Connecting...',
      subText: 'Initializing connection...',
      color: 'text-yellow-500',
      isPulsing: true,
    };
  }, [deviceInfo, connectionStatus, baseUrl, loading, error, manualIp]);

  return (
    <div className="flex w-full items-center justify-between p-2">
      <div className="mx-2 flex flex-1 flex-col">
        <span className="flex items-center text-sm font-semibold">
          {deviceInfo?.os && connectionStatus === 'alive' && (
            <span
              className={cn(
                'mr-1 inline-flex items-center gap-1 text-xs font-light',
                deviceInfo.os === 'android' ? 'text-green-600' : 'text-sky-600',
              )}>
              {deviceInfo.os === 'android' ? (
                <IconBrandAndroid size={14} />
              ) : deviceInfo.os === 'ios' ? (
                <IconBrandApple size={14} />
              ) : null}
            </span>
          )}
          {connectionDetails.statusText}
        </span>
        <span className="text-muted-foreground text-xs">
          {connectionDetails.subText}
        </span>
      </div>
      <div className="group relative">
        <IconPointFilled
          className={cn(
            'transition-all duration-300 group-hover:opacity-0',
            connectionDetails.color,
            connectionDetails.isPulsing && 'animate-pulse',
          )}
        />
        <Button
          variant="ghost"
          size="icon"
          tooltip="Restart Connection"
          onClick={restartConnection}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
          <IconRefresh />
          <span className="sr-only">Restart Connection</span>
        </Button>
      </div>
    </div>
  );
}
