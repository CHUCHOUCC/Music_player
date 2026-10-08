import type { MediaKind } from "./MediaLink";

/** Asks YouTube/Spotify for the real title of a link. Returns null if it cannot (never throws). */
export async function resolveTitle(kind: MediaKind, url: string, timeoutMs = 3000): Promise<string | null> {
  const endpoint =
    kind === "youtube"
      ? "https://www.youtube.com/oembed?format=json&url="
      : kind === "spotify"
        ? "https://open.spotify.com/oembed?url="
        : null;
  if (endpoint === null) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint + encodeURIComponent(url), { signal: controller.signal });
    if (!response.ok) return null;
    const data = (await response.json()) as { title?: unknown };
    return typeof data.title === "string" && data.title.trim() !== "" ? data.title.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
