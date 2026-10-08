import { Playlist } from "../model/Playlist";
import { Song } from "../model/Song";

type Where = "start" | "end" | "position";

/** Connects the page (DOM) with the Playlist. It holds no list logic of its own. */
export class PlayerView {
  private readonly audio = this.find<HTMLAudioElement>("audio");
  private readonly list = this.find<HTMLOListElement>("list");
  private draggedId: string | null = null;

  constructor(private readonly playlist: Playlist) {
    this.bindControls();
    this.bindAddForms();
    this.render();
  }

  private find<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (element === null) throw new Error(`Missing element #${id}`);
    return element as T;
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
    this.audio.addEventListener("ended", () => this.playSong(this.playlist.next()));
    this.audio.addEventListener("error", () => {
      if (this.audio.getAttribute("src")) this.showMessage("This song could not be played.");
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
        this.addSong(new Song(crypto.randomUUID(), title, URL.createObjectURL(file), "file"));
      }
      input.value = "";
    });

    this.find<HTMLFormElement>("url-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const url = this.find<HTMLInputElement>("url");
      const title = this.find<HTMLInputElement>("title");
      if (!/^https?:\/\//i.test(url.value)) {
        this.showMessage("The address must start with http:// or https://");
        return;
      }
      const name = title.value.trim() || decodeURIComponent(url.value.split("/").pop() ?? url.value);
      this.addSong(new Song(crypto.randomUUID(), name, url.value, "url"));
      url.value = "";
      title.value = "";
    });
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
    this.audio.src = song.source;
    void this.audio.play().catch(() => this.showMessage("The browser blocked or could not play this song."));
    this.render();
  }

  private stopAudio(): void {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
  }

  private showMessage(text: string): void {
    this.find("message").textContent = text;
  }

  private render(): void {
    const songs = this.playlist.list();
    const current = this.playlist.currentSong;
    this.find("count").textContent = songs.length > 0 ? `(${songs.length})` : "";
    this.find("empty").hidden = songs.length > 0;
    this.find("now-playing").textContent = current === null ? "Nothing playing" : `Now playing: ${current.title}`;
    this.list.replaceChildren(...songs.map((song, index) => this.createItem(song, index, song === current)));
  }

  private createItem(song: Song, index: number, isCurrent: boolean): HTMLLIElement {
    const item = document.createElement("li");
    item.className = "item" + (isCurrent ? " current" : "");
    item.draggable = true;
    item.tabIndex = 0;
    item.dataset.id = song.id;

    const number = document.createElement("span");
    number.className = "number";
    number.textContent = String(index + 1);

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = song.title;

    const origin = document.createElement("span");
    origin.className = "origin";
    origin.textContent = song.origin === "file" ? "this computer" : "web";

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

    item.append(number, title, origin, remove);
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
