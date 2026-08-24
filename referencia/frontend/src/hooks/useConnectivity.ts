import { useConnectivityStore } from "@/stores/connectivityStore";
import { syncEngine } from "@/lib/offline/sync";

export function useConnectivity() {
  const online = useConnectivityStore((s) => s.online);
  const syncing = useConnectivityStore((s) => s.syncing);
  const pending = useConnectivityStore((s) => s.pending);
  const failed = useConnectivityStore((s) => s.failed);
  const lastSyncAt = useConnectivityStore((s) => s.lastSyncAt);
  const lastError = useConnectivityStore((s) => s.lastError);

  return {
    online,
    syncing,
    pending,
    failed,
    lastSyncAt,
    lastError,
    syncNow: () => syncEngine.syncNow(),
    discardFailed: () => syncEngine.discardFailed(),
  };
}
