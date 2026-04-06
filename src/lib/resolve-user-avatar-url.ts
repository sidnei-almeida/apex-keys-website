import { getApiBaseUrl } from "@/lib/api/config";

/**
 * A API devolve `avatar_url` como path relativo (`/uploads/avatars/...`).
 * No browser (Next em outro domínio) é preciso prefixar com a base da API.
 */
export function resolveUserAvatarUrl(
  raw: string | null | undefined,
  /** Força novo pedido HTTP quando a URL do arquivo é a mesma (ex.: overwrite no servidor). */
  cacheBust?: number,
): string | undefined {
  const u = raw?.trim();
  if (!u) return undefined;
  let url: string;
  if (/^https?:\/\//i.test(u)) {
    url = u;
  } else {
    const base = getApiBaseUrl().replace(/\/+$/, "");
    const path = u.startsWith("/") ? u : `/${u}`;
    url = `${base}${path}`;
  }
  if (cacheBust != null && cacheBust > 0) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}v=${cacheBust}`;
  }
  return url;
}
