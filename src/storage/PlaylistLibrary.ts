import { Playlist } from "../model/Playlist";
import { Song } from "../model/Song";
import type { PlaylistStorage, SavedPlaylist, SavedSong } from "./PlaylistStorage";

/** Saves the current playlist and rebuilds saved ones. It does not care where they are stored. */
export class PlaylistLibrary {
  constructor(
    private readonly storage: PlaylistStorage,
    private readonly createUrl: (file: Blob) => string = (file) => URL.createObjectURL(file),
  ) {}

  async save(name: string, playlist: Playlist): Promise<void> {
    const cleanName = name.trim();
    if (cleanName === "") throw new Error("The playlist needs a name");
    if (playlist.size === 0) throw new Error("The playlist is empty");
    const songs: SavedSong[] = playlist.list().map((song) => ({
      title: song.title,
      origin: song.origin,
      url: song.origin === "url" ? song.source : null,
      file: song.file,
    }));
    await this.storage.save({ name: cleanName, savedAt: Date.now(), songs });
  }

  list(): Promise<SavedPlaylist[]> {
    return this.storage.list();
  }

  /** Puts the saved songs, in the same order, into `playlist`. Returns false if it does not exist. */
  async loadInto(name: string, playlist: Playlist): Promise<boolean> {
    const saved = await this.storage.load(name);
    if (saved === null) return false;
    const songs = saved.songs.map((item) => {
      const source = item.file !== null ? this.createUrl(item.file) : (item.url ?? "");
      return new Song(crypto.randomUUID(), item.title, source, item.origin, item.file);
    });
    playlist.replaceWith(songs);
    return true;
  }

  delete(name: string): Promise<void> {
    return this.storage.delete(name);
  }
}
