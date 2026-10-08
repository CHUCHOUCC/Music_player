import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import { Playlist } from "../src/model/Playlist";
import { Song } from "../src/model/Song";
import { BrowserPlaylistStorage } from "../src/storage/BrowserPlaylistStorage";
import { PlaylistLibrary } from "../src/storage/PlaylistLibrary";

function sample(): Playlist {
  const playlist = new Playlist();
  const file = new Blob(["audio-bytes"], { type: "audio/wav" });
  playlist.addLast(new Song("1", "Local song", "blob:old", "file", file));
  playlist.addLast(new Song("2", "Web song", "https://example.com/a.mp3", "url"));
  playlist.addFirst(new Song("3", "First", "https://example.com/b.mp3", "url"));
  playlist.addLast(new Song("4", "Clip", "https://youtu.be/dQw4w9WgXcQ", "youtube"));
  return playlist;
}

const library = () => new PlaylistLibrary(new BrowserPlaylistStorage(), () => "blob:new");

describe("PlaylistLibrary with browser storage", () => {
  beforeEach(() => {
    // A new empty database for every test.
    globalThis.indexedDB = new IDBFactory();
  });

  it("saves a playlist and loads it back in the same order", async () => {
    const lib = library();
    await lib.save("Road trip", sample());
    const loaded = new Playlist();
    expect(await lib.loadInto("Road trip", loaded)).toBe(true);
    expect(loaded.list().map((song) => song.title)).toEqual(["First", "Local song", "Web song", "Clip"]);
  });

  it("keeps the audio file of local songs and the address of web songs", async () => {
    const lib = library();
    await lib.save("Mixed", sample());
    const loaded = new Playlist();
    await lib.loadInto("Mixed", loaded);
    const [first, local, web, clip] = loaded.list();
    expect(first.source).toBe("https://example.com/b.mp3");
    expect(local.origin).toBe("file");
    expect(local.source).toBe("blob:new");
    expect(local.file?.size).toBe("audio-bytes".length);
    expect(web.source).toBe("https://example.com/a.mp3");
    expect(clip.origin).toBe("youtube");
    expect(clip.source).toBe("https://youtu.be/dQw4w9WgXcQ");
  });

  it("lists, overwrites and deletes playlists", async () => {
    const lib = library();
    await lib.save("One", sample());
    await lib.save("Two", sample());
    await lib.save("One", sample());
    expect((await lib.list()).map((item) => item.name).sort()).toEqual(["One", "Two"]);
    await lib.delete("One");
    expect((await lib.list()).map((item) => item.name)).toEqual(["Two"]);
    expect(await lib.loadInto("One", new Playlist())).toBe(false);
  });

  it("rejects empty names and empty playlists", async () => {
    const lib = library();
    await expect(lib.save("  ", sample())).rejects.toThrow();
    await expect(lib.save("Empty", new Playlist())).rejects.toThrow();
  });
});
