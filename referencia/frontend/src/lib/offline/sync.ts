import { listAll, update, remove } from "./outbox";
import type { ConnectivitySnapshot, OutboxItem } from "./types";

const BACKOFF_BASE_MS = 2_000;
const BACKOFF_MAX_MS = 5 * 60_000;
const SAFETY_POLL_MS = 60_000;

type AuthTokenProvider = () => string | null | undefined;
type UserIdProvider = () => number | null | undefined;
type SnapshotListener = (snapshot: ConnectivitySnapshot) => void;

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function backoffMs(retries: number): number {
  const raw = BACKOFF_BASE_MS * 2 ** retries;
  const capped = Math.min(raw, BACKOFF_MAX_MS);
  const jitter = capped * 0.2 * (Math.random() - 0.5);
  return Math.round(capped + jitter);
}

function buildRequest(item: OutboxItem): RequestInit {
  const headers: Record<string, string> = {
    "Idempotency-Key": item.idempotencyKey,
    ...item.headers,
  };

  if (item.files && item.files.length > 0) {
    const form = new FormData();
    if (item.body && typeof item.body === "object") {
      for (const [k, v] of Object.entries(item.body as Record<string, unknown>)) {
        form.append(
          k,
          typeof v === "string" ? v : JSON.stringify(v),
        );
      }
    }
    for (const f of item.files) {
      form.append(f.field, f.blob, f.name);
    }
    return { method: item.method, headers, body: form };
  }

  return {
    method: item.method,
    headers: { "Content-Type": "application/json", ...headers },
    body: item.body === undefined ? undefined : JSON.stringify(item.body),
  };
}

/**
 * Owns replay of queued mutations. The service worker handles read/asset
 * caching; this engine handles writes so it can attach auth, rebuild
 * multipart photo uploads, apply backoff and drive the sync UI.
 */
class SyncEngine {
  private flushing = false;
  private started = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private getToken: AuthTokenProvider = () => null;
  private getUserId: UserIdProvider = () => null;
  private listener: SnapshotListener | null = null;
  private lastSyncAt: number | null = null;
  private lastError: string | null = null;

  setAuthTokenProvider(fn: AuthTokenProvider): void {
    this.getToken = fn;
  }

  setUserIdProvider(fn: UserIdProvider): void {
    this.getUserId = fn;
  }

  /** Itens sem dono (legado) ou criados pelo usuário logado agora. */
  private isMine(item: OutboxItem): boolean {
    const me = this.getUserId() ?? null;
    return item.userId == null || item.userId === me;
  }

  onSnapshot(fn: SnapshotListener): void {
    this.listener = fn;
  }

  start(): void {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.emitSnapshot);
    document.addEventListener("visibilitychange", this.handleVisible);
    this.pollTimer = setInterval(() => {
      if (isOnline()) void this.flush();
    }, SAFETY_POLL_MS);
    void this.emitSnapshot();
    void this.flush();
  }

  stop(): void {
    if (!this.started || typeof window === "undefined") return;
    this.started = false;
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.emitSnapshot);
    document.removeEventListener("visibilitychange", this.handleVisible);
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.timer) clearTimeout(this.timer);
  }

  /** Force a sync attempt (e.g. the user tapped "sincronizar agora"). */
  async syncNow(): Promise<void> {
    // O toque manual zera o backoff e reativa itens que falharam, para que
    // "tentar de novo" realmente reenvie (só os do usuário logado).
    const items = await listAll();
    for (const item of items) {
      if (item.id === undefined || !this.isMine(item)) continue;
      if (item.status === "error" || item.nextAttemptAt > Date.now()) {
        await update(item.id, {
          status: "pending",
          nextAttemptAt: 0,
          lastError: undefined,
        });
      }
    }
    this.lastError = null;
    await this.flush();
  }

  /** Remove os envios com erro do usuário logado (descarte manual). */
  async discardFailed(): Promise<void> {
    const items = await listAll();
    for (const item of items) {
      if (item.id !== undefined && item.status === "error" && this.isMine(item)) {
        await remove(item.id);
      }
    }
    this.lastError = null;
    await this.emitSnapshot();
  }

  private handleOnline = (): void => {
    void this.flush();
  };

  private handleVisible = (): void => {
    if (document.visibilityState === "visible" && isOnline()) {
      void this.flush();
    }
  };

  private async flush(): Promise<void> {
    if (this.flushing || !isOnline()) {
      await this.emitSnapshot();
      return;
    }
    this.flushing = true;
    await this.emitSnapshot();

    try {
      const items = await listAll();
      const now = Date.now();
      for (const item of items) {
        if (item.id === undefined) continue;
        // Envio de outro usuário: aguarda o dono logar (não erra nem trava).
        if (!this.isMine(item)) continue;
        if (item.status === "error") continue;
        if (item.nextAttemptAt > now) continue;
        if (!isOnline()) break;

        await update(item.id, { status: "syncing" });
        const outcome = await this.deliver(item);

        if (outcome === "ok") {
          await remove(item.id);
          this.lastSyncAt = Date.now();
          this.lastError = null;
        } else if (outcome === "fatal") {
          await update(item.id, {
            status: "error",
            lastError: this.lastError ?? "Erro não recuperável",
          });
        } else if (outcome === "network") {
          // Still offline / unreachable — stop and wait for reconnection.
          await update(item.id, {
            status: "pending",
            retries: item.retries + 1,
            nextAttemptAt: Date.now() + backoffMs(item.retries),
            lastError: this.lastError ?? "Sem conexão",
          });
          break;
        } else {
          // Transient server error — retry later with backoff.
          await update(item.id, {
            status: "pending",
            retries: item.retries + 1,
            nextAttemptAt: Date.now() + backoffMs(item.retries),
            lastError: this.lastError ?? "Erro temporário no servidor",
          });
        }
      }
    } finally {
      this.flushing = false;
      await this.emitSnapshot();
      await this.scheduleNext();
    }
  }

  private async deliver(
    item: OutboxItem,
  ): Promise<"ok" | "retry" | "network" | "fatal"> {
    const init = buildRequest(item);
    const token = this.getToken();
    if (token) {
      init.headers = {
        ...(init.headers as Record<string, string>),
        Authorization: `Bearer ${token}`,
      };
    }

    let res: Response;
    try {
      res = await fetch(item.url, init);
    } catch {
      this.lastError = "Sem conexão";
      return "network";
    }

    // The server already accepted this idempotency key — treat as done.
    if (res.ok || res.status === 409) return "ok";
    if (res.status === 429 || res.status >= 500) {
      this.lastError = `Servidor respondeu ${res.status}`;
      return "retry";
    }
    this.lastError = `Requisição rejeitada (${res.status})`;
    return "fatal";
  }

  private async scheduleNext(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    const items = await listAll();
    const future = items
      .filter((i) => i.status === "pending" && i.nextAttemptAt > Date.now())
      .map((i) => i.nextAttemptAt);
    if (future.length === 0) return;
    const delay = Math.max(0, Math.min(...future) - Date.now());
    this.timer = setTimeout(() => {
      if (isOnline()) void this.flush();
    }, delay);
  }

  private emitSnapshot = async (): Promise<void> => {
    if (!this.listener) return;
    // Conta apenas a fila do usuário logado — envios de outras contas não
    // aparecem para quem não os criou.
    const mine = (await listAll()).filter((i) => this.isMine(i));
    const syncing = mine.filter((i) => i.status === "syncing").length;
    const failed = mine.filter((i) => i.status === "error").length;
    this.listener({
      online: isOnline(),
      syncing: this.flushing || syncing > 0,
      pending: mine.length - failed,
      failed,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
    });
  };
}

export const syncEngine = new SyncEngine();
