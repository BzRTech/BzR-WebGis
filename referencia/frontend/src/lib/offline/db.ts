import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { OutboxItem } from "./types";

interface EixoDB extends DBSchema {
  outbox: {
    key: number;
    value: OutboxItem;
    indexes: { "by-status": string; "by-createdAt": number };
  };
}

const DB_NAME = "eixo-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<EixoDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<EixoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<EixoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("outbox", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by-status", "status");
        store.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}
