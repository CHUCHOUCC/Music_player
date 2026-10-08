import { describe, expect, it } from "vitest";
import { MediaLink } from "../src/media/MediaLink";

describe("MediaLink", () => {
  it("recognises the usual YouTube links", () => {
    const id = "dQw4w9WgXcQ";
    const links = [
      `https://www.youtube.com/watch?v=${id}`,
      `https://youtube.com/watch?v=${id}&list=abc&t=10`,
      `https://m.youtube.com/watch?v=${id}`,
      `https://music.youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}?si=xyz`,
      `https://www.youtube.com/shorts/${id}`,
      `https://www.youtube.com/embed/${id}`,
    ];
    for (const link of links) {
      const parsed = MediaLink.parse(link);
      expect(parsed?.kind, link).toBe("youtube");
      expect(parsed?.id, link).toBe(id);
    }
  });

  it("marks a YouTube link without a video as invalid (id null)", () => {
    expect(MediaLink.parse("https://www.youtube.com/")?.id).toBeNull();
    expect(MediaLink.parse("https://www.youtube.com/watch?v=short")?.id).toBeNull();
  });

  it("recognises Spotify tracks and episodes", () => {
    expect(MediaLink.parse("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc")?.id).toBe(
      "track/4uLU6hMCjMI75M1A2tKUQC",
    );
    expect(MediaLink.parse("https://open.spotify.com/intl-es/track/4uLU6hMCjMI75M1A2tKUQC")?.id).toBe(
      "track/4uLU6hMCjMI75M1A2tKUQC",
    );
    expect(MediaLink.parse("https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ")?.kind).toBe("spotify");
    expect(MediaLink.parse("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")?.id).toBeNull();
  });

  it("treats any other http(s) link as audio and rejects non-links", () => {
    expect(MediaLink.parse("https://example.com/song.mp3")?.kind).toBe("audio");
    expect(MediaLink.parse("not a link")).toBeNull();
    expect(MediaLink.parse("javascript:alert(1)")).toBeNull();
    expect(MediaLink.parse("ftp://example.com/a.mp3")).toBeNull();
  });
});
