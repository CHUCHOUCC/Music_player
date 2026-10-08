import { describe, expect, it } from "vitest";
import { Playlist } from "../src/model/Playlist";
import { Song } from "../src/model/Song";

const song = (id: string) => new Song(id, `Song ${id}`, `blob:${id}`, "file");
const ids = (playlist: Playlist) => playlist.list().map((s) => s.id);

function playlistOf(...names: string[]): Playlist {
  const playlist = new Playlist();
  for (const name of names) playlist.addLast(song(name));
  return playlist;
}

describe("Playlist", () => {
  it("adds at the start, end and any position", () => {
    const playlist = playlistOf("B", "D");
    playlist.addFirst(song("A"));
    playlist.addLast(song("E"));
    playlist.addAt(2, song("C"));
    expect(ids(playlist)).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("goes forward and backward", () => {
    const playlist = playlistOf("A", "B", "C");
    expect(playlist.playFirst()?.id).toBe("A");
    expect(playlist.next()?.id).toBe("B");
    expect(playlist.next()?.id).toBe("C");
    expect(playlist.next()).toBeNull();
    expect(playlist.previous()?.id).toBe("B");
  });

  it("repeats the list when repeat is on", () => {
    const playlist = playlistOf("A", "B");
    playlist.repeat = true;
    playlist.play("B");
    expect(playlist.next()?.id).toBe("A");
    expect(playlist.previous()?.id).toBe("B");
  });

  it("BUG CASE: dragging the playing 2nd song to the start plays the 2nd position next, not the 3rd", () => {
    const playlist = playlistOf("A", "B", "C");
    playlist.play("B"); // B is playing, it is in the 2nd position
    playlist.move("B", 0); // user drags it to the start: B, A, C
    expect(ids(playlist)).toEqual(["B", "A", "C"]);
    expect(playlist.currentSong?.id).toBe("B"); // still playing B
    expect(playlist.currentIndex).toBe(0);
    expect(playlist.next()?.id).toBe("A"); // 2nd position, NOT "C"
  });

  it("keeps the playing song when another song is dragged around it", () => {
    const playlist = playlistOf("A", "B", "C", "D");
    playlist.play("B");
    playlist.move("D", 0); // D, A, B, C
    expect(playlist.currentSong?.id).toBe("B");
    expect(playlist.next()?.id).toBe("C");
    expect(playlist.previous()?.id).toBe("B");
    expect(playlist.previous()?.id).toBe("A");
  });

  it("removing the playing song moves to the next one", () => {
    const playlist = playlistOf("A", "B", "C");
    playlist.play("B");
    playlist.remove("B");
    expect(playlist.currentSong?.id).toBe("C");
    playlist.remove("C");
    expect(playlist.currentSong?.id).toBe("A");
    playlist.remove("A");
    expect(playlist.currentSong).toBeNull();
    expect(playlist.size).toBe(0);
  });

  it("removing another song does not change the playing song", () => {
    const playlist = playlistOf("A", "B", "C");
    playlist.play("C");
    playlist.remove("A");
    expect(playlist.currentSong?.id).toBe("C");
    expect(playlist.currentIndex).toBe(1);
  });
});
