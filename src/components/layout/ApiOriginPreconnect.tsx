import { getApiBaseUrl } from "@/lib/api/config";

/**
 * Ligação antecipada à origem da API (imagens em /uploads e futuros assets).
 * Executa no servidor no layout raiz.
 */
export function ApiOriginPreconnect() {
  let origin: string;
  try {
    origin = new URL(getApiBaseUrl()).origin;
  } catch {
    return null;
  }
  return (
    <>
      <link rel="preconnect" href={origin} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={origin} />
    </>
  );
}
