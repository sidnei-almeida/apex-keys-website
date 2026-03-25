"use client";

import AuthModal from "@/components/layout/AuthModal";
import PixDepositModal from "@/components/raffle/PixDepositModal";
import { useAuth } from "@/contexts/AuthContext";
import { getApiBaseUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/http";
import {
  completeReservationWallet,
  getRaffleById,
  getReservationStatus,
  postReservationPixIntent,
  releaseReservation,
  reserveRaffleTickets,
} from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import { dailymotionEmbedSrc } from "@/lib/video-embed";
import type { PixIntentResponse, RaffleDetailOut } from "@/types/api";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Gamepad2,
  Loader2,
  Wallet,
} from "lucide-react";
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

function isIgdbPublicUrl(url: string | null | undefined): url is string {
  if (!url || !url.trim()) return false;
  try {
    const u = new URL(url.trim());
    const h = u.hostname.toLowerCase();
    return (
      (h === "www.igdb.com" || h === "igdb.com") &&
      u.pathname.startsWith("/games/")
    );
  } catch {
    return false;
  }
}

function raffleStatusLabelPt(status: string): string {
  switch (status) {
    case "active":
      return "Ativa";
    case "sold_out":
      return "Esgotada";
    case "finished":
      return "Encerrada";
    case "canceled":
      return "Cancelada";
    default:
      return status;
  }
}

const SYNOPSIS_COLLAPSE_CHARS = 520;

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
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const pixAbortRef = useRef<AbortController | null>(null);
  /** Hold ativo durante fluxo Pix da rifa (para libertar ao cancelar). */
  const activePaymentHoldIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedNumbers([]);
    }
  }, [isAuthenticated]);

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
      if (!raffle || unavailableSet.has(num) || !isAuthenticated) return;
      setSelectedNumbers((prev) => {
        if (prev.includes(num)) {
          return prev.filter((n) => n !== num);
        }
        return [...prev, num].sort((a, b) => a - b);
      });
    },
    [raffle, unavailableSet, isAuthenticated],
  );

  const ticketPrice = raffle ? parseFloat(raffle.ticket_price) : 0;
  const totalPay = selectedNumbers.length * ticketPrice;
  const canPay = selectedNumbers.length > 0;

  const balance = parseFloat(user?.balance ?? "0");
  const balanceNum = Number.isFinite(balance) ? balance : 0;
  const canPayWithBalanceOnly =
    useBalance && totalPay > 0 && balanceNum + 0.001 >= totalPay;

  const cancelPixAwait = useCallback(async () => {
    const token = getAccessToken();
    const holdId = activePaymentHoldIdRef.current;
    const rid = raffle?.id ?? null;
    if (holdId && token) {
      try {
        await releaseReservation(token, holdId);
        toast.success("Reserva cancelada", {
          description: "Os números voltaram a ficar disponíveis.",
        });
      } catch (e) {
        const d =
          e instanceof ApiError
            ? e.detail
            : e instanceof Error
              ? e.message
              : "";
        toast.error("Não foi possível libertar os números", {
          description: d || "Atualize a página ou tente de novo.",
        });
      }
    }
    activePaymentHoldIdRef.current = null;
    pixAbortRef.current?.abort();
    pixAbortRef.current = null;
    setPixPolling(false);
    setPixModalOpen(false);
    setPixIntent(null);
    if (rid) {
      try {
        const updated = await getRaffleById(rid);
        setRaffle(updated);
      } catch {
        /* ignore */
      }
    }
  }, [raffle?.id]);

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
    activePaymentHoldIdRef.current = null;
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

      activePaymentHoldIdRef.current = reserve.payment_hold_id;
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
        if (!ac.signal.aborted) {
          try {
            await releaseReservation(token, reserve.payment_hold_id);
            activePaymentHoldIdRef.current = null;
          } catch {
            /* ignore */
          }
          toast.error("Pagamento não confirmado a tempo", {
            description:
              "Os números foram libertados. Pode selecionar de novo ou tentar outro pagamento.",
          });
        }
        /* Se aborted, cancelPixAwait já libertou e mostrou toast. */
        setPixModalOpen(false);
        setPixIntent(null);
        const updated = await getRaffleById(raffle.id);
        setRaffle(updated);
        return;
      }

      activePaymentHoldIdRef.current = null;
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
      const hid = activePaymentHoldIdRef.current;
      activePaymentHoldIdRef.current = null;
      if (hid) {
        try {
          await releaseReservation(token, hid);
        } catch {
          /* ignore */
        }
      }
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
    [raffle],
  );

  const imageUrl = raffle ? raffleImageUrl(raffle.image_url) : null;
  const videoId = raffle?.video_id ?? null;
  const summaryPlain = raffle?.summary?.trim() ?? "";
  const synopsisNeedsToggle = summaryPlain.length > SYNOPSIS_COLLAPSE_CHARS;
  const synopsisDisplay =
    !synopsisNeedsToggle || synopsisExpanded
      ? summaryPlain
      : `${summaryPlain.slice(0, SYNOPSIS_COLLAPSE_CHARS).trim()}…`;

  const heldCount = raffle?.held ?? 0;
  const availableApprox =
    raffle != null
      ? Math.max(0, raffle.total_tickets - raffle.sold - heldCount)
      : 0;

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

  const showTechSheet =
    (raffle.series?.length ?? 0) > 0 ||
    (raffle.game_modes?.length ?? 0) > 0 ||
    (raffle.player_perspectives?.length ?? 0) > 0 ||
    Boolean(raffle.igdb_game_id?.trim());

  const showStoryBlock =
    Boolean(summaryPlain) ||
    showTechSheet ||
    isIgdbPublicUrl(raffle.igdb_url);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-apex-accent"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Voltar
      </Link>

      <section className="relative mt-6 min-h-[240px] overflow-hidden rounded-2xl border border-apex-primary/25 shadow-[inset_0_1px_0_rgba(0,212,255,0.08)] sm:min-h-[280px]">
        {imageUrl ? (
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, min(100vw, 80rem)"
              className="object-cover object-center"
              aria-hidden
              unoptimized
            />
          </div>
        ) : (
          <>
            <div
              className="absolute inset-0 bg-gradient-to-br from-apex-surface/95 via-apex-bg to-apex-surface/80"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <Gamepad2
                className="size-28 text-apex-accent/20 sm:size-36"
                strokeWidth={1.1}
              />
            </div>
          </>
        )}

        {/* Scrim: com foto usa overlay forte à esquerda; sem foto só suaviza para o texto */}
        <div
          className={
            imageUrl
              ? "pointer-events-none absolute inset-0 bg-gradient-to-r from-apex-bg/[0.96] via-apex-bg/78 to-apex-bg/35"
              : "pointer-events-none absolute inset-0 bg-gradient-to-r from-apex-bg/80 via-apex-bg/35 to-transparent"
          }
          aria-hidden
        />
        {imageUrl ? (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-apex-bg/70 via-transparent to-apex-bg/40 md:hidden"
            aria-hidden
          />
        ) : null}

        <div className="relative z-10 max-w-3xl space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="rounded-md bg-apex-accent/25 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-apex-accent">
              {raffleStatusLabelPt(raffle.status)}
            </span>
            <span className="text-xs text-apex-text/75 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
              {raffle.sold} de {raffle.total_tickets} cotas vendidas
              {heldCount > 0 ? ` · ${heldCount} reservada(s)` : ""}
              {raffle.status === "active" || raffle.status === "sold_out"
                ? ` · ~${availableApprox} disponíveis`
                : null}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-apex-text [text-shadow:0_2px_12px_rgba(0,0,0,0.55)] sm:text-4xl">
            {raffle.title}
          </h1>
          <p className="text-xl font-semibold text-apex-success [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
            {formatBRL(raffle.ticket_price)}{" "}
            <span className="text-base font-normal text-apex-text/80">
              / cota
            </span>
          </p>
          {raffle.genres && raffle.genres.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {raffle.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-apex-accent/25 bg-apex-bg/40 px-3 py-1 text-xs font-medium text-apex-accent backdrop-blur-[2px]"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {videoId ? (
        <div className="mt-8">
          <div className="overflow-hidden rounded-2xl bg-black ring-1 ring-apex-primary/30 shadow-[0_24px_56px_rgba(0,0,0,0.45)]">
            <div className="relative aspect-video w-full overflow-hidden">
              <iframe
                src={dailymotionEmbedSrc(videoId)}
                title={`Trailer — ${raffle.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      ) : null}

      {showStoryBlock ? (
        <div
          className={`min-w-0 space-y-6 ${videoId ? "mt-10" : "mt-8"}`}
        >
          {summaryPlain ? (
            <div className="rounded-xl border border-apex-primary/20 bg-apex-surface/50 p-5 sm:p-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-apex-accent/90">
                Sinopse
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-apex-text/88">
                {synopsisDisplay}
              </p>
              {synopsisNeedsToggle ? (
                <button
                  type="button"
                  onClick={() => setSynopsisExpanded((v) => !v)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-apex-accent transition-colors hover:text-apex-accent/80"
                >
                  {synopsisExpanded ? (
                    <>
                      <ChevronUp className="size-4 shrink-0" aria-hidden />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-4 shrink-0" aria-hidden />
                      Ler mais
                    </>
                  )}
                </button>
              ) : null}
            </div>
          ) : null}

          {showTechSheet ? (
            <div className="rounded-xl border border-apex-primary/20 bg-apex-surface/40 p-5 sm:p-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-apex-accent/90">
                Ficha técnica
              </h2>
              <dl className="mt-4 space-y-4 text-sm">
                {(raffle.series?.length ?? 0) > 0 ? (
                  <div className="grid gap-1 border-b border-apex-primary/10 pb-4 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-6">
                    <dt className="font-medium text-apex-text/50">
                      Série / franchise
                    </dt>
                    <dd className="text-apex-text/90">
                      {raffle.series!.join(" · ")}
                    </dd>
                  </div>
                ) : null}
                {(raffle.game_modes?.length ?? 0) > 0 ? (
                  <div className="grid gap-1 border-b border-apex-primary/10 pb-4 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-6">
                    <dt className="font-medium text-apex-text/50">
                      Modos de jogo
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {raffle.game_modes!.map((m) => (
                        <span
                          key={m}
                          className="rounded-md bg-apex-bg px-2.5 py-1 text-xs text-apex-text/85 ring-1 ring-apex-primary/15"
                        >
                          {m}
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
                {(raffle.player_perspectives?.length ?? 0) > 0 ? (
                  <div className="grid gap-1 border-b border-apex-primary/10 pb-4 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-6">
                    <dt className="font-medium text-apex-text/50">
                      Perspectiva
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {raffle.player_perspectives!.map((p) => (
                        <span
                          key={p}
                          className="rounded-md bg-apex-bg px-2.5 py-1 text-xs text-apex-text/85 ring-1 ring-apex-primary/15"
                        >
                          {p}
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
                {raffle.igdb_game_id?.trim() ? (
                  <div className="grid gap-1 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-6">
                    <dt className="font-medium text-apex-text/50">
                      ID no IGDB
                    </dt>
                    <dd className="font-mono text-xs text-apex-text/80">
                      {raffle.igdb_game_id.trim()}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {isIgdbPublicUrl(raffle.igdb_url) ? (
            <a
              href={raffle.igdb_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-apex-accent/35 bg-apex-accent/10 px-4 py-2.5 text-sm font-semibold text-apex-accent transition-colors hover:border-apex-accent/60 hover:bg-apex-accent/15"
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden />
              Ver ficha completa no IGDB
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Números à esquerda (mais largo) + pagamento à direita (mais estreito) */}
      <div
        className={`grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-stretch ${
          videoId || showStoryBlock ? "mt-10" : "mt-8"
        }`}
      >
        <div className="min-w-0 rounded-xl border border-apex-primary/25 bg-apex-surface/90 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-apex-text">
            Escolha seus números
          </h2>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-apex-bg ring-1 ring-apex-primary/30"
                aria-hidden
              />
              Disponível
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-apex-accent"
                aria-hidden
              />
              Selecionado
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-amber-900/80 ring-1 ring-amber-600/50"
                aria-hidden
              />
              Reservado
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-apex-bg opacity-50 ring-1 ring-apex-bg"
                aria-hidden
              />
              Vendido
            </span>
          </div>

          <div
            className="mt-4 max-h-[min(36rem,60vh)] overflow-y-auto overscroll-y-contain rounded-lg border border-apex-primary/15 bg-apex-bg/35 p-3 [-webkit-overflow-scrolling:touch] sm:p-4"
            role="region"
            aria-label="Grelha de números da rifa"
          >
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
              {numbers.map((num) => {
                const sold = soldSet.has(num);
                const held = heldSet.has(num);
                const blocked = unavailableSet.has(num);
                const selected = selectedSet.has(num);

                let className =
                  "flex aspect-square min-h-[2.25rem] items-center justify-center rounded-lg border text-sm font-medium transition-all sm:min-h-0 sm:aspect-auto sm:py-2";

                const needsLogin = !isAuthenticated && !sold && !held;

                if (sold) {
                  className +=
                    " cursor-not-allowed border-apex-bg/50 bg-apex-bg opacity-50 line-through text-apex-text/40";
                } else if (held) {
                  className +=
                    " cursor-not-allowed border-amber-600/35 bg-amber-950/50 text-amber-200/70 line-through";
                } else if (needsLogin) {
                  className +=
                    " cursor-not-allowed border-apex-primary/15 bg-apex-bg/50 text-apex-text/45 opacity-70";
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
                    disabled={blocked || needsLogin}
                    onClick={() => toggleNumber(num)}
                    className={className}
                    aria-pressed={needsLogin ? false : selected}
                    aria-label={
                      sold
                        ? `Número ${num}, vendido`
                        : held
                          ? `Número ${num}, reservado`
                          : needsLogin
                            ? `Número ${num}, faça login para selecionar`
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

        <div className="flex min-h-0 flex-col lg:h-full">
          <div className="flex min-h-0 w-full flex-1 flex-col rounded-xl border border-apex-primary/30 bg-apex-surface p-5 sm:p-6 lg:min-h-full">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-apex-primary/15 pb-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-apex-text/55">
                  Seleção
                </p>
                <p className="mt-0.5 text-apex-text">
                  <span className="font-bold text-apex-accent">
                    {selectedNumbers.length}{" "}
                    {selectedNumbers.length === 1 ? "número" : "números"}
                  </span>
                  <span className="text-apex-text/70"> selecionado(s)</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-apex-text/55">
                  Total a pagar
                </p>
                <p className="mt-0.5 text-xl font-semibold text-apex-accent">
                  {formatBRL(totalPay)}
                </p>
              </div>
            </div>

            {isAuthenticated && (
              <p className="mt-3 text-sm text-apex-text/75">
                Seu saldo:{" "}
                <span className="font-medium text-apex-text">{formatBRL(balanceNum)}</span>
              </p>
            )}

            {user?.is_admin ? (
              <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-snug text-amber-200/90">
                <strong>Conta admin:</strong> com saldo suficiente e &quot;Utilizar
                saldo&quot;, os números são reservados e debitados na hora. Com{" "}
                <strong>Pix</strong>, a reserva bloqueia os números até o MP
                confirmar.
              </p>
            ) : null}

            {/* Ocupa a altura disponível na coluna: texto completo, quebra na largura do card */}
            <div className="mt-4 min-h-0 flex-1 flex flex-col justify-start gap-4 border-t border-apex-primary/10 pt-4">
              <p className="text-sm leading-relaxed text-apex-text/80">
                Ao pagar, os números ficam <strong className="text-apex-text">reservados</strong>{" "}
                para você. Se outro jogador tentar o mesmo, vê que já não está
                disponível.
              </p>
              <p className="text-sm leading-relaxed text-apex-text/75">
                <strong className="text-apex-text/90">Pix</strong>: cobrança Mercado Pago
                pelo total selecionado (QR ou link).{" "}
                <strong className="text-apex-text/90">Carteira</strong>: apenas se o
                saldo cobrir o valor total.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer gap-3 text-sm leading-snug text-apex-text">
                <input
                  type="radio"
                  name="payment-method"
                  checked={!useBalance}
                  onChange={() => {
                    setUseBalance(false);
                    setPayError(null);
                  }}
                  className="mt-0.5 size-4 shrink-0 accent-apex-accent"
                />
                <span>
                  Pix (Mercado Pago — QR ou link; em testes, use conta comprador MP)
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 text-sm leading-snug text-apex-text">
                <input
                  type="radio"
                  name="payment-method"
                  checked={useBalance}
                  onChange={() => {
                    setUseBalance(true);
                    setPayError(null);
                  }}
                  className="mt-0.5 size-4 shrink-0 accent-apex-accent"
                />
                <span className="inline-flex items-start gap-2">
                  <Wallet className="mt-0.5 size-4 shrink-0 text-apex-accent/80" aria-hidden />
                  Utilizar saldo da carteira
                </span>
              </label>
            </div>

            {useBalance && canPayWithBalanceOnly && totalPay > 0 && (
              <p className="mt-3 text-sm text-apex-accent/90">
                Saldo cobre o total ({formatBRL(totalPay)}) — débito direto após
                reservar.
              </p>
            )}

            {payError && (
              <p className="mt-2 text-sm text-red-400">{payError}</p>
            )}

            <div className="mt-auto shrink-0 pt-4">
              <button
                type="button"
                disabled={!canPay || paying || !isReady}
                onClick={handlePay}
                className="w-full rounded-xl bg-apex-accent py-3 text-center font-bold text-apex-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
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
          </div>
        </div>
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
        raffleCheckout
      />
    </div>
  );
}
