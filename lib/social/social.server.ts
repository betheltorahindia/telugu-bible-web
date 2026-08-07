import {
  SPOTIFY_SHOW_IDS,
  YOUTUBE,
  type SpotifyShow,
  type YouTubeVideo,
} from "./social-data";

type CacheEntry<T> = { at: number; data: T };
const TTL = 1000 * 60 * 30;
const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const data = await fn();
  cache.set(key, { at: Date.now(), data });
  return data;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function collectLockups(node: unknown, out: Record<string, unknown>[]): void {
  if (Array.isArray(node)) {
    for (const item of node) collectLockups(item, out);
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (obj["lockupViewModel"]) out.push(obj["lockupViewModel"] as Record<string, unknown>);
    for (const value of Object.values(obj)) collectLockups(value, out);
  }
}

function pick(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

export async function scrapeYouTubeVideos(limit: number): Promise<YouTubeVideo[]> {
  return cached(`yt:${limit}`, async () => {
    const res = await fetch(YOUTUBE.videosUrl, {
      headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
    });
    const html = await res.text();
    const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
    if (!match?.[1]) return [];

    let data: unknown;
    try {
      data = JSON.parse(match[1]);
    } catch {
      return [];
    }

    const lockups: Record<string, unknown>[] = [];
    collectLockups(data, lockups);

    const seen = new Set<string>();
    const videos: YouTubeVideo[] = [];
    for (const lockup of lockups) {
      const id = lockup["contentId"];
      if (typeof id !== "string" || id.length !== 11 || seen.has(id)) continue;
      const title = pick(lockup, [
        "metadata",
        "lockupMetadataViewModel",
        "title",
        "content",
      ]);
      if (typeof title !== "string") continue;
      seen.add(id);

      const badge = pick(lockup, [
        "contentImage",
        "thumbnailViewModel",
        "overlays",
        "0",
        "thumbnailBottomOverlayViewModel",
        "badges",
        "0",
        "thumbnailBadgeViewModel",
        "text",
      ]);
      const rows = pick(lockup, [
        "metadata",
        "lockupMetadataViewModel",
        "metadata",
        "contentMetadataViewModel",
        "metadataRows",
      ]) as unknown[] | undefined;
      let published: string | null = null;
      if (Array.isArray(rows)) {
        for (const row of rows) {
          const parts = pick(row, ["metadataParts"]) as unknown[] | undefined;
          if (!Array.isArray(parts)) continue;
          for (const part of parts) {
            const text = pick(part, ["text", "content"]);
            if (typeof text === "string" && /ago|Streamed|Premiere/i.test(text)) {
              published = text;
            }
          }
        }
      }

      videos.push({
        id,
        title,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: typeof badge === "string" ? badge : null,
        published,
        url: `https://www.youtube.com/watch?v=${id}`,
      });
      if (videos.length >= limit) break;
    }
    return videos;
  });
}

export async function fetchSpotifyShows(): Promise<SpotifyShow[]> {
  return cached("spotify:shows", async () => {
    const results = await Promise.all(
      SPOTIFY_SHOW_IDS.map(async (id): Promise<SpotifyShow> => {
        const url = `https://open.spotify.com/show/${id}`;
        const fallback: SpotifyShow = {
          id,
          title: "BethEl Torah India Podcast",
          thumbnail: null,
          url,
          embedUrl: `https://open.spotify.com/embed/show/${id}`,
        };
        try {
          const res = await fetch(
            `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
            { headers: { "user-agent": UA } },
          );
          if (!res.ok) return fallback;
          const json = (await res.json()) as {
            title?: string;
            thumbnail_url?: string;
          };
          return {
            id,
            title: json.title ?? fallback.title,
            thumbnail: json.thumbnail_url ?? null,
            url,
            embedUrl: fallback.embedUrl,
          };
        } catch {
          return fallback;
        }
      }),
    );
    return results;
  });
}