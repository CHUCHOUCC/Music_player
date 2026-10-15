import type { Song } from "../model/Song";
import type { MediaKind } from "./MediaLink";
import type { PlaybackEngine } from "./PlaybackEngine";

/** Chooses the right engine for each song and makes sure only one plays at a time. */
export class PlaybackRouter {
  private active: PlaybackEngine | null = null;

  constructor(private readonly engines: Record<MediaKind, PlaybackEngine>) {}

  play(song: Song): void {
    const chosen = this.engines[PlaybackRouter.kindOf(song)];
    // Every other engine is stopped (and hides its player), so only one plays at a time.
    for (const engine of Object.values(this.engines)) {
      if (engine !== chosen) engine.stop();
    }
    this.active = chosen;
    chosen.play(song);
  }

  stop(): void {
    for (const engine of Object.values(this.engines)) engine.stop();
    this.active = null;
  }

  /** True while an engine holds a song, playing or paused. */
  get hasActive(): boolean {
    return this.active !== null;
  }

  /** Can the page pause this song? Spotify's embedded player cannot be controlled from outside. */
  canPause(song: Song): boolean {
    return typeof this.engines[PlaybackRouter.kindOf(song)].pause === "function";
  }

  pause(): void {
    this.active?.pause?.();
  }

  resume(): void {
    this.active?.resume?.();
  }

  static kindOf(song: Song): MediaKind {
    return song.origin === "youtube" || song.origin === "spotify" ? song.origin : "audio";
  }
}
