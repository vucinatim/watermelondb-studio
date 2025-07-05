import * as React from 'react';

import { cn } from '@/lib/utils';

interface CircularProgressProps extends React.SVGProps<SVGSVGElement> {
  connectionStatus: 'alive' | 'dead';
  value?: number;
}

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  ({ className, value = 0, connectionStatus, ...props }, ref) => {
    const r = 18;
    const circ = 2 * Math.PI * r;
    const strokePct = ((100 - value) * circ) / 100;

    return (
      <svg
        ref={ref}
        width="20"
        height="20"
        viewBox="0 0 40 40"
        className={cn('self-center', className)}
        {...props}>
        <circle
          r={r}
          cx="20"
          cy="20"
          fill="transparent"
          stroke="#e0e0e0"
          strokeWidth="3px"
        />
        <circle
          r={r}
          cx="20"
          cy="20"
          fill="transparent"
          stroke={connectionStatus === 'alive' ? '#4caf50' : '#f44336'}
          strokeWidth="3px"
          strokeDasharray={circ}
          strokeDashoffset={strokePct}
          strokeLinecap="round"
        />
      </svg>
    );
  },
);
CircularProgress.displayName = 'CircularProgress';

export { CircularProgress };
