import { getApiBaseUrl } from "@/lib/api/config";

/** URL absoluta da capa da rifa (API relativa ou CDN absoluta). */
export function raffleImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = getApiBaseUrl();
  return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
}
