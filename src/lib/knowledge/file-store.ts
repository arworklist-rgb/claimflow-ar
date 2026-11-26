import { clear, createStore, del, get, set, type UseStore } from "idb-keyval";

/**
 * Knowledge Center files live in IndexedDB (never localStorage); only metadata is in the Zustand store.
 * The IndexedDB handle is created on first use, so importing this module on the server is harmless.
 */
let store: UseStore | undefined;
const files = () => (store ??= createStore("claimflow-ar", "knowledge-files"));

export const saveKnowledgeFile = (id: string, blob: Blob) => set(id, blob, files());
export const loadKnowledgeFile = (id: string) => get<Blob>(id, files());
export const deleteKnowledgeFile = (id: string) => del(id, files());
export const hasKnowledgeFile = async (id: string) => (await get(id, files())) !== undefined;

/** Removes every stored file (used by Reset demo data). */
export async function clearKnowledgeFiles() {
  try {
    await clear(files());
  } catch {
    // IndexedDB can be unavailable (private windows); there is nothing to clear then.
  }
}
