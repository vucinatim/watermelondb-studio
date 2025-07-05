import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDb } from '../contexts/db-context';
import { Button } from './ui/button';

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectDialog({ open, onOpenChange }: ConnectDialogProps) {
  const [scannedIp, setScannedIp] = useState<string | null>(null);
  const [manualIpInput, setManualIpInput] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const { setManualIp, connectionStatus, baseUrl, restartConnection } = useDb();

  const isConnected = connectionStatus === 'alive' && baseUrl;

  const reset = useCallback(() => {
    setScannedIp(null);
    setManualIpInput('');
    setIsSubmittingManual(false);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        reset();
      }
      onOpenChange(isOpen);
    },
    [reset, onOpenChange],
  );

  const handleManualSubmit = () => {
    if (!manualIpInput.trim()) return;
    setIsSubmittingManual(true);
    setManualIp(manualIpInput.trim());
    setTimeout(() => {
      onOpenChange(false);
    }, 1000);
  };

  useEffect(() => {
    if (scannedIp) {
      try {
        const url = new URL(scannedIp);
        setManualIp(url.hostname);
        setTimeout(() => {
          handleOpenChange(false);
        }, 1000);
      } catch (error) {
        console.error('Invalid URL scanned:', scannedIp, error);
        setScannedIp(null); // Reset on error to allow re-scan
      }
    }
  }, [scannedIp, setManualIp, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect to a new device</DialogTitle>
          {isConnected ? (
            <DialogDescription>
              You are already connected to a device.
            </DialogDescription>
          ) : (
            <DialogDescription>
              Use your device to show the QR code.
            </DialogDescription>
          )}
        </DialogHeader>

        {isConnected ? (
          <div className="py-8 text-center">
            <p className="text-green-500">
              Connected to
              <br />
              <span className="font-mono text-green-500">
                {baseUrl?.replace(/^https?:\/\//, '')}
              </span>
            </p>
            <Button
              variant="destructive"
              className="mt-8"
              onClick={() => {
                restartConnection();
                setScannedIp(null);
              }}>
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Or enter IP manually</h3>
                <div className="flex w-full items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="192.168.1.100"
                    value={manualIpInput}
                    onChange={(e) => setManualIpInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleManualSubmit();
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    onClick={handleManualSubmit}
                    disabled={!manualIpInput.trim() || isSubmittingManual}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Instructions:</h3>
                <ol className="text-muted-foreground list-inside list-decimal text-sm">
                  <li>On your mobile device, open your app.</li>
                  <li>Tap anywhere 4 times quickly to show the QR code.</li>
                  <li>Show the QR code on the device to the camera.</li>
                </ol>
              </div>

              <div className="bg-muted relative mt-2 aspect-square w-full overflow-hidden rounded-md border">
                <Scanner
                  onScan={(result) => {
                    if (result && result.length > 0 && !scannedIp) {
                      setScannedIp(result[0].rawValue);
                    }
                  }}
                  onError={(error: unknown) => {
                    if (error instanceof Error) {
                      console.log(error.message);
                    }
                  }}
                  components={{ finder: false }}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    },
                  }}
                />

                <div className="inset-out 0 pointer-events-none absolute flex items-center justify-center">
                  <div className="h-48 w-48 rounded-lg border-2 border-dashed border-primary" />
                </div>
              </div>
              {scannedIp && (
                <p className="text-center text-sm text-green-500">
                  ✅ QR Code scanned successfully! Connecting...
                </p>
              )}
              {isSubmittingManual && (
                <p className="text-center text-sm text-green-500">
                  ✅ IP submitted! Connecting...
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
