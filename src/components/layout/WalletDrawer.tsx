"use client";

import PixDepositModal from "@/components/raffle/PixDepositModal";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/http";
import {
  getWalletTransactions,
  postAbandonWalletPixDeposit,
  postMockPixIntent,
} from "@/lib/api/services";
import UserAvatar from "@/components/user/UserAvatar";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { PixIntentResponse, TransactionOut } from "@/types/api";
import { Hourglass, Loader2, X, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const TOAST_MS = 3000;

const PRESET_AMOUNTS = [10, 20, 50] as const;
const POLL_MS = 2500;
const POLL_MAX = 120;

/** Fundo contínuo do painel (sem cartões cinzentos) */
const PANEL_BG = "bg-black";

function formatBRL(value: number | string) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseBrazilianAmount(raw: string): number | null {
  let s = raw.trim().replace(/\s/g, "").replace(/R\$/gi, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n < 1) return null;
  if (n > 100_000) return null;
  return Math.round(n * 100) / 100;
}

function txTypeLabel(t: TransactionOut): string {
  switch (t.type) {
    case "pix_deposit":
      return " — Depósito Pix";
    case "purchase":
    case "raffle_payment":
      return " — Compra / rifa";
    case "refund":
      return " — Estorno";
    case "admin_adjustment":
      return " — Ajuste";
    default:
      return ` — ${t.type}`;
  }
}

function statusSuffix(t: TransactionOut): string {
  if (t.status === "completed") return "";
  if (t.status === "pending") return " (pendente)";
  if (t.status === "canceled") return " (cancelado)";
  if (t.status === "failed") return " (falhou)";
  return ` (${t.status})`;
}

function formatApexUserId(userId: string): string {
  const compact = userId.replace(/-/g, "").toUpperCase();
  const tail = compact.slice(-6).padStart(6, "0");
  return `#APX_${tail}`;
}

/** HUD metálico dourado/âmbar — centro alinhado ao fundo preto */
const RING_SIZE = 200;
const RING_R = 76;
const TICK_INNER = 64;
const TICK_OUTER = 74;

function WalletBalanceHud({ balanceLabel }: { balanceLabel: string }) {
  const gradId = `whud-${useId().replace(/:/g, "")}`;
  const ticks = useMemo(() => {
    const items: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      major: boolean;
    }[] = [];
    const cx = RING_SIZE / 2;
    const cy = RING_SIZE / 2;
    const n = 48;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const major = i % 4 === 0;
      const r1 = major ? TICK_INNER - 4 : TICK_INNER;
      const r2 = TICK_OUTER;
      items.push({
        x1: cx + Math.cos(angle) * r1,
        y1: cy + Math.sin(angle) * r1,
        x2: cx + Math.cos(angle) * r2,
        y2: cy + Math.sin(angle) * r2,
        major,
      });
    }
    return items;
  }, []);

  return (
    <div className="flex w-full justify-center lg:justify-start">
      <div
        className="relative"
        style={{
          filter:
            "drop-shadow(0 0 20px rgba(245, 158, 11, 0.28)) drop-shadow(0 0 36px rgba(212, 175, 55, 0.12))",
        }}
      >
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="block"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#d4af37" stopOpacity="1" />
              <stop offset="70%" stopColor="#b45309" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#78716c" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="2.5"
            opacity={0.92}
          />
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.major ? "#eab308" : "#a16207"}
              strokeWidth={t.major ? 2 : 1}
              opacity={t.major ? 0.7 : 0.38}
            />
          ))}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R - 12}
            fill="#000000"
            stroke="rgba(212,175,55,0.18)"
            strokeWidth="1"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Saldo disponível
          </p>
          <p
            className="mt-2 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 bg-clip-text font-mono text-xl font-bold tabular-nums text-transparent sm:text-2xl"
            style={{ filter: "drop-shadow(0 0 12px rgba(212, 175, 55, 0.35))" }}
          >
            {balanceLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Ficha metálica chanfrada (cantos cortados) */
function PresetChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-[2.75rem] flex-1 overflow-hidden py-2.5 text-center text-sm font-semibold tabular-nums transition-all sm:flex-initial sm:min-w-[5.5rem] ${
        active
          ? "text-amber-200"
          : "text-zinc-300 hover:text-amber-100/90"
      }`}
      style={{
        clipPath:
          "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
      }}
    >
      <span
        className={`absolute inset-0 bg-gradient-to-b ${
          active
            ? "from-zinc-600/90 via-zinc-900 to-black"
            : "from-zinc-700/80 via-zinc-900 to-zinc-950"
        }`}
        aria-hidden
      />
      <span
        className={`absolute inset-0 border border-white/[0.08] ${
          active ? "ring-1 ring-amber-500/40" : ""
        }`}
        style={{
          clipPath:
            "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
        }}
        aria-hidden
      />
      <span
        className="absolute left-2 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
        aria-hidden
      />
      <span className="relative z-[1] pl-4 pr-2">{children}</span>
    </button>
  );
}

function WalletHistoryRow({ t }: { t: TransactionOut }) {
  const amount = formatBRL(t.amount);
  const mid = txTypeLabel(t);
  const suf = statusSuffix(t);
  return (
    <li className="flex flex-wrap items-baseline gap-x-1 text-sm leading-relaxed">
      <span className="font-semibold tabular-nums text-amber-400">{amount}</span>
      <span className="text-zinc-500">{mid}</span>
      {suf ? <span className="text-zinc-500">{suf}</span> : null}
    </li>
  );
}

type WalletDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onRequestLogin?: () => void;
};

export default function WalletDrawer({
  isOpen,
  onClose,
  onRequestLogin,
}: WalletDrawerProps) {
  const { user, isAuthenticated, refreshUser, avatarUrlCacheBust } = useAuth();
  const [customAmount, setCustomAmount] = useState("");
  const [preset, setPreset] = useState<number | null>(null);
  const [txList, setTxList] = useState<TransactionOut[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const [pixOpen, setPixOpen] = useState(false);
  const [pixIntent, setPixIntent] = useState<PixIntentResponse | null>(null);
  const [pixPolling, setPixPolling] = useState(false);
  const [pixAmountLabel, setPixAmountLabel] = useState("");

  const gatewayRefRef = useRef<string | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);

  const loadTransactions = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setTxLoading(true);
    try {
      const rows = await getWalletTransactions(token);
      setTxList(rows.slice(0, 30));
    } catch {
      setTxList([]);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    void loadTransactions();
    void refreshUser();
  }, [isOpen, isAuthenticated, loadTransactions, refreshUser]);

  const stopPixPolling = useCallback(() => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
    setPixPolling(false);
    gatewayRefRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      pollAbortRef.current?.abort();
    };
  }, []);

  const resolveDepositAmount = (): number | null => {
    if (preset != null) return preset;
    return parseBrazilianAmount(customAmount);
  };

  const startWalletPixPolling = useCallback(
    async (gatewayRef: string, signal: AbortSignal) => {
      const token = getAccessToken();
      if (!token) return;
      for (let i = 0; i < POLL_MAX; i++) {
        if (signal.aborted) return;
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (signal.aborted) return;
        try {
          const txs = await getWalletTransactions(token);
          const hit = txs.find(
            (x) =>
              (x.gateway_reference ?? "").trim() === gatewayRef &&
              x.status === "completed",
          );
          if (hit) {
            await refreshUser();
            await loadTransactions();
            toast.success("Saldo creditado", {
              id: `wallet-deposit-${gatewayRef}`,
              duration: TOAST_MS,
              description: "O Mercado Pago confirmou o Pix na sua carteira.",
            });
            setPixOpen(false);
            setPixIntent(null);
            stopPixPolling();
            return;
          }
        } catch {
          /* continua */
        }
      }
      if (!signal.aborted) {
        toast.message("Ainda à espera do Pix", {
          id: "wallet-deposit-timeout",
          duration: TOAST_MS,
          description:
            "Se já pagou, o saldo pode demorar um pouco. Atualize a página ou consulte Minhas transações.",
        });
      }
      stopPixPolling();
    },
    [loadTransactions, refreshUser, stopPixPolling],
  );

  const handleGeneratePix = async () => {
    setDepositError(null);
    if (!isAuthenticated || !user) {
      onRequestLogin?.();
      toast.message("Inicie sessão", {
        id: "wallet-login-required",
        duration: TOAST_MS,
        description: "É preciso estar autenticado para depositar na carteira.",
      });
      return;
    }
    const amount = resolveDepositAmount();
    if (amount == null) {
      setDepositError(
        "Indique um valor válido (mín. R$ 1,00) ou escolha um montante rápido.",
      );
      return;
    }

    const token = getAccessToken();
    if (!token) {
      onRequestLogin?.();
      return;
    }

    const gatewayRef = `wd-${crypto.randomUUID()}`;
    gatewayRefRef.current = gatewayRef;
    setDepositLoading(true);
    try {
      const intent = await postMockPixIntent(token, {
        amount: amount.toFixed(2),
        gateway_reference: gatewayRef,
      });
      setPixAmountLabel(formatBRL(amount));
      setPixIntent(intent);
      setPixOpen(true);

      const ac = new AbortController();
      pollAbortRef.current = ac;
      setPixPolling(true);
      void startWalletPixPolling(gatewayRef, ac.signal);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? (e.detail ?? "Não foi possível criar o Pix.")
          : e instanceof Error
            ? e.message
            : "Não foi possível criar o Pix.";
      setDepositError(msg);
      toast.error("Erro ao gerar Pix", {
        id: "wallet-pix-erro",
        duration: TOAST_MS,
        description: msg,
      });
    } finally {
      setDepositLoading(false);
    }
  };

  const handlePixModalClose = () => {
    setPixOpen(false);
  };

  const handleCancelPixAwait = async () => {
    const ref = gatewayRefRef.current;
    stopPixPolling();
    setPixOpen(false);
    setPixIntent(null);

    const token = getAccessToken();
    if (ref && token) {
      try {
        await postAbandonWalletPixDeposit(token, { gateway_reference: ref });
        await loadTransactions();
        await refreshUser();
        toast.success("Depósito cancelado", {
          id: `wallet-abandon-${ref}`,
          duration: TOAST_MS,
          description:
            "Este Pix não está mais pendente. Se ainda pagar o QR, o saldo não será creditado automaticamente neste registro.",
        });
      } catch (e) {
        const d =
          e instanceof ApiError
            ? e.detail
            : e instanceof Error
              ? e.message
              : "";
        toast.error("Não foi possível atualizar o estado", {
          id: "wallet-abandon-erro",
          duration: TOAST_MS,
          description:
            d || "O aguardo foi interrompido no ecrã; verifica o histórico ou tenta de novo.",
        });
      }
      return;
    }

    toast.message("Aguardo interrompido", {
      id: "wallet-await-cancelled",
      duration: TOAST_MS,
      description:
        "Se já gerou o QR, pode pagar mesmo assim — o saldo atualiza quando o Mercado Pago confirmar.",
    });
  };

  const balanceLabel = formatBRL(user?.balance ?? "0");
  const displayName =
    user?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Jogador";
  const apexId = user ? formatApexUserId(user.id) : "#APX_------";

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar carteira"
        className="fixed inset-0 z-[102] bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-drawer-title"
        className={`fixed inset-y-0 right-0 z-[103] flex w-full max-w-2xl flex-col border-l border-white/[0.07] shadow-[-20px_0_60px_rgba(0,0,0,0.75)] ${PANEL_BG}`}
      >
        <div className={`flex h-full min-h-0 flex-col ${PANEL_BG}`}>
          <header className="relative shrink-0 px-4 py-4 sm:px-6">
            <h2
              id="wallet-drawer-title"
              className="text-center font-heading text-sm font-bold uppercase tracking-[0.22em] text-white sm:text-base"
            >
              Minha carteira
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition-colors hover:border-amber-500/40 hover:text-amber-400 sm:right-5"
              aria-label="Fechar"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-8 pt-2 sm:px-6">
            {!isAuthenticated ? (
              <div className="flex flex-col items-center py-10 text-center">
                <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
                  Inicie sessão para ver o saldo, depositar com Pix (Mercado Pago) e
                  consultar o histórico.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onRequestLogin?.();
                    onClose();
                  }}
                  className="mt-8 w-full max-w-xs rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 py-3.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(245,158,11,0.25)] transition hover:brightness-105"
                >
                  Entrar
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-6 lg:pb-2">
                  {/* Esquerda: perfil + HUD */}
                  <div className="flex min-w-0 flex-1 flex-col gap-8">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 rounded-full bg-gradient-to-br from-amber-100 via-amber-500 to-zinc-700 p-[2px] shadow-[0_0_20px_rgba(212,175,55,0.25)]">
                        <div className="size-14 overflow-hidden rounded-full bg-black sm:size-16">
                          <UserAvatar
                            avatarUrl={user?.avatar_url}
                            urlCacheBust={avatarUrlCacheBust}
                            className="size-full rounded-full"
                            fallbackClassName="flex size-full items-center justify-center bg-zinc-950"
                            placeholderIconClassName="size-7 text-zinc-600 sm:size-8"
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-base font-bold text-white sm:text-lg">
                          {displayName}
                        </p>
                        <p className="mt-0.5 font-mono text-xs tracking-wide text-zinc-500 sm:text-sm">
                          {apexId}
                        </p>
                      </div>
                    </div>

                    <WalletBalanceHud balanceLabel={balanceLabel} />
                  </div>

                  {/* Direita: depósito — ligeiramente sobreposta no desktop */}
                  <div className="flex min-w-0 flex-1 flex-col gap-4 lg:relative lg:z-10 lg:-mt-2 lg:pt-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                        Adicionar saldo
                      </h3>
                      <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
                        Pix via Mercado Pago (QR ou link). Em dev, sem token MP usa
                        simulação mock.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {PRESET_AMOUNTS.map((v) => (
                        <PresetChip
                          key={v}
                          active={preset === v}
                          onClick={() => {
                            setPreset(v);
                            setCustomAmount("");
                            setDepositError(null);
                          }}
                        >
                          {formatBRL(v)}
                        </PresetChip>
                      ))}
                    </div>

                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Outro valor (ex.: 15,00)"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setPreset(null);
                        setDepositError(null);
                      }}
                      className="w-full border-b border-zinc-800 bg-transparent py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none"
                    />

                    {depositError ? (
                      <p className="text-xs text-red-400/90">{depositError}</p>
                    ) : null}

                    <button
                      type="button"
                      disabled={depositLoading}
                      onClick={() => void handleGeneratePix()}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 py-3.5 text-sm font-bold text-black shadow-[0_4px_24px_rgba(245,158,11,0.3)] transition hover:brightness-105 disabled:opacity-50"
                    >
                      {depositLoading ? (
                        <Loader2 className="size-5 animate-spin" aria-hidden />
                      ) : (
                        <Zap className="size-5 shrink-0 text-black" aria-hidden />
                      )}
                      Gerar QR Code Pix
                    </button>
                  </div>
                </div>

                <section className="mt-10 border-t border-white/[0.06] pt-8">
                  <h3 className="text-center text-xs font-bold uppercase tracking-[0.28em] text-zinc-500">
                    Histórico recente
                  </h3>
                  {txLoading ? (
                    <div className="mt-8 flex justify-center py-10 text-zinc-600">
                      <Loader2 className="size-8 animate-spin" aria-hidden />
                    </div>
                  ) : txList.length === 0 ? (
                    <div className="mt-8 flex flex-col items-center gap-4 py-10 text-center">
                      <Hourglass
                        className="size-10 text-amber-600/50"
                        strokeWidth={1.25}
                        aria-hidden
                      />
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Sem movimentos ainda
                      </p>
                      <p className="max-w-xs text-sm text-zinc-600">
                        Quando depositares ou usares a carteira, o histórico aparece
                        aqui.
                      </p>
                    </div>
                  ) : (
                    <ul className="mt-6 max-h-[min(42vh,300px)] space-y-3 overflow-y-auto pr-1">
                      {txList.map((t) => (
                        <WalletHistoryRow key={t.id} t={t} />
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      <PixDepositModal
        open={pixOpen}
        onClose={handlePixModalClose}
        onCancelAwait={handleCancelPixAwait}
        intent={pixIntent}
        polling={pixPolling}
        amountLabel={pixAmountLabel}
        raffleCheckout={false}
        modalTitle="Depósito na carteira (Pix)"
        cancelAwaitLabel="Parar de aguardar"
        pollingMessage="Aguardando o Mercado Pago confirmar o depósito…"
        walletDeposit
      />
    </>
  );
}
