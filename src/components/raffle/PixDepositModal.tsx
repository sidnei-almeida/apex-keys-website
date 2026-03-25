"use client";

import type { PixIntentResponse } from "@/types/api";
import { Check, Copy, ExternalLink, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

function PixReservationPayCountdown({
  expiresAtIso,
  premium,
}: {
  expiresAtIso: string;
  premium?: boolean;
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const end = Date.parse(expiresAtIso);
  if (Number.isNaN(end)) return null;
  if (nowMs === null) {
    return (
      <p
        className={
          premium
            ? "mt-3 rounded-lg border border-premium-border bg-premium-bg px-3 py-2 text-sm text-premium-muted"
            : "mt-3 rounded-lg border border-apex-accent/20 bg-apex-accent/5 px-3 py-2 text-sm text-apex-text/70"
        }
      >
        A carregar tempo…
      </p>
    );
  }
  const secLeft = Math.max(0, Math.floor((end - nowMs) / 1000));
  if (secLeft <= 0) {
    return (
      <p className="mt-3 rounded-lg border border-amber-900/45 bg-amber-950/30 px-3 py-2 text-sm text-amber-200/90">
        O tempo da reserva acabou — os números podem ser libertados em breve. Se já pagou,
        aguarde a confirmação do Mercado Pago.
      </p>
    );
  }
  const m = Math.floor(secLeft / 60);
  const s = secLeft % 60;
  const mmss = `${m}:${s.toString().padStart(2, "0")}`;
  return (
    <p
      className={
        premium
          ? "mt-3 rounded-lg border border-premium-border bg-premium-bg px-3 py-2 text-sm text-premium-text"
          : "mt-3 rounded-lg border border-apex-accent/30 bg-apex-accent/10 px-3 py-2 text-sm text-apex-text"
      }
    >
      Você tem{" "}
      <span
        className={
          premium
            ? "font-bold tabular-nums text-premium-accent"
            : "font-bold tabular-nums text-apex-accent"
        }
      >
        {mmss}
      </span>{" "}
      para pagar antes da reserva expirar (libertação automática após 15 min).
    </p>
  );
}

type PixDepositModalProps = {
  open: boolean;
  /** Só fecha o painel; o aguardo do Pix continua em segundo plano. */
  onClose: () => void;
  /** Cancela o aguardo e interrompe a compra automática. */
  onCancelAwait: () => void | Promise<void>;
  intent: PixIntentResponse | null;
  polling: boolean;
  amountLabel: string;
  /** true = pagamento direto da rifa (confirma bilhetes, não recarrega carteira). */
  raffleCheckout?: boolean;
  /** Título do diálogo (ex.: depósito na carteira). */
  modalTitle?: string;
  /** Texto do botão quando está em polling. */
  cancelAwaitLabel?: string;
  /** Mensagem junto ao spinner durante o polling. */
  pollingMessage?: string;
  /** Texto de rodapé para depósito na carteira (evita copy da rifa). */
  walletDeposit?: boolean;
};

export default function PixDepositModal({
  open,
  onClose,
  onCancelAwait,
  intent,
  polling,
  amountLabel,
  raffleCheckout = false,
  modalTitle = "Pagar com Pix",
  cancelAwaitLabel,
  pollingMessage,
  walletDeposit = false,
}: PixDepositModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedCancelLabel =
    cancelAwaitLabel ??
    (raffleCheckout
      ? "Parar de aguardar e cancelar compra"
      : "Parar de aguardar");
  const resolvedPollingMessage =
    pollingMessage ??
    (raffleCheckout
      ? "Aguardando confirmação do Pix para garantir os números…"
      : "Aguardando o Mercado Pago confirmar o depósito na carteira…");

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const premium = true;

  if (!open || !mounted) return null;

  const mp = intent?.mercado_pago;
  const mock = intent?.mock_pix;
  const qrSrc =
    mp?.qr_code_base64 != null && mp.qr_code_base64.length > 0
      ? mp.qr_code_base64.startsWith("data:")
        ? mp.qr_code_base64
        : `data:image/png;base64,${mp.qr_code_base64}`
      : null;

  const node = (
    <>
      <button
        type="button"
        aria-label="Fechar"
        className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pix-modal-title"
        className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div
          className={
            premium
              ? "pointer-events-auto max-h-[min(90dvh,40rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-premium-border bg-premium-surface p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-6"
              : "pointer-events-auto max-h-[min(90dvh,40rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-apex-primary/30 bg-apex-bg p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-6"
          }
        >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="pix-modal-title"
            className={
              premium
                ? "text-lg font-bold text-premium-text"
                : "text-lg font-bold text-apex-text"
            }
          >
            {modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={
              premium
                ? "rounded-lg p-1 text-premium-muted transition-colors hover:text-premium-text"
                : "rounded-lg p-1 text-gray-400 hover:text-apex-text"
            }
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>
        <p
          className={
            premium ? "mt-2 text-sm text-premium-muted" : "mt-2 text-sm text-apex-text/75"
          }
        >
          Valor:{" "}
          <span
            className={
              premium
                ? "font-semibold text-premium-accent"
                : "font-semibold text-apex-accent"
            }
          >
            {amountLabel}
          </span>
          {intent?.provider === "mercadopago" ? (
            <span
              className={
                premium
                  ? "mt-1 block text-xs text-premium-muted/80"
                  : "mt-1 block text-xs text-apex-text/55"
              }
            >
              Ambiente de teste Mercado Pago — use a conta comprador de teste para
              concluir o pagamento.
            </span>
          ) : null}
        </p>

        {raffleCheckout && intent?.expires_at ? (
          <PixReservationPayCountdown
            expiresAtIso={intent.expires_at}
            premium={premium}
          />
        ) : null}

        {polling && (
          <div
            className={
              premium
                ? "mt-4 flex items-center gap-2 rounded-lg border border-premium-border bg-premium-bg px-3 py-2 text-sm text-premium-muted"
                : "mt-4 flex items-center gap-2 rounded-lg border border-apex-accent/30 bg-apex-accent/10 px-3 py-2 text-sm text-apex-accent"
            }
          >
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            {resolvedPollingMessage}
          </div>
        )}

        {mp?.ticket_url ? (
          <a
            href={mp.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className={
              premium
                ? "mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-premium-accent py-3 text-sm font-bold text-[#0A0A0A] hover:opacity-90"
                : "mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-apex-accent py-3 text-sm font-bold text-apex-bg hover:opacity-90"
            }
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
            <p
              className={
                premium
                  ? "text-xs font-medium text-premium-muted"
                  : "text-xs font-medium text-apex-text/60"
              }
            >
              Pix copia e cola
            </p>
            <div className="mt-1 flex gap-2">
              <code
                className={
                  premium
                    ? "max-h-24 flex-1 overflow-auto rounded-lg border border-premium-border bg-premium-bg px-2 py-2 text-[11px] text-premium-text break-all"
                    : "max-h-24 flex-1 overflow-auto rounded-lg bg-apex-bg px-2 py-2 text-[11px] text-apex-text/90 break-all"
                }
              >
                {mp.qr_code}
              </code>
              <button
                type="button"
                onClick={() => void copyText(mp.qr_code!)}
                className={
                  premium
                    ? "shrink-0 rounded-lg border border-premium-border px-3 py-2 text-premium-text hover:bg-premium-bg"
                    : "shrink-0 rounded-lg border border-apex-primary/30 px-3 py-2 text-apex-accent hover:bg-apex-primary/20"
                }
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
            <p
              className={
                premium
                  ? "text-xs font-medium text-premium-muted"
                  : "text-xs font-medium text-apex-text/60"
              }
            >
              Simulação (mock) — payload para testes locais
            </p>
            <div className="mt-1 flex gap-2">
              <code
                className={
                  premium
                    ? "max-h-20 flex-1 overflow-auto rounded-lg border border-premium-border bg-premium-bg px-2 py-2 text-[10px] text-premium-muted break-all"
                    : "max-h-20 flex-1 overflow-auto rounded-lg bg-apex-bg px-2 py-2 text-[10px] text-apex-text/80 break-all"
                }
              >
                {mock.emv_payload}
              </code>
              <button
                type="button"
                onClick={() => void copyText(mock.emv_payload)}
                className={
                  premium
                    ? "shrink-0 rounded-lg border border-premium-border px-3 py-2 text-premium-text"
                    : "shrink-0 rounded-lg border border-apex-primary/30 px-3 py-2 text-apex-accent"
                }
              >
                <Copy className="size-5" aria-hidden />
              </button>
            </div>
            {mock.note ? (
              <p
                className={
                  premium ? "mt-2 text-xs text-premium-muted/80" : "mt-2 text-xs text-apex-text/50"
                }
              >
                {mock.note}
              </p>
            ) : null}
          </div>
        ) : null}

        <p
          className={
            premium ? "mt-4 text-xs text-premium-muted" : "mt-4 text-xs text-apex-text/55"
          }
        >
          {raffleCheckout ? (
            <>
              Quando o Pix for aprovado, os números passam a <strong>vendidos</strong>{" "}
              para si. Reservas não pagas libertam-se ao cancelar abaixo ou após{" "}
              <strong>15 minutos</strong>. Pode fechar este aviso: o aguardo continua em
              segundo plano.
            </>
          ) : walletDeposit ? (
            <>
              Quando o Mercado Pago aprovar o Pix, o saldo da carteira atualiza
              automaticamente. Pode fechar este painel: o aguardo continua em segundo
              plano.
            </>
          ) : (
            <>
              Quando o Pix for aprovado, o saldo atualiza e a compra das cotas segue
              automaticamente. Pode minimizar este aviso (fechar): o aguardo continua em
              segundo plano.
            </>
          )}
        </p>

        {polling ? (
          <button
            type="button"
            onClick={() => void onCancelAwait()}
            className="mt-4 w-full rounded-lg border border-red-500/40 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            {resolvedCancelLabel}
          </button>
        ) : null}
        </div>
      </div>
    </>
  );

  return createPortal(node, document.body);
}
