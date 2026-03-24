/**
 * Logs do browser para fluxos críticos (carteira / Mercado Pago).
 * Prefixo fixo para filtrar no DevTools: [ApexKeys]
 */

const PREFIX = "[ApexKeys]";

export type ClientLogLevel = "info" | "warn" | "error";

function emit(
  level: ClientLogLevel,
  scope: string,
  message: string,
  data?: Record<string, unknown>,
) {
  const payload = {
    scope,
    message,
    ts: new Date().toISOString(),
    ...data,
  };
  if (level === "error") {
    console.error(PREFIX, payload);
  } else if (level === "warn") {
    console.warn(PREFIX, payload);
  } else {
    console.info(PREFIX, payload);
  }
}

/** Depósito Pix / mock-pix-intent — sucesso (só em dev para não poluir produção). */
export function logWalletPixIntentOk(data: {
  provider: string;
  gatewayRefPrefix: string;
  paymentId?: string | null;
  amount?: string | number;
}) {
  emit("info", "wallet.pix-intent", "ok", data as unknown as Record<string, unknown>);
}

/** Falha na API ao criar intenção Pix. */
export function logWalletPixIntentError(data: {
  status: number;
  detail?: string;
  gatewayRefPrefix?: string;
  bodySnippet?: string;
}) {
  emit("error", "wallet.pix-intent", "failed", data as unknown as Record<string, unknown>);
}
