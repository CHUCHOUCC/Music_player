import { Playlist } from "../model/Playlist";
import { Song } from "../model/Song";
import { AudioEngine } from "../media/AudioEngine";
import { MediaLink } from "../media/MediaLink";
import { PlaybackRouter } from "../media/PlaybackRouter";
import { SpotifyEngine } from "../media/SpotifyEngine";
import { resolveTitle } from "../media/TitleResolver";
import { YouTubeEngine } from "../media/YouTubeEngine";
import type { PlaylistLibrary } from "../storage/PlaylistLibrary";

type Where = "start" | "end" | "position";

/** Connects the page (DOM) with the Playlist. It holds no list logic of its own. */
export class PlayerView {
  private readonly router = this.createRouter();
  private readonly list = this.find<HTMLOListElement>("list");
  private draggedId: string | null = null;
  private playing = false;

  constructor(
    private readonly playlist: Playlist,
    private readonly library: PlaylistLibrary,
  ) {
    this.bindControls();
    this.bindAddForms();
    this.bindSaveForm();
    this.render();
    void this.refreshSaved();
  }

  private find<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (element === null) throw new Error(`Missing element #${id}`);
    return element as T;
  }

  private createRouter(): PlaybackRouter {
    const events = {
      ended: () => this.playSong(this.playlist.next()),
      // The vinyl spins only while the sound is really playing.
      playingChanged: (playing: boolean) => this.setPlaying(playing),
      failed: (message: string) => this.showMessage(message),
    };
    return new PlaybackRouter({
      audio: new AudioEngine(this.find<HTMLAudioElement>("audio"), events),
      youtube: new YouTubeEngine(this.find("youtube-box"), events),
      spotify: new SpotifyEngine(this.find("spotify-box"), events),
    });
  }

  private bindControls(): void {
    this.find("next").addEventListener("click", () => this.playSong(this.playlist.next()));
    this.find("previous").addEventListener("click", () => this.playSong(this.playlist.previous()));
    this.find<HTMLInputElement>("repeat").addEventListener("change", (event) => {
      this.playlist.repeat = (event.target as HTMLInputElement).checked;
    });
    this.find("clear").addEventListener("click", () => {
      this.playlist.clear();
      this.stopAudio();
      this.render();
    });
  }

  private bindAddForms(): void {
    const where = this.find<HTMLSelectElement>("where");
    const position = this.find<HTMLInputElement>("position");
    where.addEventListener("change", () => {
      position.disabled = where.value !== "position";
    });

    this.find<HTMLInputElement>("file").addEventListener("change", (event) => {
      const input = event.target as HTMLInputElement;
      for (const file of Array.from(input.files ?? [])) {
        const title = file.name.replace(/\.[^.]+$/, "");
        this.addSong(new Song(crypto.randomUUID(), title, URL.createObjectURL(file), "file", file));
      }
      input.value = "";
    });

    this.find<HTMLFormElement>("url-form").addEventListener("submit", (event) => {
      event.preventDefault();
      void this.addFromLink();
    });
  }

  private async addFromLink(): Promise<void> {
    const url = this.find<HTMLInputElement>("url");
    const title = this.find<HTMLInputElement>("title");
    const link = MediaLink.parse(url.value);
    if (link === null) {
      this.showMessage("The address must be a link starting with http:// or https://");
      return;
    }
    if (link.kind !== "audio" && link.id === null) {
      this.showMessage(
        link.kind === "youtube"
          ? "That YouTube link has no video."
          : "That Spotify link must point to a track or an episode.",
      );
      return;
    }
    const address = url.value.trim();
    const name =
      title.value.trim() ||
      (await resolveTitle(link.kind, address)) ||
      (link.kind === "audio"
        ? decodeURIComponent(address.split("/").pop() ?? address)
        : link.kind === "youtube"
          ? `YouTube video ${link.id}`
          : "Spotify song");
    this.addSong(new Song(crypto.randomUUID(), name, address, link.kind === "audio" ? "url" : link.kind));
    url.value = "";
    title.value = "";
  }

  private addSong(song: Song): void {
    const where = this.find<HTMLSelectElement>("where").value as Where;
    try {
      if (where === "start") this.playlist.addFirst(song);
      else if (where === "end") this.playlist.addLast(song);
      else {
        // The page shows positions starting at 1; the list uses 0-based indexes.
        const position = Number(this.find<HTMLInputElement>("position").value);
        this.playlist.addAt(position - 1, song);
      }
      this.showMessage("");
    } catch {
      this.showMessage(`Position must be between 1 and ${this.playlist.size + 1}.`);
      return;
    }
    this.render();
  }

  private playSong(song: Song | null): void {
    if (song === null) {
      this.stopAudio();
      this.render();
      return;
    }
    this.showMessage("");
    this.router.play(song);
    this.render();
  }

  private stopAudio(): void {
    this.router.stop();
  }

  private showMessage(text: string, ok = false): void {
    const message = this.find("message");
    message.textContent = text;
    message.classList.toggle("ok", ok);
  }

  private setPlaying(value: boolean): void {
    this.playing = value;
    this.render();
  }

  private bindSaveForm(): void {
    this.find<HTMLFormElement>("save-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = this.find<HTMLInputElement>("playlist-name");
      this.library
        .save(input.value, this.playlist)
        .then(() => {
          this.showMessage(`Playlist "${input.value.trim()}" saved.`, true);
          input.value = "";
          return this.refreshSaved();
        })
        .catch((error: unknown) => this.showMessage(this.describe(error, "The playlist could not be saved.")));
    });
  }

  private async refreshSaved(): Promise<void> {
    const container = this.find<HTMLUListElement>("saved-list");
    try {
      const saved = await this.library.list();
      this.find("saved-empty").hidden = saved.length > 0;
      container.replaceChildren(
        ...saved.map((item) => {
          const row = document.createElement("li");
          row.className = "saved-item";

          const name = document.createElement("span");
          name.className = "name";
          name.textContent = item.name;

          const meta = document.createElement("span");
          meta.className = "meta";
          meta.textContent = `${item.songs.length} songs`;

          const load = document.createElement("button");
          load.type = "button";
          load.textContent = "Load";
          load.addEventListener("click", () => void this.loadSaved(item.name));

          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "delete";
          remove.textContent = "Delete";
          remove.addEventListener("click", () => {
            this.library.delete(item.name).then(() => this.refreshSaved(), () => this.showMessage("Could not delete it."));
          });

          row.append(name, meta, load, remove);
          return row;
        }),
      );
    } catch {
      this.find("saved-empty").textContent = "Saving is not available in this browser.";
      this.find("saved-empty").hidden = false;
    }
  }

  private async loadSaved(name: string): Promise<void> {
    try {
      this.stopAudio();
      const loaded = await this.library.loadInto(name, this.playlist);
      this.showMessage(loaded ? `Playlist "${name}" loaded.` : "That playlist no longer exists.", loaded);
    } catch {
      this.showMessage("The playlist could not be loaded.");
    }
    this.render();
  }

  private describe(error: unknown, fallback: string): string {
    return error instanceof Error && error.message !== "" ? error.message : fallback;
  }

  /** Same title always gets the same colour, so every song has its own disc label. */
  private colorFor(title: string): string {
    let hash = 0;
    for (const letter of title) hash = (hash * 31 + letter.charCodeAt(0)) % 360;
    return `hsl(${hash} 65% 50%)`;
  }

  private updateVinyl(current: Song | null): void {
    const vinyl = this.find("vinyl");
    vinyl.classList.toggle("spinning", this.playing && current !== null);
    vinyl.style.setProperty("--label", current === null ? "#6c8cff" : this.colorFor(current.title));
    this.find("vinyl-initial").textContent = current === null ? "\u266B" : current.title.charAt(0).toUpperCase();
  }

  private render(): void {
    const songs = this.playlist.list();
    const current = this.playlist.currentSong;
    this.find("count").textContent = songs.length > 0 ? `(${songs.length})` : "";
    this.find("empty").hidden = songs.length > 0;
    this.find("now-playing").textContent = current === null ? "Nothing playing" : `Now playing: ${current.title}`;
    this.updateVinyl(current);
    this.list.replaceChildren(...songs.map((song, index) => this.createItem(song, index, song === current)));
  }

  private createItem(song: Song, index: number, isCurrent: boolean): HTMLLIElement {
    const item = document.createElement("li");
    item.className = "item" + (isCurrent ? " current" : "") + (isCurrent && this.playing ? " playing" : "");
    item.draggable = true;
    item.tabIndex = 0;
    item.dataset.id = song.id;

    const disc = document.createElement("span");
    disc.className = "mini-disc";
    disc.style.setProperty("--label", this.colorFor(song.title));

    const number = document.createElement("span");
    number.className = "number";
    number.textContent = String(index + 1);

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = song.title;

    const origin = document.createElement("span");
    origin.className = "origin";
    origin.textContent = { file: "this computer", url: "web", youtube: "YouTube", spotify: "Spotify" }[song.origin];

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${song.title}`);
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      const wasCurrent = this.playlist.currentSong === song;
      this.playlist.remove(song.id);
      if (wasCurrent) this.playSong(this.playlist.currentSong);
      else this.render();
    });

    item.append(number, disc, title, origin, remove);
    item.addEventListener("click", () => this.playSong(this.playlist.play(song.id)));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.playSong(this.playlist.play(song.id));
    });
    this.bindDrag(item, song);
    return item;
  }

  private bindDrag(item: HTMLLIElement, song: Song): void {
    item.addEventListener("dragstart", (event) => {
      this.draggedId = song.id;
      event.dataTransfer?.setData("text/plain", song.id);
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => {
      this.draggedId = null;
      this.clearDropMarks();
      item.classList.remove("dragging");
    });
    item.addEventListener("dragover", (event) => {
      if (this.draggedId === null) return;
      event.preventDefault();
      this.clearDropMarks();
      item.classList.add(this.isUpperHalf(event, item) ? "drop-before" : "drop-after");
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      if (this.draggedId === null || this.draggedId === song.id) return;
      const songs = this.playlist.list();
      const from = songs.findIndex((candidate) => candidate.id === this.draggedId);
      const target = songs.indexOf(song);
      // Index the dragged song must have once it leaves its old place.
      let destination = this.isUpperHalf(event, item) ? target : target + 1;
      if (from < destination) destination--;
      this.playlist.move(this.draggedId, destination);
      this.draggedId = null;
      this.render();
    });
  }

  private isUpperHalf(event: DragEvent, item: HTMLElement): boolean {
    const box = item.getBoundingClientRect();
    return event.clientY < box.top + box.height / 2;
  }

  private clearDropMarks(): void {
    for (const item of this.list.querySelectorAll(".drop-before, .drop-after")) {
      item.classList.remove("drop-before", "drop-after");
    }
  }
}
