import { getDB } from "./db";
import type { OutboxItem, OutboxStatus } from "./types";

export type NewOutboxItem = Omit<
  OutboxItem,
  "id" | "createdAt" | "status" | "retries" | "nextAttemptAt"
>;

/** Persist a mutation for later delivery. Returns the assigned id. */
export async function enqueue(input: NewOutboxItem): Promise<number> {
  const db = await getDB();
  const item: OutboxItem = {
    ...input,
    createdAt: Date.now(),
    status: "pending",
    retries: 0,
    nextAttemptAt: 0,
  };
  return db.add("outbox", item);
}

/** All items, oldest first (FIFO replay order). */
export async function listAll(): Promise<OutboxItem[]> {
  const db = await getDB();
  return db.getAllFromIndex("outbox", "by-createdAt");
}

export async function get(id: number): Promise<OutboxItem | undefined> {
  const db = await getDB();
  return db.get("outbox", id);
}

export async function update(
  id: number,
  patch: Partial<OutboxItem>,
): Promise<void> {
  const db = await getDB();
  const current = await db.get("outbox", id);
  if (!current) return;
  await db.put("outbox", { ...current, ...patch, id });
}

export async function remove(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("outbox", id);
}

export async function countByStatus(
  status: OutboxStatus,
): Promise<number> {
  const db = await getDB();
  return db.countFromIndex("outbox", "by-status", status);
}

export async function count(): Promise<number> {
  const db = await getDB();
  return db.count("outbox");
}

/** Drop a failed item the user has chosen to discard. */
export async function discard(id: number): Promise<void> {
  await remove(id);
}
