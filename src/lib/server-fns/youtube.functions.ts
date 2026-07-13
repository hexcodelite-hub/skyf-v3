import { createServerFn } from "@tanstack/react-start";
import { siteConfig } from "@/config/site";

let cache: { at: number; data: Video[] } | null = null;

export type Video = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
};

export const getLatestVideos = createServerFn({ method: "GET" }).handler(async () => {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.data;
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const url = `https://www.googleapis.com/youtube/v3/search?key=${key}&channelId=${siteConfig.channels.youtubeChannelId}&order=date&part=snippet&type=video&maxResults=6`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("YouTube API error", res.status, await res.text().catch(() => ""));
    return [];
  }
  const json: any = await res.json();
  const videos: Video[] = (json.items ?? []).map((it: any) => ({
    id: it.id.videoId,
    title: it.snippet.title,
    thumbnail: it.snippet.thumbnails?.maxres?.url ?? it.snippet.thumbnails?.high?.url ?? it.snippet.thumbnails?.medium?.url,
    publishedAt: it.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
  }));
  cache = { at: Date.now(), data: videos };
  return videos;
});
