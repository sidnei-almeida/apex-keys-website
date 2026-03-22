/**
 * Base URL da API Apex Keys (sem barra final).
 * Produção: Railway. Local: definir NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
 * @see FRONTEND_API.md
 */
export function getApiBaseUrl(): string {
  const raw =
    typeof process.env.NEXT_PUBLIC_API_URL === "string"
      ? process.env.NEXT_PUBLIC_API_URL.trim()
      : "";
  const fallback = "https://apex-keys-api-production.up.railway.app";
  const base = raw || fallback;
  return base.replace(/\/+$/, "");
}

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${p}`;
}
