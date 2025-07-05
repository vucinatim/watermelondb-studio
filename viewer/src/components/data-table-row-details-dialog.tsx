import ReactJson from 'react-json-view';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DataTableRowDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowData: Record<string, unknown> | null;
}

export function DataTableRowDetailsDialog({
  open,
  onOpenChange,
  rowData,
}: DataTableRowDetailsDialogProps) {
  if (!rowData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Row Details</DialogTitle>
          {/* <DialogDescription>
            Here are the details for the selected row.
          </DialogDescription> */}
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-1">
          <div className="grid gap-4 py-4">
            {Object.entries(rowData).map(([key, value]) => {
              let content;
              let isJson = false;
              let ParsedValue = value;

              if (typeof value === 'string') {
                try {
                  const parsed = JSON.parse(value);
                  if (typeof parsed === 'object' && parsed !== null) {
                    ParsedValue = parsed;
                    isJson = true;
                  }
                } catch {
                  // Not a JSON string
                }
              } else if (typeof value === 'object' && value !== null) {
                isJson = true;
              }

              if (isJson) {
                content = (
                  <ReactJson
                    src={ParsedValue as object}
                    name={false}
                    displayDataTypes={false}
                    displayObjectSize={false}
                    indentWidth={2}
                    collapseStringsAfterLength={150}
                    enableClipboard={false}
                    style={{ background: 'transparent' }}
                  />
                );
              } else {
                content = (
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm">
                    {String(value)}
                  </pre>
                );
              }

              return (
                <div className="grid gap-2" key={key}>
                  <span className="font-bold">{key}</span>
                  <div className="w-full">{content}</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
