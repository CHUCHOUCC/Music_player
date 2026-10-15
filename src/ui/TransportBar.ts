import { formatTime } from "./formatTime";

/** What the bar shows about the current song. */
export interface TrackInfo {
  title: string;
  origin: string;
  color: string;
}

/**
 * The bar at the bottom: current song, play/pause button, progress and volume.
 * It only draws things and reads the <audio> element; the buttons that change the
 * playlist (previous, next, repeat) stay in PlayerView, which owns the Playlist.
 */
export class TransportBar {
  private readonly toggleButton: HTMLButtonElement;
  private readonly progress: HTMLInputElement;
  private readonly volume: HTMLInputElement;
  private readonly timeNow: HTMLElement;
  private readonly timeTotal: HTMLElement;

  constructor(
    private readonly root: HTMLElement,
    private readonly audio: HTMLAudioElement,
  ) {
    // Looked up here, not in field initializers: those would run before `root` is assigned.
    this.toggleButton = this.part<HTMLButtonElement>("toggle");
    this.progress = this.part<HTMLInputElement>("progress");
    this.volume = this.part<HTMLInputElement>("volume");
    this.timeNow = this.part("time-now");
    this.timeTotal = this.part("time-total");
    audio.addEventListener("timeupdate", () => this.drawTime());
    audio.addEventListener("loadedmetadata", () => this.drawTime());
    audio.addEventListener("durationchange", () => this.drawTime());
    audio.addEventListener("emptied", () => this.drawTime());
    this.progress.addEventListener("input", () => {
      if (Number.isFinite(audio.duration)) audio.currentTime = (Number(this.progress.value) / 1000) * audio.duration;
    });
    this.volume.addEventListener("input", () => {
      audio.volume = Number(this.volume.value) / 100;
      this.volume.style.setProperty("--fill", `${this.volume.value}%`);
    });
    this.volume.style.setProperty("--fill", `${this.volume.value}%`);
  }

  private part<T extends HTMLElement>(id: string): T {
    const element = this.root.querySelector<T>(`#${id}`);
    if (element === null) throw new Error(`Missing element #${id}`);
    return element;
  }

  /** Name, origin and disc colour of the current song (null = nothing selected). */
  show(track: TrackInfo | null): void {
    this.part("bar-title").textContent = track === null ? "Nothing playing" : track.title;
    this.part("bar-origin").textContent = track === null ? "" : track.origin;
    this.part("bar-disc").style.setProperty("--label", track === null ? "#ff6a3d" : track.color);
  }

  setPlaying(playing: boolean): void {
    this.toggleButton.classList.toggle("is-playing", playing);
    this.toggleButton.setAttribute("aria-label", playing ? "Pause" : "Play");
  }

  /** False when the page cannot pause this song (Spotify's embedded player). */
  setPausable(pausable: boolean): void {
    this.toggleButton.disabled = !pausable;
    this.toggleButton.title = pausable ? "" : "Use the Spotify player to pause";
  }

  /** Progress and volume only work for songs the <audio> element plays. */
  setUsesAudioElement(uses: boolean): void {
    this.progress.disabled = !uses;
    this.volume.disabled = !uses;
    this.drawTime();
  }

  private drawTime(): void {
    const usable = !this.progress.disabled && Number.isFinite(this.audio.duration) && this.audio.duration > 0;
    this.progress.value = usable ? String(Math.round((this.audio.currentTime / this.audio.duration) * 1000)) : "0";
    this.progress.style.setProperty("--fill", `${Number(this.progress.value) / 10}%`);
    this.timeNow.textContent = usable ? formatTime(this.audio.currentTime) : "0:00";
    this.timeTotal.textContent = usable ? formatTime(this.audio.duration) : "--:--";
  }
}
