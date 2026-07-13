import { siteConfig } from "@/config/site";

type Props = {
  /** Override the configured featured video/playlist. */
  videoId?: string;
  playlistId?: string;
  title?: string;
  className?: string;
};

/**
 * Native YouTube embed. Source is driven by `src/config/site.ts` so content
 * can be swapped without touching this component.
 */
export function YouTubePlayer({ videoId, playlistId, title = "YouTube player", className }: Props) {
  const featured = siteConfig.youtube.featured;
  let src: string | null = null;

  if (playlistId) {
    src = `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`;
  } else if (videoId) {
    src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
  } else if (featured.id) {
    src =
      featured.kind === "playlist"
        ? `https://www.youtube-nocookie.com/embed/videoseries?list=${featured.id}`
        : `https://www.youtube-nocookie.com/embed/${featured.id}?rel=0`;
  }

  if (!src) return null;

  return (
    <div className={`relative aspect-video overflow-hidden rounded-xl border border-border bg-black shadow-card ${className ?? ""}`}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
