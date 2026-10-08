import type { Song } from "../model/Song";
import type { MediaKind } from "./MediaLink";
import type { PlaybackEngine } from "./PlaybackEngine";

/** Chooses the right engine for each song and makes sure only one plays at a time. */
export class PlaybackRouter {
  constructor(private readonly engines: Record<MediaKind, PlaybackEngine>) {}

  play(song: Song): void {
    const chosen = this.engines[PlaybackRouter.kindOf(song)];
    // Every other engine is stopped (and hides its player), so only one plays at a time.
    for (const engine of Object.values(this.engines)) {
      if (engine !== chosen) engine.stop();
    }
    chosen.play(song);
  }

  stop(): void {
    for (const engine of Object.values(this.engines)) engine.stop();
  }

  static kindOf(song: Song): MediaKind {
    return song.origin === "youtube" || song.origin === "spotify" ? song.origin : "audio";
  }
}
