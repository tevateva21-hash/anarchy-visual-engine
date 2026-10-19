import { ANALYZER_VERSION, isAudioAnalysis } from '@anarchy/audio-analysis';
import type { AudioAnalysis } from '@anarchy/contracts';
const DB = 'anarchy-analysis';
const STORE = 'analyses';
const MAX_ENTRIES = 5;
const TTL = 30 * 24 * 60 * 60 * 1000;
type Entry = { key: string; accessedAt: number; analysis: AudioAnalysis };
const keyFor = (hash: string) => `${ANALYZER_VERSION}:24000:2048:512:${hash}`;
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Cache occupé par une autre fenêtre.'));
  });
}
async function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode), request = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Cache interrompu.'));
    });
  } finally { db.close(); }
}
export async function readAnalysis(hash: string): Promise<AudioAnalysis | undefined> {
  const key = keyFor(hash);
  const entry: Entry | undefined = await transact('readonly', store => store.get(key));
  if (!entry) return;
  if (!Number.isFinite(entry.accessedAt) || Date.now() - entry.accessedAt > TTL || !isAudioAnalysis(entry.analysis, hash)) {
    await transact('readwrite', store => store.delete(key));
    return;
  }
  await transact('readwrite', store => store.put({ ...entry, accessedAt: Date.now() }));
  return entry.analysis;
}
export async function writeAnalysis(analysis: AudioAnalysis): Promise<void> {
  // One transaction keeps concurrent tabs from racing the count/eviction step.
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite'), store = tx.objectStore(STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const now = Date.now(), key = keyFor(analysis.assetSha256);
        const entries = (request.result as Entry[]).filter(entry => entry.key !== key).sort((a, b) => b.accessedAt - a.accessedAt);
        entries.forEach((entry, i) => {
          if (i >= MAX_ENTRIES - 1 || now - entry.accessedAt > TTL) store.delete(entry.key);
        });
        store.put({ key, accessedAt: now, analysis });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function clearAnalysisCache(): Promise<void> {
  await transact('readwrite', store => store.clear());
}
