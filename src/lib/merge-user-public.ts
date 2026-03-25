import type { UserPublic } from "@/types/api";

/**
 * Garante que um refresh de `/auth/me` não apague `avatar_url` quando a API
 * devolve null mas o estado/cache ainda tinha foto (evita flicker / foto a sumir).
 */
export function mergeUserPublic(
  me: UserPublic,
  prev: UserPublic | null,
  disk: UserPublic | null,
): UserPublic {
  const apiAvatar = me.avatar_url?.trim();
  if (apiAvatar) return me;

  const sameId = (u: UserPublic | null) => u != null && u.id === me.id;
  const fallback =
    (sameId(prev) && prev!.avatar_url?.trim()) ||
    (sameId(disk) && disk!.avatar_url?.trim()) ||
    null;

  if (fallback) return { ...me, avatar_url: fallback };
  return me;
}
