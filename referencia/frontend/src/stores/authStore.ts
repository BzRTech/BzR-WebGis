import { create } from "zustand";
import * as auth from "@/lib/auth";
import { setCurrentUserId } from "@/lib/api";
import { syncEngine } from "@/lib/offline/sync";
import type { Me } from "@/types/auth";

type Status = "loading" | "authenticated" | "anonymous";

interface AuthState {
  status: Status;
  user: Me | null;
  bootstrap: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,

  bootstrap: async () => {
    if (!auth.loadStoredToken()) {
      setCurrentUserId(null);
      set({ status: "anonymous", user: null });
      return;
    }
    try {
      const user = await auth.fetchMe();
      setCurrentUserId(user.id);
      set({ status: "authenticated", user });
      void syncEngine.syncNow();
    } catch {
      auth.clearTokens();
      setCurrentUserId(null);
      set({ status: "anonymous", user: null });
    }
  },

  signIn: async (username, password) => {
    await auth.login(username, password);
    const user = await auth.fetchMe();
    setCurrentUserId(user.id);
    set({ status: "authenticated", user });
    void syncEngine.syncNow();
  },

  signOut: async () => {
    await auth.logout();
    setCurrentUserId(null);
    set({ status: "anonymous", user: null });
  },
}));
