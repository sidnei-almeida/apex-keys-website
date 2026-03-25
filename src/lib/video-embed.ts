/**
 * Trailer em rifas: grava-se só o ID do vídeo no Dailymotion (campo `video_id` na API).
 * @see https://www.dailymotion.com/partner/embed
 */

const DM_VIDEO_PATH_RE =
  /dailymotion\.com\/(?:embed\/)?video\/([a-zA-Z0-9]+)/i;
const DM_SHORT_RE = /dai\.ly\/([a-zA-Z0-9]+)/i;

/** Extrai o ID a partir de URL ou devolve o próprio valor se já for um ID (ex.: x8abcd). */
export function extractDailymotionVideoId(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  let m = t.match(DM_VIDEO_PATH_RE);
  if (m?.[1]) return m[1];
  m = t.match(DM_SHORT_RE);
  if (m?.[1]) return m[1];
  if (/^x[a-zA-Z0-9]{5,32}$/.test(t)) return t;
  return null;
}

/** Valor a enviar em `video_id` na API — ID do Dailymotion ou null. */
export function videoIdForApi(stored: string): string | null {
  return extractDailymotionVideoId(stored);
}

export function dailymotionEmbedSrc(videoId: string): string {
  return `https://www.dailymotion.com/embed/video/${encodeURIComponent(videoId)}`;
}

export function dailymotionWatchUrl(videoId: string): string {
  return `https://www.dailymotion.com/video/${encodeURIComponent(videoId)}`;
}
