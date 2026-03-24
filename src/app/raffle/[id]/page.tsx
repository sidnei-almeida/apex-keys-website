"use client";

import AuthModal from "@/components/layout/AuthModal";
import PixDepositModal from "@/components/raffle/PixDepositModal";
import { useAuth } from "@/contexts/AuthContext";
import { getApiBaseUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/http";
import {
  completeReservationWallet,
  getRaffleById,
  postReservationPixIntent,
  reserveRaffleTickets,
  getReservationStatus,
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

const RES_POLL_INTERVAL_MS = 2500;
const RES_POLL_MAX_ATTEMPTS = 120;

async function pollReservationUntilPaid(
  token: string,
  holdId: string,
  signal: AbortSignal,
): Promise<boolean> {
  for (let i = 0; i < RES_POLL_MAX_ATTEMPTS; i++) {
    if (signal.aborted) return false;
    try {
      const st = await getReservationStatus(token, holdId);
      if (st.state === "paid") return true;
      if (st.state === "released" || st.state === "unknown") return false;
    } catch {
      /* continua */
    }
    if (i < RES_POLL_MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, RES_POLL_INTERVAL_MS));
    }
  }
  return false;
}

export default function RafflePage() {
  const params = useParams<{ id: string }>();
  const { user, isAuthenticated, refreshUser, isReady } = useAuth();
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
    [raffle?.sold_numbers],
  );

  const heldSet = useMemo(
    () => new Set(raffle?.held_numbers ?? []),
    [raffle?.held_numbers],
  );

  const unavailableSet = useMemo(() => {
    const u = new Set<number>();
    for (const n of soldSet) u.add(n);
    for (const n of heldSet) u.add(n);
    return u;
  }, [soldSet, heldSet]);

  const selectedSet = useMemo(
    () => new Set(selectedNumbers),
    [selectedNumbers],
  );

  const toggleNumber = useCallback(
    (num: number) => {
      if (!raffle || unavailableSet.has(num)) return;
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
    [raffle, unavailableSet, selectedSet, isAuthenticated],
  );

  const ticketPrice = raffle ? parseFloat(raffle.ticket_price) : 0;
  const totalPay = selectedNumbers.length * ticketPrice;
  const canPay = selectedNumbers.length > 0;

  const balance = parseFloat(user?.balance ?? "0");
  const balanceNum = Number.isFinite(balance) ? balance : 0;
  const canPayWithBalanceOnly =
    useBalance && totalPay > 0 && balanceNum + 0.001 >= totalPay;

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

    if (!isReady) {
      toast.message("A carregar o seu perfil…", {
        description: "Tente novamente dentro de um instante.",
      });
      return;
    }

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    if (useBalance && !canPayWithBalanceOnly) {
      setPayError(
        "Saldo insuficiente para pagar só com a carteira. Escolha Pix ou recarregue a carteira em Minha conta.",
      );
      toast.error("Saldo insuficiente", {
        description:
          "Marque Pix para pagar o total da reserva ou adicione saldo antes.",
      });
      return;
    }

    setPaying(true);
    try {
      const reserve = await reserveRaffleTickets(token, {
        raffle_id: raffle.id,
        ticket_numbers: [...selectedNumbers].sort((a, b) => a - b),
      });

      if (canPayWithBalanceOnly) {
        await completeReservationWallet(token, reserve.payment_hold_id);
        await refreshUser();
        const updated = await getRaffleById(raffle.id);
        setRaffle(updated);
        setSelectedNumbers([]);
        toast.success("Compra concluída", {
          description: `${reserve.ticket_numbers.length} cota(s) garantida(s) na carteira.`,
        });
        return;
      }

      const gatewayRef = `rr-${raffle.id}-${crypto.randomUUID()}`;
      const intent = await postReservationPixIntent(token, {
        payment_hold_id: reserve.payment_hold_id,
        gateway_reference: gatewayRef,
      });
      setPixIntent(intent);
      setPixModalOpen(true);

      const ac = new AbortController();
      pixAbortRef.current = ac;
      setPixPolling(true);

      const ok = await pollReservationUntilPaid(
        token,
        reserve.payment_hold_id,
        ac.signal,
      );
      pixAbortRef.current = null;
      setPixPolling(false);

      if (!ok) {
        if (ac.signal.aborted) {
          toast.message("Aguardo interrompido", {
            description:
              "Se já pagou o Pix, o sistema pode ainda confirmar — atualize a página em instantes.",
          });
        } else {
          toast.error("Pagamento não confirmado a tempo", {
            description:
              "Confira o Pix no banco ou tente de novo. Os números ficam reservados até o MP confirmar ou um admin libertar.",
          });
        }
        setPixModalOpen(false);
        setPixIntent(null);
        const updated = await getRaffleById(raffle.id);
        setRaffle(updated);
        return;
      }

      await refreshUser();
      setPixModalOpen(false);
      setPixIntent(null);
      const updated = await getRaffleById(raffle.id);
      setRaffle(updated);
      setSelectedNumbers([]);
      toast.success("Pagamento confirmado", {
        description: `${reserve.ticket_numbers.length} cota(s) garantida(s).`,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const msg =
          err.detail ?? "Número já foi reservado ou vendido por outro jogador.";
        setPayError(msg);
        toast.error("Número indisponível", { description: msg });
        try {
          const updated = await getRaffleById(raffle.id);
          setRaffle(updated);
        } catch {
          /* ignore */
        }
        setSelectedNumbers([]);
        return;
      }
      const msg =
        err instanceof ApiError
          ? (err.detail ?? "Erro ao processar")
          : "Erro ao processar";
      setPayError(msg);
      toast.error("Erro no pagamento", { description: msg });
      setPixModalOpen(false);
      setPixIntent(null);
      setPixPolling(false);
      pixAbortRef.current?.abort();
      pixAbortRef.current = null;
      try {
        const updated = await getRaffleById(raffle.id);
        setRaffle(updated);
      } catch {
        /* ignore */
      }
    } finally {
      setPaying(false);
    }
  }, [
    raffle,
    canPay,
    isAuthenticated,
    isReady,
    useBalance,
    canPayWithBalanceOnly,
    selectedNumbers,
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
                Seu saldo: {formatBRL(balanceNum)}
              </p>
            )}

            {user?.is_admin ? (
              <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
                <strong>Conta admin:</strong> com saldo suficiente e &quot;Utilizar
                saldo&quot;, os números são reservados e debitados na hora. Com{" "}
                <strong>Pix</strong>, a reserva bloqueia os números até o MP
                confirmar.
              </p>
            ) : null}

            <p className="mt-3 text-xs text-apex-text/55">
              Ao pagar, os números ficam <strong>reservados</strong> para você. Se
              outro jogador tentar o mesmo, vê que já não está disponível.
            </p>

            <p className="mt-2 text-xs text-apex-text/55">
              <strong>Pix</strong>: cobrança Mercado Pago pelo total selecionado.{" "}
              <strong>Carteira</strong>: apenas se o saldo cobrir o total.
            </p>

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-apex-text">
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
              Pix (Mercado Pago — QR ou link; teste com conta comprador MP)
            </label>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-apex-text">
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
              Utilizar saldo da carteira
            </label>

            {useBalance && canPayWithBalanceOnly && totalPay > 0 && (
              <p className="mt-2 text-sm text-apex-accent/90">
                Saldo cobre o total ({formatBRL(totalPay)}) — débito direto após
                reservar.
              </p>
            )}

            {payError && (
              <p className="mt-2 text-sm text-red-400">{payError}</p>
            )}

            <button
              type="button"
              disabled={!canPay || paying || !isReady}
              onClick={handlePay}
              className="mt-4 w-full rounded-xl bg-apex-accent py-3 text-center font-bold text-apex-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  Processando…
                </span>
              ) : !isReady ? (
                "A carregar…"
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
            amountLabel={formatBRL(totalPay)}
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
                className="size-3 shrink-0 rounded-full bg-amber-900/80 ring-1 ring-amber-600/50"
                aria-hidden
              />
              Reservado (aguard. pagamento)
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-apex-bg opacity-50 ring-1 ring-apex-bg"
                aria-hidden
              />
              Vendido
            </span>
          </div>

          <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {numbers.map((num) => {
              const sold = soldSet.has(num);
              const held = heldSet.has(num);
              const blocked = unavailableSet.has(num);
              const selected = selectedSet.has(num);

              let className =
                "flex aspect-square min-h-[2.25rem] items-center justify-center rounded-lg border text-sm font-medium transition-all sm:min-h-0 sm:aspect-auto sm:py-2";

              if (sold) {
                className +=
                  " cursor-not-allowed border-apex-bg/50 bg-apex-bg opacity-50 line-through text-apex-text/40";
              } else if (held) {
                className +=
                  " cursor-not-allowed border-amber-600/35 bg-amber-950/50 text-amber-200/70 line-through";
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
                  disabled={blocked}
                  onClick={() => toggleNumber(num)}
                  className={className}
                  aria-pressed={selected}
                  aria-label={
                    sold
                      ? `Número ${num}, vendido`
                      : held
                        ? `Número ${num}, reservado`
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
