import ky, { HTTPError } from "ky";
import { enqueue, type NewOutboxItem } from "./offline/outbox";
import { syncEngine } from "./offline/sync";
import type { OutboxFile, OutboxMethod } from "./offline/types";

/**
 * Base da API. No PC usa localhost; acessando pelo IP da rede (ex.: do
 * celular em http://192.168.x.x:5173) troca o host de localhost pelo
 * mesmo host da página, senão "localhost" apontaria para o próprio
 * celular e nada carregaria.
 */
function resolveApiBase(): string {
  const env = import.meta.env.VITE_API_URL as string | undefined;
  const base = env && env.trim() ? env : "http://localhost:8000/api/v1";
  if (typeof window === "undefined") return base;
  const host = window.location.hostname;
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    try {
      const u = new URL(base);
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
        u.hostname = host;
        return u.toString().replace(/\/$/, "");
      }
    } catch {
      /* base relativa: mantém */
    }
  }
  return base;
}

export const API_BASE = resolveApiBase();

let authToken: string | null = null;
let currentUserId: number | null = null;
let refreshHandler: (() => Promise<boolean>) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Quem está logado agora — usado para escopar a fila offline por usuário. */
export function setCurrentUserId(id: number | null): void {
  currentUserId = id;
}
syncEngine.setAuthTokenProvider(() => authToken);
syncEngine.setUserIdProvider(() => currentUserId);

/** The auth layer registers how to silently refresh an expired access token. */
export function setRefreshHandler(
  fn: (() => Promise<boolean>) | null,
): void {
  refreshHandler = fn;
}

export const api = ky.create({
  prefixUrl: API_BASE,
  retry: 0,
  // O free tier do Render hiberna (~50s p/ acordar) e o lotes.geojson é
  // pesado (milhares de polígonos numa CPU fraca). O default do ky (10s)
  // estoura nesses casos; 60s cobre cold start + a carga do mapa.
  timeout: 60000,
  hooks: {
    beforeRequest: [
      (req) => {
        if (authToken) req.headers.set("Authorization", `Bearer ${authToken}`);
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status !== 401) return response;
        if (request.headers.get("x-eixo-retry")) return response;
        if (!refreshHandler) return response;
        const ok = await refreshHandler();
        if (!ok) return response;
        request.headers.set("x-eixo-retry", "1");
        if (authToken) {
          request.headers.set("Authorization", `Bearer ${authToken}`);
        }
        return ky(request);
      },
    ],
  },
});

export interface MutationInput {
  /** Path relative to the API base, e.g. "bcis/" or "bcis/12/fotos/". */
  path: string;
  method: OutboxMethod;
  body?: unknown;
  files?: OutboxFile[];
  /** Human label shown in the offline sync UI. */
  label?: string;
}

export interface MutationResult<T> {
  /** True when the request was stored offline for later delivery. */
  queued: boolean;
  data?: T;
}

function absoluteUrl(path: string): string {
  return `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function queue(input: MutationInput): Promise<void> {
  const item: NewOutboxItem = {
    idempotencyKey: newIdempotencyKey(),
    url: absoluteUrl(input.path),
    method: input.method,
    body: input.body,
    files: input.files,
    label: input.label,
    userId: currentUserId,
  };
  await enqueue(item);
  // Refresh the indicator and (if online) kick a delivery attempt.
  void syncEngine.syncNow();
}

/**
 * Single entry point for writes from feature code. When the device is
 * offline — or a write fails because the network/server is unreachable —
 * the mutation is persisted to IndexedDB and replayed automatically once
 * connectivity returns. Genuine client errors (4xx) are thrown so callers
 * can show validation feedback instead of silently queuing bad data.
 */
export async function submitMutation<T = unknown>(
  input: MutationInput,
): Promise<MutationResult<T>> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await queue(input);
    return { queued: true };
  }

  try {
    const res = await api(input.path, {
      method: input.method,
      ...(input.files
        ? { body: toFormData(input) }
        : { json: input.body ?? {} }),
    });
    const data = (await res.json().catch(() => undefined)) as T | undefined;
    return { queued: false, data };
  } catch (err) {
    if (err instanceof HTTPError) {
      const status = err.response.status;
      if (status === 429 || status >= 500) {
        await queue(input);
        return { queued: true };
      }
      throw err; // 4xx — real client error, surface it.
    }
    // Network failure mid-request — persist and retry later.
    await queue(input);
    return { queued: true };
  }
}

function toFormData(input: MutationInput): FormData {
  const form = new FormData();
  if (input.body && typeof input.body === "object") {
    for (const [k, v] of Object.entries(input.body as Record<string, unknown>)) {
      form.append(k, typeof v === "string" ? v : JSON.stringify(v));
    }
  }
  for (const f of input.files ?? []) form.append(f.field, f.blob, f.name);
  return form;
}
