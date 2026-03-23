/**
 * Cliente HTTP para IGDB.
 * Base: NEXT_PUBLIC_APEX_API_URL se definida; senão a mesma que o resto da app (getApiBaseUrl → NEXT_PUBLIC_API_URL ou Railway).
 * @see FRONTEND_API.md — POST /igdb/game
 */
import { getApiBaseUrl } from "@/lib/api/config";

function resolveIgdbApiOrigin(): {
  origin: string;
  source: "NEXT_PUBLIC_APEX_API_URL" | "NEXT_PUBLIC_API_URL";
} {
  const apex =
    typeof process.env.NEXT_PUBLIC_APEX_API_URL === "string"
      ? process.env.NEXT_PUBLIC_APEX_API_URL.trim()
      : "";
  if (apex) {
    return {
      origin: apex.replace(/\/+$/, ""),
      source: "NEXT_PUBLIC_APEX_API_URL",
    };
  }
  return { origin: getApiBaseUrl(), source: "NEXT_PUBLIC_API_URL" };
}

/** Logs verbosos: dev automático ou NEXT_PUBLIC_DEBUG_IGDB=1 */
function igdbDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEBUG_IGDB === "1"
  );
}

function igdbLog(phase: string, data?: Record<string, unknown>) {
  if (!igdbDebugEnabled()) return;
  const line = { phase, t: new Date().toISOString(), ...data };
  console.log("[Apex IGDB]", JSON.stringify(line, null, 0));
}

export interface IgdbGameInfoResponse {
  slug: string;
  name: string | null;
  title: string | null;
  summary: string | null;
  image_url: string | null;
  youtube_url: string | null;
  igdb_url: string;
  igdb_game_id: string | null;
  genres: string[];
  series: string[];
  game_modes: string[];
  player_perspectives: string[];
}

function errorMessageFromPayload(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e: unknown) => {
        if (e && typeof e === "object" && "msg" in e) {
          const m = (e as { msg: unknown }).msg;
          if (typeof m === "string") return m;
        }
        return JSON.stringify(e);
      })
      .join("; ");
  }
  return fallback;
}

/**
 * Mensagem amigável quando o browser mascara falha de rede como "CORS".
 * Status (null) no Firefox = nenhuma resposta HTTP recebida.
 */
function explainFetchFailure(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const msg = err.message;
  const name = err.name;
  if (
    name === "TypeError" &&
    (msg.includes("fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("Failed to fetch") ||
      msg.includes("Network request failed"))
  ) {
    return [
      msg,
      "— Sem resposta do servidor (conexão recusada, API offline, URL errada,",
      "VPN/firewall ou tunel/proxy). No Firefox isto aparece como «CORS request did not succeed»",
      "mesmo quando não é cabeçalho CORS: verifique se a API está a correr em",
      "NEXT_PUBLIC_API_URL / NEXT_PUBLIC_APEX_API_URL (ou arranque o FastAPI local na porta usada).",
    ].join(" ");
  }
  return msg;
}

export async function fetchIgdbGame(
  igdbPageUrl: string,
): Promise<IgdbGameInfoResponse> {
  const { origin, source } = resolveIgdbApiOrigin();
  const endpoint = `${origin}/igdb/game`;
  const trimmed = igdbPageUrl.trim();

  igdbLog("request:start", {
    endpoint,
    apiBaseResolved: origin,
    baseSource: source,
    envApexApiUrl:
      typeof process.env.NEXT_PUBLIC_APEX_API_URL === "string"
        ? process.env.NEXT_PUBLIC_APEX_API_URL || "(vazio)"
        : "(não definido — usa NEXT_PUBLIC_API_URL / fallback Railway)",
    envNextPublicApiUrl:
      typeof process.env.NEXT_PUBLIC_API_URL === "string"
        ? process.env.NEXT_PUBLIC_API_URL || "(vazio)"
        : "(não definido — fallback Railway em getApiBaseUrl)",
    igdbUrlLength: trimmed.length,
    igdbUrlPreview: trimmed.slice(0, 80) + (trimmed.length > 80 ? "…" : ""),
    windowOrigin:
      typeof window !== "undefined" ? window.location.origin : "(SSR)",
  });

  const t0 = typeof performance !== "undefined" ? performance.now() : 0;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: trimmed }),
      cache: "no-store",
    });
  } catch (err) {
    const ms =
      typeof performance !== "undefined" ? performance.now() - t0 : 0;
    igdbLog("request:network_error", {
      ms: Math.round(ms),
      errorName: err instanceof Error ? err.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      hint:
        "Nenhuma resposta HTTP — não é possível ler status nem corpo. Confirme curl -v POST " +
        endpoint,
    });
    throw new Error(explainFetchFailure(err));
  }

  const ms = typeof performance !== "undefined" ? performance.now() - t0 : 0;

  const acao = res.headers.get("access-control-allow-origin");
  const acam = res.headers.get("access-control-allow-methods");

  igdbLog("request:http_response", {
    ms: Math.round(ms),
    status: res.status,
    ok: res.ok,
    type: res.type,
    redirected: res.redirected,
    finalUrl: res.url,
    corsHeaders: {
      "access-control-allow-origin": acao ?? "(não visível ou ausente)",
      "access-control-allow-methods": acam ?? "(não visível ou ausente)",
    },
    note:
      "Se allow-origin for (não visível) em cross-origin, o browser pode ocultar o valor; um 200 OK ainda indica que o fetch completou.",
  });

  const text = await res.text();
  let payload: unknown = {};
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { _raw: text.slice(0, 500) };
      igdbLog("parse:json_failed", {
        status: res.status,
        bodyPreview: text.slice(0, 200),
      });
    }
  }

  if (!res.ok) {
    const msg = errorMessageFromPayload(payload, res.statusText);
    igdbLog("request:error_body", {
      status: res.status,
      message: msg,
    });
    throw new Error(msg);
  }

  igdbLog("request:success", {
    hasTitle: !!(payload as { title?: string }).title,
    hasName: !!(payload as { name?: string }).name,
    hasImage: !!(payload as { image_url?: string }).image_url,
  });

  return payload as IgdbGameInfoResponse;
}
