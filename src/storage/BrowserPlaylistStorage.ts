import type { PlaylistStorage, SavedPlaylist } from "./PlaylistStorage";

const DATABASE = "music-player";
const STORE = "playlists";

/** Keeps playlists (including audio files) in this browser, using IndexedDB. */
export class BrowserPlaylistStorage implements PlaylistStorage {
  private opened: Promise<IDBDatabase> | null = null;

  save(playlist: SavedPlaylist): Promise<void> {
    return this.run("readwrite", (store) => store.put(playlist)).then(() => undefined);
  }

  async list(): Promise<SavedPlaylist[]> {
    const all = (await this.run("readonly", (store) => store.getAll())) as SavedPlaylist[];
    return all.sort((a, b) => b.savedAt - a.savedAt);
  }

  async load(name: string): Promise<SavedPlaylist | null> {
    const found = (await this.run("readonly", (store) => store.get(name))) as SavedPlaylist | undefined;
    return found ?? null;
  }

  delete(name: string): Promise<void> {
    return this.run("readwrite", (store) => store.delete(name)).then(() => undefined);
  }

  private open(): Promise<IDBDatabase> {
    if (this.opened === null) {
      this.opened = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "name" });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.opened;
  }

  private async run(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const request = action(database.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
