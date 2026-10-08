export type MediaKind = "audio" | "youtube" | "spotify";

/** What a pasted link points to. `id` is the video id (YouTube) or "track/ID" (Spotify). */
export class MediaLink {
  private constructor(
    public readonly kind: MediaKind,
    public readonly id: string | null,
  ) {}

  /** Returns null when the text is not an http(s) link. */
  static parse(text: string): MediaLink | null {
    let url: URL;
    try {
      url = new URL(text.trim());
    } catch {
      return null;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") return MediaLink.youtube(url.pathname.split("/")[1]);
    if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "watch") return MediaLink.youtube(url.searchParams.get("v"));
      if (["shorts", "embed", "live", "v"].includes(parts[0])) return MediaLink.youtube(parts[1]);
      return MediaLink.youtube(null);
    }
    if (host === "open.spotify.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0]?.startsWith("intl-")) parts.shift();
      const valid = ["track", "episode"].includes(parts[0]) && /^[A-Za-z0-9]{10,30}$/.test(parts[1] ?? "");
      return new MediaLink("spotify", valid ? `${parts[0]}/${parts[1]}` : null);
    }
    return new MediaLink("audio", null);
  }

  private static youtube(id: string | null | undefined): MediaLink {
    return new MediaLink("youtube", id !== null && id !== undefined && /^[\w-]{11}$/.test(id) ? id : null);
  }
}
