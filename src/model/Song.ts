export type SongOrigin = "file" | "url" | "youtube" | "spotify";

/**
 * One song. `source` is a playable address: a blob URL for a file or a web URL.
 * Songs that come from a file also keep the file itself, so they can be saved.
 */
export class Song {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly source: string,
    public readonly origin: SongOrigin,
    public readonly file: Blob | null = null,
  ) {}
}
