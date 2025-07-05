import * as React from 'react';

export function useHighlightOnChange(data: Record<string, unknown>[]) {
  const [highlightedRows, setHighlightedRows] = React.useState<
    Set<string | number>
  >(new Set());
  const prevDataRef = React.useRef(data);

  React.useEffect(() => {
    const oldData = prevDataRef.current;
    if (oldData === data || !Array.isArray(oldData) || !Array.isArray(data)) {
      prevDataRef.current = data;
      return;
    }

    const newHighlights = new Set<string | number>();
    const oldDataMap = new Map(
      oldData
        .filter((row) => row && typeof row.id !== 'undefined')
        .map((row) => [row.id, row]),
    );

    data.forEach((newRow) => {
      if (newRow && typeof newRow.id !== 'undefined') {
        const oldRow = oldDataMap.get(newRow.id as string | number);
        if (oldRow && JSON.stringify(oldRow) !== JSON.stringify(newRow)) {
          newHighlights.add(newRow.id as string | number);
        }
      }
    });

    if (newHighlights.size > 0) {
      setHighlightedRows(newHighlights);
      const timer = setTimeout(() => {
        setHighlightedRows(new Set());
      }, 500); // Animation duration
      return () => clearTimeout(timer);
    }

    prevDataRef.current = data;
  }, [data]);

  return highlightedRows;
}
