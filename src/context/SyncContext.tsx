// Empty context to avoid runtime errors
export const SyncProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const useSyncContext = () => ({});
