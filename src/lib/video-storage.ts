/**
 * IndexedDB storage for proposal video files.
 * Videos can be large (50MB - 100MB+), so storing them as binary Blobs in IndexedDB
 * avoids blocking localStorage or freezing memory with large Base64 strings.
 */

const DB_NAME = "RomanticProposalMediaDB";
const DB_VERSION = 1;
const STORE_NAME = "videos";

export type VideoTarget = "draft" | "published";

export interface StoredVideo {
  target: VideoTarget;
  blob: Blob;
  name: string;
  size: number;
  type: string;
  duration?: number;
  updatedAt: number;
}

let dbInstance: IDBDatabase | null = null;

function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

async function getDB(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    throw new Error("IndexedDB is not supported in this environment");
  }

  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "target" });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });
}

/**
 * Saves a video blob to IndexedDB under the specified target ('draft' | 'published').
 */
export async function saveVideoBlob(
  target: VideoTarget,
  blob: Blob,
  metadata: { name: string; size: number; type: string; duration?: number },
): Promise<StoredVideo> {
  const db = await getDB();

  const record: StoredVideo = {
    target,
    blob,
    name: metadata.name,
    size: metadata.size,
    type: metadata.type,
    ...(metadata.duration !== undefined ? { duration: metadata.duration } : {}),
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => {
        resolve(record);
      };

      request.onerror = () => {
        reject(request.error || new Error(`Failed to save video to ${target}`));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Retrieves the stored video record from IndexedDB for the given target.
 */
export async function getVideoBlob(target: VideoTarget): Promise<StoredVideo | null> {
  if (!isIndexedDBAvailable()) return null;

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(target);

      request.onsuccess = () => {
        resolve((request.result as StoredVideo) || null);
      };

      request.onerror = () => {
        reject(request.error || new Error(`Failed to read video for ${target}`));
      };
    });
  } catch (err) {
    console.warn("Could not retrieve video from IndexedDB:", err);
    return null;
  }
}

/**
 * Copies the draft video record to published.
 */
export async function publishDraftVideo(): Promise<void> {
  const draft = await getVideoBlob("draft");
  if (!draft) {
    // If draft is null, it might mean draft video was removed
    await deleteVideo("published");
    return;
  }

  await saveVideoBlob("published", draft.blob, {
    name: draft.name,
    size: draft.size,
    type: draft.type,
    ...(draft.duration !== undefined ? { duration: draft.duration } : {}),
  });
}

/**
 * Deletes a video record from IndexedDB.
 */
export async function deleteVideo(target: VideoTarget): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(target);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error || new Error(`Failed to delete ${target} video`));
    });
  } catch (err) {
    console.warn("Could not delete video from IndexedDB:", err);
  }
}

/**
 * Memory-safe Object URL cache to ensure we revoke previously created URLs.
 */
const objectUrlMap = new Map<string, string>();

export function getOrCreateVideoObjectUrl(key: string, blob: Blob): string {
  if (typeof window === "undefined") return "";

  const existing = objectUrlMap.get(key);
  if (existing) {
    return existing;
  }

  const url = URL.createObjectURL(blob);
  objectUrlMap.set(key, url);
  return url;
}

export function revokeVideoObjectUrl(key: string): void {
  if (typeof window === "undefined") return;

  const existing = objectUrlMap.get(key);
  if (existing) {
    URL.revokeObjectURL(existing);
    objectUrlMap.delete(key);
  }
}
