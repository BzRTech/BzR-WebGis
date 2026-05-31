import { create } from "zustand";
import type { ConnectivitySnapshot } from "@/lib/offline/types";

interface ConnectivityState extends ConnectivitySnapshot {
  /** A new app version was precached and is waiting to activate. */
  updateReady: boolean;
  setSnapshot: (s: ConnectivitySnapshot) => void;
  setUpdateReady: (v: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  syncing: false,
  pending: 0,
  failed: 0,
  lastSyncAt: null,
  lastError: null,
  updateReady: false,
  setSnapshot: (s) => set(s),
  setUpdateReady: (v) => set({ updateReady: v }),
}));
