import type { Song } from "../model/Song";
import { MediaLink } from "./MediaLink";
import type { PlaybackEngine, PlaybackEvents } from "./PlaybackEngine";

/**
 * Shows Spotify's official embedded player. Spotify does not tell the page when a
 * song ends or is paused, so the vinyl does not spin and the list does not advance
 * by itself for these songs. Without a Spotify login the embed plays 30-second previews.
 */
export class SpotifyEngine implements PlaybackEngine {
  constructor(
    private readonly box: HTMLElement,
    private readonly events: PlaybackEvents,
  ) {}

  play(song: Song): void {
    const path = MediaLink.parse(song.source)?.id ?? null;
    if (path === null) {
      this.events.failed("That Spotify link must point to a track or an episode.");
      return;
    }
    const frame = document.createElement("iframe");
    frame.src = `https://open.spotify.com/embed/${path}`;
    frame.width = "100%";
    frame.height = "152";
    frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    frame.title = song.title;
    this.box.replaceChildren(frame);
    this.box.hidden = false;
    this.events.playingChanged(false);
  }

  stop(): void {
    this.box.replaceChildren();
    this.box.hidden = true;
  }
}
