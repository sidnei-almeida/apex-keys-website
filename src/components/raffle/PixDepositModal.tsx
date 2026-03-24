"use client";

import type { PixIntentResponse } from "@/types/api";
import { Check, Copy, ExternalLink, Loader2, X } from "lucide-react";
import { useCallback, useState } from "react";

type PixDepositModalProps = {
  open: boolean;
  /** Só fecha o painel; o aguardo do Pix continua em segundo plano. */
  onClose: () => void;
  /** Cancela o aguardo e interrompe a compra automática. */
  onCancelAwait: () => void;
  intent: PixIntentResponse | null;
  polling: boolean;
  amountLabel: string;
};

export default function PixDepositModal({
  open,
  onClose,
  onCancelAwait,
  intent,
  polling,
  amountLabel,
}: PixDepositModalProps) {
  const [copied, setCopied] = useState(false);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  if (!open) return null;

  const mp = intent?.mercado_pago;
  const mock = intent?.mock_pix;
  const qrSrc =
    mp?.qr_code_base64 != null && mp.qr_code_base64.length > 0
      ? mp.qr_code_base64.startsWith("data:")
        ? mp.qr_code_base64
        : `data:image/png;base64,${mp.qr_code_base64}`
      : null;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar"
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pix-modal-title"
        className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-apex-primary/25 bg-apex-surface p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="pix-modal-title" className="text-lg font-bold text-apex-text">
            Pagar com Pix
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-apex-text"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-apex-text/75">
          Valor: <span className="font-semibold text-apex-accent">{amountLabel}</span>
          {intent?.provider === "mercadopago" ? (
            <span className="block mt-1 text-xs text-apex-text/55">
              Ambiente de teste Mercado Pago — use a conta comprador de teste para
              concluir o pagamento.
            </span>
          ) : null}
        </p>

        {polling && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-apex-accent/30 bg-apex-accent/10 px-3 py-2 text-sm text-apex-accent">
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            Aguardando confirmação do Pix no saldo…
          </div>
        )}

        {mp?.ticket_url ? (
          <a
            href={mp.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-apex-accent py-3 text-sm font-bold text-apex-bg hover:opacity-90"
          >
            Abrir pagamento Pix
            <ExternalLink className="size-4" aria-hidden />
          </a>
        ) : null}

        {qrSrc ? (
          <div className="mt-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="QR Code Pix"
              className="max-h-48 w-48 rounded-lg border border-white/10 bg-white p-2"
            />
          </div>
        ) : null}

        {mp?.qr_code ? (
          <div className="mt-4">
            <p className="text-xs font-medium text-apex-text/60">Pix copia e cola</p>
            <div className="mt-1 flex gap-2">
              <code className="max-h-24 flex-1 overflow-auto rounded-lg bg-apex-bg px-2 py-2 text-[11px] text-apex-text/90 break-all">
                {mp.qr_code}
              </code>
              <button
                type="button"
                onClick={() => void copyText(mp.qr_code!)}
                className="shrink-0 rounded-lg border border-apex-primary/30 px-3 py-2 text-apex-accent hover:bg-apex-primary/20"
                title="Copiar"
              >
                {copied ? (
                  <Check className="size-5" aria-hidden />
                ) : (
                  <Copy className="size-5" aria-hidden />
                )}
              </button>
            </div>
          </div>
        ) : null}

        {mock?.emv_payload ? (
          <div className="mt-4">
            <p className="text-xs font-medium text-apex-text/60">
              Simulação (mock) — payload para testes locais
            </p>
            <div className="mt-1 flex gap-2">
              <code className="max-h-20 flex-1 overflow-auto rounded-lg bg-apex-bg px-2 py-2 text-[10px] text-apex-text/80 break-all">
                {mock.emv_payload}
              </code>
              <button
                type="button"
                onClick={() => void copyText(mock.emv_payload)}
                className="shrink-0 rounded-lg border border-apex-primary/30 px-3 py-2 text-apex-accent"
              >
                <Copy className="size-5" aria-hidden />
              </button>
            </div>
            {mock.note ? (
              <p className="mt-2 text-xs text-apex-text/50">{mock.note}</p>
            ) : null}
          </div>
        ) : null}

        <p className="mt-4 text-xs text-apex-text/55">
          Quando o Pix for aprovado, o saldo atualiza e a compra das cotas segue
          automaticamente. Pode minimizar este aviso (fechar): o aguardo continua em
          segundo plano.
        </p>

        {polling ? (
          <button
            type="button"
            onClick={onCancelAwait}
            className="mt-4 w-full rounded-lg border border-red-500/40 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            Parar de aguardar e cancelar compra
          </button>
        ) : null}
      </div>
    </>
  );
}
