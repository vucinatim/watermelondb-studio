interface DebugState {
    isDbServerEnabled: boolean;
    toggleDbServer: () => void;
}
export declare const useDebugStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<DebugState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<DebugState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: DebugState) => void) => () => void;
        onFinishHydration: (fn: (state: DebugState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<DebugState, unknown>>;
    };
}>;
export {};
//# sourceMappingURL=debug-store.d.ts.map