import { getApiBaseUrl } from "@/lib/api/config";

/**
 * A API devolve `avatar_url` como path relativo (`/uploads/avatars/...`).
 * No browser (Next em outro domínio) é preciso prefixar com a base da API.
 */
export function resolveUserAvatarUrl(
  raw: string | null | undefined,
): string | undefined {
  const u = raw?.trim();
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${base}${path}`;
}
