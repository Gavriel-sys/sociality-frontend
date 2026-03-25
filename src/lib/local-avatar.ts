// src/lib/local-avatar.ts

const DB_NAME = "sociality-local-db";
const STORE_NAME = "kv";
const AVATAR_KEY = "avatar_override";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getValue<T>(key: string): Promise<T | null> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () =>
      resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function setValue<T>(key: string, value: T): Promise<void> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getLocalAvatar(): Promise<string | null> {
  return getValue<string>(AVATAR_KEY);
}

export async function setLocalAvatar(dataUrl: string): Promise<void> {
  await setValue<string>(AVATAR_KEY, dataUrl);
}
