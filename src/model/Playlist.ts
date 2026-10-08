import { DoublyLinkedList } from "../structures/DoublyLinkedList";
import type { DoublyNode } from "../structures/DoublyNode";
import { Song } from "./Song";

/**
 * The playlist: songs in a doubly linked list plus a reference to the song
 * that is playing. The reference is a NODE, never a number. If it were an
 * index, dragging a song to another position would silently change which
 * song is "current" and next() would jump to the wrong one.
 */
export class Playlist {
  private readonly songs = new DoublyLinkedList<Song>();
  private current: DoublyNode<Song> | null = null;
  public repeat = false;

  get size(): number {
    return this.songs.size;
  }

  get currentSong(): Song | null {
    return this.current === null ? null : this.current.value;
  }

  get currentIndex(): number {
    return this.current === null ? -1 : this.songs.indexOf(this.current);
  }

  list(): Song[] {
    return this.songs.toArray();
  }

  addFirst(song: Song): void {
    this.songs.insertFirst(song);
  }

  addLast(song: Song): void {
    this.songs.insertLast(song);
  }

  /** `index` is 0-based: 0 = start, size = end. */
  addAt(index: number, song: Song): void {
    this.songs.insertAt(index, song);
  }

  /** Removes a song. If it was playing, the playlist moves to the next one (or the previous). */
  remove(songId: string): void {
    const node = this.songs.find((song) => song.id === songId);
    if (node === null) return;
    if (node === this.current) this.current = node.next ?? node.previous;
    this.songs.remove(node);
  }

  /** Drag and drop: the song ends up at `toIndex`. The playing song does not change. */
  move(songId: string, toIndex: number): void {
    const node = this.songs.find((song) => song.id === songId);
    if (node === null) return;
    this.songs.move(node, toIndex);
  }

  play(songId: string): Song | null {
    const node = this.songs.find((song) => song.id === songId);
    if (node === null) return null;
    this.current = node;
    return node.value;
  }

  /** Starts from the first song when nothing is playing yet. */
  playFirst(): Song | null {
    this.current = this.songs.first;
    return this.currentSong;
  }

  next(): Song | null {
    if (this.current === null) return this.playFirst();
    if (this.current.next !== null) this.current = this.current.next;
    else if (this.repeat) this.current = this.songs.first;
    else return null;
    return this.currentSong;
  }

  previous(): Song | null {
    if (this.current === null) return this.playFirst();
    if (this.current.previous !== null) this.current = this.current.previous;
    else if (this.repeat) this.current = this.songs.last;
    else return null;
    return this.currentSong;
  }

  clear(): void {
    this.songs.clear();
    this.current = null;
  }
}
