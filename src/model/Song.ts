export type SongOrigin = "file" | "url";

/** One song. `source` is a playable address: a blob URL for a file or a web URL. */
export class Song {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly source: string,
    public readonly origin: SongOrigin,
  ) {}
}
