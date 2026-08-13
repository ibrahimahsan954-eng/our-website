/**
 * Converts a video URL into a player source for embedding.
 * Supports YouTube, Vimeo, and direct MP4/WebM/Ogg files.
 * Returns null for unrecognized URLs.
 */
export function getEmbedSrc(url: string): string | null {
  if (!url) return null;

  // Direct video files
  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)) {
    return url;
  }

  // YouTube (youtube.com/watch?v=, /embed/, /shorts/, or youtu.be/)
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) {
    return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0&playsinline=1&color=white`;
  }

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  }

  return null;
}

export function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url);
}
