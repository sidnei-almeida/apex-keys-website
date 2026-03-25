"use client";

import { resolveUserAvatarUrl } from "@/lib/resolve-user-avatar-url";
import { User } from "lucide-react";
import { useEffect, useState } from "react";

type UserAvatarProps = {
  avatarUrl: string | null | undefined;
  /** Incrementar após novo upload para contornar cache do browser na mesma URL. */
  urlCacheBust?: number;
  /** classes no wrapper externo (ex.: size-11 rounded-lg) */
  className?: string;
  imgClassName?: string;
  /** fundo do estado sem foto / erro */
  fallbackClassName?: string;
  placeholderIconClassName?: string;
  alt?: string;
};

/**
 * Avatar com URL resolvida; se a imagem falhar (404, rede, CORS), mostra ícone.
 */
export default function UserAvatar({
  avatarUrl,
  urlCacheBust = 0,
  className = "size-11",
  imgClassName = "size-full object-cover",
  fallbackClassName = "flex size-full items-center justify-center bg-premium-surface",
  placeholderIconClassName = "size-5 text-premium-muted lg:size-6",
  alt = "",
}: UserAvatarProps) {
  const resolved = resolveUserAvatarUrl(avatarUrl, urlCacheBust);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved, urlCacheBust]);

  const showImg = resolved && !failed;

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden ${className}`}>
      {showImg ? (
        <img
          src={resolved}
          alt={alt}
          className={imgClassName}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={fallbackClassName}>
          <User className={placeholderIconClassName} aria-hidden />
        </div>
      )}
    </div>
  );
}
