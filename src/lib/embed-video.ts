/**
 * Converts a video URL into a player source for embedding.
 * Supports YouTube, Vimeo, Cloudinary player embeds, and direct
 * MP4/WebM/Ogg files.
 * Returns null for unrecognized URLs.
 */

export function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
}

export function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

/**
 * Recognizes Cloudinary player embed URLs of the form
 * https://player.cloudinary.com/embed/?cloud_name=...&public_id=...
 * Returns the URL itself (with any extra params appended) so the player
 * iframe can be embedded directly.
 */
export function getCloudinaryEmbedSrc(url: string, extraParams?: string): string | null {
  if (!url) return null;
  if (!url.startsWith("https://player.cloudinary.com/embed/")) return null;
  const base = url.split("?")[0] ?? url;
  const existing = url.includes("?") ? (url.split("?")[1] ?? "") : "";
  const params = [existing, extraParams].filter(Boolean).join("&");
  return `${base}?${params}`;
}

export function getEmbedSrc(url: string): string | null {
  if (!url) return null;

  // Direct video files
  if (isDirectVideo(url)) {
    return url;
  }

  // YouTube (youtube.com/watch?v=, /embed/, /shorts/, or youtu.be/)
  const yt = getYouTubeId(url);
  if (yt) {
    return `https://www.youtube.com/embed/${yt}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&color=white`;
  }

  // Vimeo
  const vimeo = getVimeoId(url);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo}?autoplay=1`;
  }

  // Cloudinary player embed
  const cloudinary = getCloudinaryEmbedSrc(url);
  if (cloudinary) {
    return cloudinary;
  }

  return null;
}

/**
 * Autoplay-friendly embed source: muted + loop + playsInline so browsers
 * permit automatic scroll-triggered playback without requiring a click.
 * Direct video files are returned unchanged (playback is driven by the
 * <video> element's muted/loop/playsInline/autoPlay attributes).
 */
export function getAutoplayEmbedSrc(url: string): string | null {
  if (!url) return null;

  if (isDirectVideo(url)) {
    return url;
  }

  const yt = getYouTubeId(url);
  if (yt) {
    // Full native controls enabled; captions stay opted out by default
    // (cc_load_policy=0). loop+playlist are kept so ambient autoplay still
    // loops seamlessly, playsinline for mobile.
    return `https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3&cc_load_policy=0&cc_lang_pref=off&hl=en&loop=1&playlist=${yt}&playsinline=1`;
  }

  const vimeo = getVimeoId(url);
  if (vimeo) {
    // Chrome-free embed: no controls, title, byline, or portrait.
    return `https://player.vimeo.com/video/${vimeo}?autoplay=1&muted=1&loop=1&controls=0&title=0&byline=0&portrait=0`;
  }

  // Cloudinary player embed — chrome-free autoplay params, fills its container.
  const cloudinary = getCloudinaryEmbedSrc(
    url,
    "autoplay=true&muted=true&loop=true&controls=false&playsinline=true&fluid=true",
  );
  if (cloudinary) {
    return cloudinary;
  }

  return null;
}

export function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url);
}
