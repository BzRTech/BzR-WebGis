import { registerSW } from "virtual:pwa-register";
import { useConnectivityStore } from "@/stores/connectivityStore";
import { syncEngine } from "./sync";

export { syncEngine } from "./sync";
export * as outbox from "./outbox";
export type {
  OutboxItem,
  OutboxStatus,
  OutboxFile,
  ConnectivitySnapshot,
} from "./types";

let initialized = false;

/**
 * Boot the offline layer: register the service worker (app shell + tile
 * caching), connect the sync engine to the connectivity store, and start
 * replaying any queued mutations. Call once, at app startup.
 */
export function initOffline(): void {
  if (initialized) return;
  initialized = true;

  const store = useConnectivityStore.getState();

  syncEngine.onSnapshot((snapshot) => {
    useConnectivityStore.getState().setSnapshot(snapshot);
  });
  syncEngine.start();

  registerSW({
    immediate: true,
    onNeedRefresh() {
      store.setUpdateReady(true);
    },
  });
}
