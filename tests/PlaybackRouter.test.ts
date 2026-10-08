import { describe, expect, it } from "vitest";
import type { PlaybackEngine } from "../src/media/PlaybackEngine";
import { PlaybackRouter } from "../src/media/PlaybackRouter";
import { Song } from "../src/model/Song";

class FakeEngine implements PlaybackEngine {
  played: string[] = [];
  stops = 0;
  play(song: Song): void {
    this.played.push(song.title);
  }
  stop(): void {
    this.stops++;
  }
}

function setup() {
  const engines = { audio: new FakeEngine(), youtube: new FakeEngine(), spotify: new FakeEngine() };
  return { engines, router: new PlaybackRouter(engines) };
}

describe("PlaybackRouter", () => {
  it("sends each song to the engine of its kind", () => {
    const { engines, router } = setup();
    router.play(new Song("1", "file", "blob:1", "file"));
    router.play(new Song("2", "web", "https://x/a.mp3", "url"));
    router.play(new Song("3", "yt", "https://youtu.be/dQw4w9WgXcQ", "youtube"));
    router.play(new Song("4", "sp", "https://open.spotify.com/track/abc", "spotify"));
    expect(engines.audio.played).toEqual(["file", "web"]);
    expect(engines.youtube.played).toEqual(["yt"]);
    expect(engines.spotify.played).toEqual(["sp"]);
  });

  it("stops the other engines but not the chosen one", () => {
    const { engines, router } = setup();
    router.play(new Song("1", "a", "blob:1", "file"));
    router.play(new Song("2", "b", "blob:2", "file"));
    expect(engines.audio.stops).toBe(0);
    router.play(new Song("3", "c", "https://youtu.be/dQw4w9WgXcQ", "youtube"));
    expect(engines.audio.stops).toBe(1);
    expect(engines.youtube.stops).toBe(2); // stopped while the two audio songs played
  });

  it("stop() stops every engine", () => {
    const { engines, router } = setup();
    router.stop();
    expect([engines.audio.stops, engines.youtube.stops, engines.spotify.stops]).toEqual([1, 1, 1]);
  });
});
