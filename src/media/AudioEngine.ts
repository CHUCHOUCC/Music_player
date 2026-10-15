import type { Song } from "../model/Song";
import type { PlaybackEngine, PlaybackEvents } from "./PlaybackEngine";

/** Plays audio files and direct audio links with the browser's <audio> element. */
export class AudioEngine implements PlaybackEngine {
  constructor(
    private readonly audio: HTMLAudioElement,
    events: PlaybackEvents,
  ) {
    audio.addEventListener("ended", () => events.ended());
    audio.addEventListener("play", () => events.playingChanged(true));
    audio.addEventListener("pause", () => events.playingChanged(false));
    audio.addEventListener("error", () => {
      if (audio.getAttribute("src")) events.failed("This song could not be played.");
    });
    this.events = events;
  }

  private readonly events: PlaybackEvents;

  play(song: Song): void {
    this.audio.hidden = false;
    this.audio.src = song.source;
    this.audio.play().catch(() => this.events.failed("The browser blocked or could not play this song."));
  }

  pause(): void {
    this.audio.pause();
  }

  resume(): void {
    this.audio.play().catch(() => this.events.failed("The browser blocked or could not play this song."));
  }

  stop(): void {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.audio.hidden = true;
  }
}
