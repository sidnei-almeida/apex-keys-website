"use client";

import AuthModal from "@/components/layout/AuthModal";
import PixDepositModal from "@/components/raffle/PixDepositModal";
import { useAuth } from "@/contexts/AuthContext";
import { getApiBaseUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/http";
import {
  buyTicket,
  getRaffleById,
  getWalletBalance,
  postMockPixIntent,
} from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { PixIntentResponse, RaffleDetailOut } from "@/types/api";
import { ArrowLeft, Gamepad2, Loader2, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function formatBRL(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n)
    ? "R$ 0,00"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function raffleImageUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${getApiBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

const PIX_POLL_INTERVAL_MS = 2500;
const PIX_POLL_MAX_ATTEMPTS = 120;

async function pollBalanceAtLeast(
  token: string,
  minTotal: number,
  signal: AbortSignal,
): Promise<boolean> {
  const threshold = minTotal - 0.02;
  for (let i = 0; i < PIX_POLL_MAX_ATTEMPTS; i++) {
    if (signal.aborted) return false;
    await new Promise((r) => setTimeout(r, PIX_POLL_INTERVAL_MS));
    if (signal.aborted) return false;
    try {
      const { balance } = await getWalletBalance(token);
      const b = parseFloat(balance);
      if (!Number.isNaN(b) && b >= threshold) return true;
    } catch {
      /* continua a tentar */
    }
  }
  return false;
}

export default function RafflePage() {
  const params = useParams<{ id: string }>();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const raffleId = params?.id ?? null;
  const [raffle, setRaffle] = useState<RaffleDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [useBalance, setUseBalance] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixIntent, setPixIntent] = useState<PixIntentResponse | null>(null);
  const [pixPolling, setPixPolling] = useState(false);
  const pixAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!raffleId) {
      setLoading(false);
      setError("ID da rifa não encontrado");
      return;
    }
    getRaffleById(raffleId)
      .then(setRaffle)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar rifa")
      )
      .finally(() => setLoading(false));
  }, [raffleId]);

  const soldSet = useMemo(
    () => new Set(raffle?.sold_numbers ?? []),
    [raffle?.sold_numbers]
  );

  const selectedSet = useMemo(
    () => new Set(selectedNumbers),
    [selectedNumbers]
  );

  const toggleNumber = useCallback(
    (num: number) => {
      if (!raffle || soldSet.has(num)) return;
      const isAdding = !selectedSet.has(num);
      setSelectedNumbers((prev) => {
        if (prev.includes(num)) {
          return prev.filter((n) => n !== num);
        }
        return [...prev, num].sort((a, b) => a - b);
      });
      if (isAdding && !isAuthenticated) {
        toast("Faça login para participar", {
          description: "Você precisará entrar para finalizar a compra.",
        });
      }
    },
    [raffle, soldSet, selectedSet, isAuthenticated]
  );

  const ticketPrice = raffle ? parseFloat(raffle.ticket_price) : 0;
  const totalPay = selectedNumbers.length * ticketPrice;
  const canPay = selectedNumbers.length > 0;

  const balance = parseFloat(user?.balance ?? "0") || 0;
  const amountFromBalance = useBalance ? Math.min(balance, totalPay) : 0;
  const amountViaMp = totalPay - amountFromBalance;
  /** Valor a depositar via Pix antes de comprar (saldo atual já cobre o resto se useBalance). */
  const pixDepositAmount = useBalance
    ? Math.max(0, totalPay - balance)
    : totalPay;
  const canPayWithBalanceOnly = pixDepositAmount < 0.01;

  const runBuyTickets = useCallback(
    async (token: string, r: RaffleDetailOut, nums: number[]) => {
      for (const num of [...nums].sort((a, b) => a - b)) {
        await buyTicket(token, {
          raffle_id: r.id,
          ticket_number: num,
        });
      }
      await refreshUser();
      const updated = await getRaffleById(r.id);
      setRaffle(updated);
      setSelectedNumbers([]);
      toast.success("Compra concluída", {
        description: `${nums.length} cota(s) garantida(s).`,
      });
    },
    [refreshUser],
  );

  const cancelPixAwait = useCallback(() => {
    pixAbortRef.current?.abort();
    pixAbortRef.current = null;
    setPixPolling(false);
    setPixModalOpen(false);
    setPixIntent(null);
  }, []);

  useEffect(() => {
    return () => {
      pixAbortRef.current?.abort();
    };
  }, []);

  const handlePay = useCallback(async () => {
    if (!raffle || !canPay) return;
    setPayError(null);

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    if (canPayWithBalanceOnly) {
      setPaying(true);
      try {
        await runBuyTickets(token, raffle, selectedNumbers);
      } catch (err) {
        setPayError(
          err instanceof ApiError
            ? (err.detail ?? "Erro ao processar pagamento")
            : "Erro ao processar pagamento",
        );
      } finally {
        setPaying(false);
      }
      return;
    }

    const deposit = Number(pixDepositAmount.toFixed(2));
    const gatewayRef = `rk-${raffle.id}-${crypto.randomUUID()}`;

    setPaying(true);
    try {
      const intent = await postMockPixIntent(token, {
        amount: deposit,
        gateway_reference: gatewayRef,
      });
      setPixIntent(intent);
      setPixModalOpen(true);

      const ac = new AbortController();
      pixAbortRef.current = ac;
      setPixPolling(true);

      const funded = await pollBalanceAtLeast(token, totalPay, ac.signal);
      pixAbortRef.current = null;
      setPixPolling(false);

      if (!funded) {
        if (ac.signal.aborted) {
          toast.message("Compra cancelada", {
            description: "O aguardo do Pix foi interrompido.",
          });
        } else {
          toast.error("Pix não confirmado a tempo", {
            description:
              "Tente novamente ou confira o pagamento no app do banco / Mercado Pago.",
          });
        }
        setPixModalOpen(false);
        setPixIntent(null);
        return;
      }

      await refreshUser();
      setPixModalOpen(false);
      setPixIntent(null);
      toast.success("Saldo atualizado", { description: "Finalizando compra…" });

      try {
        await runBuyTickets(token, raffle, selectedNumbers);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? (err.detail ?? "Erro ao comprar cotas")
            : "Erro ao comprar cotas";
        setPayError(msg);
        toast.error("Erro na compra", { description: msg });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setPayError(err.detail ?? "Erro ao iniciar Pix");
        toast.error("Erro no Pix", { description: err.detail });
      } else {
        setPayError("Erro ao iniciar Pix");
      }
      setPixModalOpen(false);
      setPixIntent(null);
      setPixPolling(false);
      pixAbortRef.current?.abort();
      pixAbortRef.current = null;
    } finally {
      setPaying(false);
    }
  }, [
    raffle,
    canPay,
    isAuthenticated,
    canPayWithBalanceOnly,
    pixDepositAmount,
    selectedNumbers,
    totalPay,
    runBuyTickets,
    refreshUser,
  ]);

  const numbers = useMemo(
    () =>
      raffle
        ? Array.from({ length: raffle.total_tickets }, (_, i) => i + 1)
        : [],
    [raffle?.total_tickets]
  );

  const imageUrl = raffle ? raffleImageUrl(raffle.image_url) : null;
  const videoId = raffle?.video_id ?? null;
  const hasIgdbData =
    raffle &&
    ((raffle.summary && raffle.summary.trim()) ||
      (raffle.genres && raffle.genres.length > 0));

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
        <Loader2
          className="size-12 animate-spin text-apex-accent"
          aria-hidden
        />
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-apex-accent"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Voltar
        </Link>
        <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-red-400">
            {error ?? "Rifa não encontrada"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-apex-accent"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Voltar
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-6">
          <div className="mx-auto w-full max-w-xs">
            <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-apex-surface shadow-[0_0_30px_rgba(0,212,255,0.15)]">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={raffle.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Gamepad2
                  className="size-20 text-apex-accent/35 sm:size-24"
                  strokeWidth={1.15}
                  aria-hidden
                />
              )}
            </div>
          </div>

          {videoId && (
            <div className="mx-auto w-full max-w-xs">
              <h3 className="mb-2 text-sm font-semibold text-apex-text/80">
                Trailer
              </h3>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-apex-bg">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Trailer do jogo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          )}

          {hasIgdbData && (
            <div className="rounded-xl border border-apex-primary/20 bg-apex-surface/60 p-4">
              <h3 className="mb-2 text-sm font-semibold text-apex-accent">
                Sobre o jogo
              </h3>
              {raffle.summary?.trim() && (
                <p className="text-sm leading-relaxed text-apex-text/85">
                  {raffle.summary}
                </p>
              )}
              {raffle.genres && raffle.genres.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {raffle.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-md bg-apex-accent/15 px-2 py-0.5 text-xs text-apex-accent"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-apex-text sm:text-3xl">
              {raffle.title}
            </h1>
            <p className="mt-2 text-apex-success">
              {formatBRL(raffle.ticket_price)} / cota
            </p>
          </div>

          <div className="rounded-xl border border-apex-primary/30 bg-apex-surface p-6">
            <p className="text-apex-text">
              Você selecionou:{" "}
              <span className="font-bold text-apex-accent">
                {selectedNumbers.length}{" "}
                {selectedNumbers.length === 1 ? "número" : "números"}
              </span>
            </p>
            <p className="mt-2 text-lg font-semibold text-apex-text">
              Total:{" "}
              <span className="text-apex-accent">{formatBRL(totalPay)}</span>
            </p>

            {isAuthenticated && (
              <p className="mt-1 text-sm text-apex-text/70">
                Seu saldo: {formatBRL(balance)}
              </p>
            )}

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-apex-text">
              <input
                type="radio"
                name="payment-method"
                checked={useBalance}
                onChange={() => {
                  setUseBalance(true);
                  setPayError(null);
                }}
                className="size-4 accent-apex-accent"
              />
              <Wallet className="size-4 text-apex-accent/80" aria-hidden />
              Utilizar saldo
            </label>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-apex-text">
              <input
                type="radio"
                name="payment-method"
                checked={!useBalance}
                onChange={() => {
                  setUseBalance(false);
                  setPayError(null);
                }}
                className="size-4 accent-apex-accent"
              />
              Pix (Mercado Pago — abre QR / link para pagar)
            </label>

            {useBalance && amountFromBalance > 0 && (
              <p className="mt-2 text-sm text-apex-accent/90">
                {amountFromBalance >= totalPay
                  ? `Saldo cobre o total (${formatBRL(totalPay)})`
                  : `Saldo: ${formatBRL(amountFromBalance)}. Falta depositar via Pix: ${formatBRL(amountViaMp)}`}
              </p>
            )}

            {payError && (
              <p className="mt-2 text-sm text-red-400">{payError}</p>
            )}

            <button
              type="button"
              disabled={!canPay || paying}
              onClick={handlePay}
              className="mt-4 w-full rounded-xl bg-apex-accent py-3 text-center font-bold text-apex-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  Processando…
                </span>
              ) : (
                "Pagar"
              )}
            </button>
          </div>

          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />

          <PixDepositModal
            open={pixModalOpen}
            onClose={() => setPixModalOpen(false)}
            onCancelAwait={cancelPixAwait}
            intent={pixIntent}
            polling={pixPolling}
            amountLabel={formatBRL(pixDepositAmount)}
          />
        </div>

        <div className="rounded-xl bg-apex-surface p-6">
          <h2 className="text-xl font-bold text-apex-text">
            Escolha seus números
          </h2>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-apex-bg ring-1 ring-apex-primary/30"
                aria-hidden
              />
              Disponível (Cinza)
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-apex-accent"
                aria-hidden
              />
              Selecionado (Ciano)
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-apex-bg opacity-50 ring-1 ring-apex-bg"
                aria-hidden
              />
              Vendido (Escuro/Bloqueado)
            </span>
          </div>

          <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {numbers.map((num) => {
              const sold = soldSet.has(num);
              const selected = selectedSet.has(num);

              let className =
                "flex aspect-square min-h-[2.25rem] items-center justify-center rounded-lg border text-sm font-medium transition-all sm:min-h-0 sm:aspect-auto sm:py-2";

              if (sold) {
                className +=
                  " cursor-not-allowed border-apex-bg/50 bg-apex-bg opacity-50 line-through text-apex-text/40";
              } else if (selected) {
                className +=
                  " scale-105 cursor-pointer border-apex-accent bg-apex-accent font-bold text-apex-bg shadow-md";
              } else {
                className +=
                  " cursor-pointer border-apex-primary/20 bg-apex-bg text-apex-text hover:border-apex-accent hover:bg-apex-primary/50";
              }

              return (
                <button
                  key={num}
                  type="button"
                  disabled={sold}
                  onClick={() => toggleNumber(num)}
                  className={className}
                  aria-pressed={selected}
                  aria-label={
                    sold
                      ? `Número ${num}, vendido`
                      : selected
                        ? `Número ${num}, selecionado`
                        : `Número ${num}, disponível`
                  }
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
