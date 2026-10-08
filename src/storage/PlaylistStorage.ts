/** A song as it is stored: files keep their data (`file`), web songs keep their address (`url`). */
export interface SavedSong {
  title: string;
  origin: "file" | "url" | "youtube" | "spotify";
  url: string | null;
  file: Blob | null;
}

export interface SavedPlaylist {
  name: string;
  savedAt: number;
  songs: SavedSong[];
}

/** Where playlists are kept. The app only knows this interface, so the place can change later. */
export interface PlaylistStorage {
  save(playlist: SavedPlaylist): Promise<void>;
  list(): Promise<SavedPlaylist[]>;
  load(name: string): Promise<SavedPlaylist | null>;
  delete(name: string): Promise<void>;
}
