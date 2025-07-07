import type { Database } from '@nozbe/watermelondb';
import { type PropsWithChildren } from 'react';
export interface DebugProviderProps extends PropsWithChildren {
    enabled?: boolean;
    database: Database;
}
export declare const DebugProvider: ({ children, enabled, database, }: DebugProviderProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=debug-provider.d.ts.map