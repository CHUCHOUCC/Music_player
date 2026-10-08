import type { Song } from "../model/Song";

/** What an engine tells the player. */
export interface PlaybackEvents {
  ended(): void;
  playingChanged(playing: boolean): void;
  failed(message: string): void;
}

/** Something that can play one kind of song (audio file, YouTube, Spotify). */
export interface PlaybackEngine {
  play(song: Song): void;
  stop(): void;
}
