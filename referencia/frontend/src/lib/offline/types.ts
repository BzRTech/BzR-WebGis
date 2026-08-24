export type OutboxStatus = "pending" | "syncing" | "error";

export type OutboxMethod = "POST" | "PUT" | "PATCH" | "DELETE";

/** A file captured in the field (e.g. a BCI photo) to upload as multipart. */
export interface OutboxFile {
  field: string;
  name: string;
  type: string;
  blob: Blob;
}

/**
 * A mutation captured while offline (or that failed due to the network),
 * persisted in IndexedDB until it is successfully delivered to the server.
 */
export interface OutboxItem {
  /** Auto-increment primary key — also defines FIFO replay order. */
  id?: number;
  /** Sent as `Idempotency-Key`; lets the server dedupe safe retries. */
  idempotencyKey: string;
  url: string;
  method: OutboxMethod;
  headers?: Record<string, string>;
  /** JSON body. Omitted when `files` is present (multipart). */
  body?: unknown;
  /** When set, the request is rebuilt as multipart/form-data. */
  files?: OutboxFile[];
  /** Human label for the sync UI, e.g. "BCI rascunho — Lote 12". */
  label?: string;
  /**
   * Id do usuário que criou a mutação. A fila só é reenviada (e contada)
   * para esse usuário — outra conta logada não herda envios alheios.
   */
  userId?: number | null;
  createdAt: number;
  status: OutboxStatus;
  retries: number;
  /** Epoch ms; the item is skipped until this time (backoff). */
  nextAttemptAt: number;
  lastError?: string;
}

export interface ConnectivitySnapshot {
  online: boolean;
  syncing: boolean;
  pending: number;
  failed: number;
  lastSyncAt: number | null;
  lastError: string | null;
}
