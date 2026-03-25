"use client";

import { useEffect, useMemo } from "react";

const MARK = "data-apex-home-preload";

type Props = {
  /** URLs absolutas de imagens a antecipar (hero + opcional carrossel). */
  urls: string[];
};

/**
 * Injeta `<link rel="preload" as="image">` no documento para LCP / troca de slides do hero.
 * Remove os nós ao desmontar ou quando a lista muda.
 */
export function HomeImagePreloads({ urls }: Props) {
  const key = useMemo(() => urls.join("\u0001"), [urls]);

  useEffect(() => {
    if (urls.length === 0) return;

    const links: HTMLLinkElement[] = [];
    for (const href of urls) {
      if (!href) continue;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.crossOrigin = "anonymous";
      link.setAttribute(MARK, "1");
      document.head.appendChild(link);
      links.push(link);
    }

    return () => {
      for (const link of links) {
        link.remove();
      }
    };
  }, [key, urls]);

  return null;
}
