"use client";

import AuthModal from "@/components/layout/AuthModal";
import PixDepositModal from "@/components/raffle/PixDepositModal";
import { useAuth } from "@/contexts/AuthContext";
import { getApiBaseUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/http";
import {
  completeReservationWallet,
  getMyTickets,
  getRaffleById,
  getReservationStatus,
  postReservationPixIntent,
  releaseReservation,
  reserveRaffleTickets,
} from "@/lib/api/services";
import type { MyTicketOut } from "@/types/api";
import { getAccessToken } from "@/lib/auth/token-storage";
import {
  RAFFLE_NUMBER_GRID_CELL_BASE,
  RAFFLE_NUMBER_STYLE_AVAILABLE,
  RAFFLE_NUMBER_STYLE_SELECTED,
} from "@/lib/raffle-number-cell-classes";
import { dailymotionEmbedSrc } from "@/lib/video-embed";
import type { PixIntentResponse, RaffleDetailOut } from "@/types/api";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Columns,
  Crosshair,
  ExternalLink,
  Gamepad2,
  Globe,
  Handshake,
  Loader2,
  Monitor,
  PanelLeft,
  User,
  UserRound,
  Users,
  Wallet,
  Radio,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const TOAST_MS = 3000;

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

function normMeta(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Ícone + rótulo para tooltip / leitores de ecrã (dados vêm da API / IGDB). */
function iconForGameMode(mode: string): { Icon: LucideIcon; label: string } {
  const label = mode.trim();
  const n = normMeta(mode);
  if (
    n.includes("um jogador") ||
    n.includes("single player") ||
    n.includes("singleplayer") ||
    n === "single" ||
    n.includes("solo")
  ) {
    return { Icon: User, label };
  }
  if (
    n.includes("coop") ||
    n.includes("co-op") ||
    n.includes("cooperativ")
  ) {
    return { Icon: Handshake, label };
  }
  if (
    n.includes("multijogador") ||
    n.includes("multiplayer") ||
    n.includes("multi player") ||
    n.includes("versus") ||
    n.includes(" pvp")
  ) {
    return { Icon: Users, label };
  }
  if (n.includes("async") || n.includes("assincrono")) {
    return { Icon: Clock, label };
  }
  if (
    n.includes("split") ||
    n.includes("tela dividida") ||
    n.includes("ecra dividido") ||
    n.includes("partilha")
  ) {
    return { Icon: Columns, label };
  }
  if (n.includes("mmo") || n.includes("massively")) {
    return { Icon: Globe, label };
  }
  return { Icon: Gamepad2, label };
}

function iconForPerspective(p: string): { Icon: LucideIcon; label: string } {
  const label = p.trim();
  const n = normMeta(p);
  if (
    n.includes("primeira pessoa") ||
    n.includes("first person") ||
    n.includes("first-person") ||
    n === "first person"
  ) {
    return { Icon: Crosshair, label };
  }
  if (
    n.includes("terceira pessoa") ||
    n.includes("third person") ||
    n.includes("third-person")
  ) {
    return { Icon: UserRound, label };
  }
  if (
    n.includes("vista lateral") ||
    n.includes("side view") ||
    n.includes("side-view") ||
    n.includes("side scrolling")
  ) {
    return { Icon: PanelLeft, label };
  }
  if (n.includes("isometric") || n.includes("isometrico")) {
    return { Icon: Monitor, label };
  }
  if (n.includes("text") || n.includes("audio")) {
    return { Icon: Monitor, label };
  }
  return { Icon: Monitor, label };
}

function HeroMetaIconChip({
  label,
  Icon,
}: {
  label: string;
  Icon: LucideIcon;
}) {
  return (
    <span
      role="listitem"
      tabIndex={0}
      className="group relative inline-flex outline-none"
    >
      <span className="inline-flex cursor-default rounded p-0.5 text-premium-muted transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-premium-border">
        <Icon className="size-3.5 sm:size-4" strokeWidth={2} aria-hidden />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-30 mt-1.5 max-w-[11rem] rounded-md border border-premium-border bg-premium-surface px-2 py-1 text-center text-[10px] font-medium leading-snug text-premium-text opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 sm:max-w-[13rem] sm:text-xs"
      >
        {label}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
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
  const { user, isAuthenticated, refreshUser, isReady, avatarUrlCacheBust } = useAuth();
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
  /** Bilhetes do utilizador nesta rifa (para overlay de avatar na grelha). */
  const [myRaffleTickets, setMyRaffleTickets] = useState<MyTicketOut[]>([]);
  /** Tooltip do número próprio — posição viewport para contornar overflow-clip. */
  const [mineTooltip, setMineTooltip] = useState<{
    num: number;
    x: number;
    y: number;
    label: string | null;
  } | null>(null);

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
      setMyRaffleTickets([]);
      return;
    }
    const token = getAccessToken();
    if (!token || !raffleId) return;
    getMyTickets(token)
      .then((all) => setMyRaffleTickets(all.filter((t) => t.raffle_id === raffleId)))
      .catch(() => {/* falha silenciosa — é só visual */});
  }, [isAuthenticated, raffleId]);

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

  /** Números que o utilizador actual comprou nesta rifa. */
  const myNumbersSet = useMemo(
    () => new Set(myRaffleTickets.map((t) => t.ticket_number)),
    [myRaffleTickets],
  );

  /** Data de compra por número. */
  const myTicketDateMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of myRaffleTickets) m.set(t.ticket_number, t.created_at);
    return m;
  }, [myRaffleTickets]);

  const avatarSrc = user?.avatar_url
    ? `${user.avatar_url}${avatarUrlCacheBust ? `?v=${avatarUrlCacheBust}` : ""}`
    : null;

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
          id: "raffle-reserva-cancelada",
          duration: TOAST_MS,
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
          id: "raffle-release-erro",
          duration: TOAST_MS,
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
        id: "raffle-perfil-loading",
        duration: TOAST_MS,
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
        id: "raffle-saldo-insuficiente",
        duration: TOAST_MS,
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
          id: `raffle-checkout-${reserve.payment_hold_id}`,
          duration: TOAST_MS,
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
            id: "raffle-pix-timeout",
            duration: TOAST_MS,
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
        id: `raffle-checkout-${reserve.payment_hold_id}`,
        duration: TOAST_MS,
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
        toast.error("Número indisponível", {
          id: "raffle-numero-409",
          duration: TOAST_MS,
          description: msg,
        });
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
      toast.error("Erro no pagamento", {
        id: "raffle-pagamento-erro",
        duration: TOAST_MS,
        description: msg,
      });
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
          className="size-12 animate-spin text-premium-muted"
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
          className="inline-flex items-center gap-2 text-sm text-premium-muted transition-colors hover:text-premium-text"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Voltar
        </Link>
        <div className="mt-8 rounded-xl border border-red-900/50 bg-red-950/30 p-8 text-center">
          <p className="text-red-300/90">
            {error ?? "Rifa não encontrada"}
          </p>
        </div>
      </div>
    );
  }

  const heroMetaIcons =
    (raffle.game_modes?.length ?? 0) > 0 ||
    (raffle.player_perspectives?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-premium-muted transition-colors hover:text-premium-text"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Voltar
      </Link>

      <section className="relative mt-6 min-h-[240px] overflow-hidden rounded-2xl border border-premium-border bg-premium-surface sm:min-h-[280px]">
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
              className="absolute inset-0 bg-gradient-to-br from-premium-surface via-premium-bg to-premium-surface"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <Gamepad2
                className="size-28 text-premium-muted/25 sm:size-36"
                strokeWidth={1.1}
              />
            </div>
          </>
        )}

        {/* Scrim: com foto usa overlay forte à esquerda; sem foto só suaviza para o texto */}
        <div
          className={
            imageUrl
              ? "pointer-events-none absolute inset-0 bg-gradient-to-r from-premium-bg/[0.97] via-premium-bg/82 to-premium-bg/25"
              : "pointer-events-none absolute inset-0 bg-gradient-to-r from-premium-bg/85 via-premium-bg/40 to-transparent"
          }
          aria-hidden
        />
        {imageUrl ? (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-premium-bg/75 via-transparent to-premium-bg/45 md:hidden"
            aria-hidden
          />
        ) : null}

        {heroMetaIcons ? (
          <div className="pointer-events-auto absolute right-4 top-4 z-20 flex flex-col items-end gap-1.5 sm:right-6 sm:top-6">
            {(raffle.player_perspectives?.length ?? 0) > 0 ? (
              <div
                className="flex flex-wrap justify-end gap-1.5"
                role="list"
                aria-label="Perspectiva"
              >
                {raffle.player_perspectives!.map((p) => {
                  const spec = iconForPerspective(p);
                  return (
                    <HeroMetaIconChip
                      key={`persp-${p}`}
                      Icon={spec.Icon}
                      label={spec.label}
                    />
                  );
                })}
              </div>
            ) : null}
            {(raffle.game_modes?.length ?? 0) > 0 ? (
              <div
                className="flex max-w-[min(100%,9.5rem)] flex-wrap justify-end gap-1.5 sm:max-w-none"
                role="list"
                aria-label="Modos de jogo"
              >
                {raffle.game_modes!.map((m) => {
                  const spec = iconForGameMode(m);
                  return (
                    <HeroMetaIconChip
                      key={`mode-${m}`}
                      Icon={spec.Icon}
                      label={spec.label}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          className={`relative z-10 max-w-3xl space-y-4 p-6 pb-8 sm:space-y-5 sm:p-8 sm:pb-10 ${heroMetaIcons ? "pr-11 sm:pr-7 md:pr-9" : ""}`}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="rounded-md border border-premium-border bg-premium-surface px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-premium-accent">
              {raffleStatusLabelPt(raffle.status)}
            </span>
            <span className="text-xs text-premium-muted [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
              {raffle.sold} de {raffle.total_tickets} cotas vendidas
              {heldCount > 0 ? ` · ${heldCount} reservada(s)` : ""}
              {raffle.status === "active" || raffle.status === "sold_out"
                ? ` · ~${availableApprox} disponíveis`
                : null}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-premium-text [text-shadow:0_2px_12px_rgba(0,0,0,0.55)] sm:text-4xl">
            {raffle.title}
          </h1>
          {(raffle.status === "sold_out" || raffle.status === "finished") && (
            <Link
              href={`/raffle/${raffle.id}/sorteio`}
              className="inline-flex items-center gap-2 rounded-xl border border-premium-accent/40 bg-premium-accent/10 px-4 py-2.5 text-sm font-semibold text-premium-accent transition-colors hover:border-premium-accent/60 hover:bg-premium-accent/15"
            >
              <Radio className="size-4 shrink-0" aria-hidden />
              {raffle.status === "sold_out" && raffle.winning_ticket_number == null
                ? "Sorteio ao vivo — countdown e roleta"
                : "Ver resultado na roleta"}
            </Link>
          )}
          <p className="text-xl font-semibold text-premium-accent [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
            {formatBRL(raffle.ticket_price)}{" "}
            <span className="text-base font-normal text-premium-accent/90">
              / cota
            </span>
          </p>
          {raffle.genres && raffle.genres.length > 0 ? (
            <p className="pt-1 text-xs font-medium leading-relaxed text-premium-muted sm:text-sm">
              {raffle.genres.join(" · ")}
            </p>
          ) : null}

          {(raffle.series?.length ?? 0) > 0 ? (
            <p className="text-xs leading-snug text-premium-muted">
              {raffle.series!.join(" · ")}
            </p>
          ) : null}

          {summaryPlain ? (
            <div className="space-y-2 pt-1">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-premium-text sm:text-[0.9375rem]">
                {synopsisDisplay}
              </p>
              {synopsisNeedsToggle ? (
                <button
                  type="button"
                  onClick={() => setSynopsisExpanded((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-premium-muted transition-colors hover:text-premium-text"
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

          {isIgdbPublicUrl(raffle.igdb_url) ? (
            <a
              href={raffle.igdb_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-premium-muted underline-offset-4 transition-colors hover:text-premium-text hover:underline"
            >
              <ExternalLink className="size-3.5 shrink-0 opacity-90" aria-hidden />
              Ver ficha no IGDB
            </a>
          ) : null}
        </div>
      </section>

      {videoId ? (
        <div className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-premium-border bg-premium-surface">
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

      {/* Números à esquerda (mais largo) + pagamento à direita (mais estreito) */}
      <div
        className={`grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-stretch ${
          videoId ? "mt-10" : "mt-8"
        }`}
      >
        <div className="min-w-0 rounded-xl border border-premium-border bg-premium-surface p-5 sm:p-6">
          <h2 className="text-lg font-bold text-premium-text">
            Escolha seus números
          </h2>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-premium-muted sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-premium-cell ring-1 ring-premium-border"
                aria-hidden
              />
              Disponível
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-premium-accent"
                aria-hidden
              />
              Selecionado
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-red-950/80 ring-1 ring-red-900/60"
                aria-hidden
              />
              Reservado
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-premium-bg opacity-80 ring-1 ring-premium-border"
                aria-hidden
              />
              Vendido
            </span>
          </div>

          <div
            className="mt-4 max-h-[min(36rem,60vh)] overflow-y-auto overscroll-y-contain rounded-lg border border-premium-border bg-premium-bg p-3 [-webkit-overflow-scrolling:touch] sm:p-4"
            role="region"
            aria-label="Grelha de números da rifa"
          >
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
              {numbers.map((num) => {
                const sold = soldSet.has(num);
                const held = heldSet.has(num);
                const blocked = unavailableSet.has(num);
                const selected = selectedSet.has(num);
                const isMine = myNumbersSet.has(num);

                const needsLogin = !isAuthenticated && !sold && !held;

                if (isMine) {
                  const purchasedAt = myTicketDateMap.get(num);
                  const purchasedLabel = purchasedAt
                    ? new Date(purchasedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : null;

                  return (
                    <div
                      key={num}
                      className={`${RAFFLE_NUMBER_GRID_CELL_BASE} relative cursor-default overflow-hidden border-premium-accent/55 bg-[#1a1500] font-semibold text-premium-accent/90`}
                      aria-label={`Número ${num}, seu bilhete`}
                      role="img"
                      onMouseEnter={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setMineTooltip({
                          num,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          label: purchasedLabel,
                        });
                      }}
                      onMouseLeave={() => setMineTooltip(null)}
                    >
                      {avatarSrc && (
                        <span
                          className="pointer-events-none absolute inset-0 z-0 opacity-[0.18]"
                          aria-hidden
                        >
                          <img
                            src={avatarSrc}
                            alt=""
                            className="h-full w-full object-cover"
                            draggable={false}
                          />
                        </span>
                      )}
                      <span className="relative z-10">{num}</span>
                    </div>
                  );
                }

                let className = RAFFLE_NUMBER_GRID_CELL_BASE;

                if (sold) {
                  className +=
                    " cursor-not-allowed border-premium-border/40 bg-[#101010] opacity-55 line-through text-premium-muted/50";
                } else if (held) {
                  className +=
                    " cursor-not-allowed border-red-900/40 bg-red-950/35 text-red-300/55 line-through";
                } else if (needsLogin) {
                  className +=
                    " cursor-not-allowed border-premium-border/50 bg-premium-bg text-premium-muted/50 opacity-75";
                } else if (selected) {
                  className += ` ${RAFFLE_NUMBER_STYLE_SELECTED}`;
                } else {
                  className += ` ${RAFFLE_NUMBER_STYLE_AVAILABLE}`;
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
          <div className="flex min-h-0 w-full flex-1 flex-col rounded-xl border border-premium-border bg-premium-surface p-5 sm:p-6 lg:min-h-full">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-premium-border pb-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-premium-muted">
                  Seleção
                </p>
                <p className="mt-0.5 text-premium-text">
                  <span className="font-bold text-premium-accent">
                    {selectedNumbers.length}{" "}
                    {selectedNumbers.length === 1 ? "número" : "números"}
                  </span>
                  <span className="text-premium-muted"> selecionado(s)</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-premium-muted">
                  Total a pagar
                </p>
                <p className="mt-0.5 text-xl font-semibold text-premium-accent">
                  {formatBRL(totalPay)}
                </p>
              </div>
            </div>

            {isAuthenticated && (
              <p className="mt-3 text-sm text-premium-muted">
                Seu saldo:{" "}
                <span className="font-medium text-premium-text">{formatBRL(balanceNum)}</span>
              </p>
            )}

            {user?.is_admin ? (
              <p className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/25 px-3 py-2 text-xs leading-snug text-amber-200/85">
                <strong>Conta admin:</strong> com saldo suficiente e &quot;Utilizar
                saldo&quot;, os números são reservados e debitados na hora. Com{" "}
                <strong>Pix</strong>, a reserva bloqueia os números até o MP
                confirmar.
              </p>
            ) : null}

            {/* Ocupa a altura disponível na coluna: texto completo, quebra na largura do card */}
            <div className="mt-4 min-h-0 flex-1 flex flex-col justify-start gap-4 border-t border-premium-border pt-4">
              <p className="text-sm leading-relaxed text-premium-muted">
                Ao pagar, os números ficam <strong className="text-premium-text">reservados</strong>{" "}
                para você. Se outro jogador tentar o mesmo, vê que já não está
                disponível.
              </p>
              <p className="text-sm leading-relaxed text-premium-muted">
                <strong className="text-premium-text">Pix</strong>: cobrança Mercado Pago
                pelo total selecionado (QR ou link).{" "}
                <strong className="text-premium-text">Carteira</strong>: apenas se o
                saldo cobrir o valor total.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer gap-3 text-sm leading-snug text-premium-text">
                <input
                  type="radio"
                  name="payment-method"
                  checked={!useBalance}
                  onChange={() => {
                    setUseBalance(false);
                    setPayError(null);
                  }}
                  className="mt-0.5 size-4 shrink-0 accent-[#D4AF37]"
                />
                <span className="text-premium-muted">
                  Pix (Mercado Pago — QR ou link; em testes, use conta comprador MP)
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 text-sm leading-snug text-premium-text">
                <input
                  type="radio"
                  name="payment-method"
                  checked={useBalance}
                  onChange={() => {
                    setUseBalance(true);
                    setPayError(null);
                  }}
                  className="mt-0.5 size-4 shrink-0 accent-[#D4AF37]"
                />
                <span className="inline-flex items-start gap-2 text-premium-muted">
                  <Wallet className="mt-0.5 size-4 shrink-0 text-premium-muted" aria-hidden />
                  Utilizar saldo da carteira
                </span>
              </label>
            </div>

            {useBalance && canPayWithBalanceOnly && totalPay > 0 && (
              <p className="mt-3 text-sm text-premium-accent">
                Saldo cobre o total ({formatBRL(totalPay)}) — débito direto após
                reservar.
              </p>
            )}

            {payError && (
              <p className="mt-2 text-sm text-red-300/90">{payError}</p>
            )}

            <div className="mt-auto shrink-0 pt-4">
              <button
                type="button"
                disabled={!canPay || paying || !isReady}
                onClick={handlePay}
                className="w-full rounded-xl bg-premium-accent py-3 text-center text-base font-bold text-[#0A0A0A] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
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

      {/* Tooltip dos números próprios — fixed para escapar ao overflow-clip da grelha */}
      {mineTooltip && (
        <div
          role="tooltip"
          aria-hidden
          className="pointer-events-none fixed z-[9999] w-max max-w-[11rem] -translate-x-1/2 -translate-y-full rounded-lg border border-premium-border/70 bg-premium-surface/96 px-3 py-2 text-center text-[11px] leading-snug text-premium-text shadow-2xl backdrop-blur-sm"
          style={{ left: mineTooltip.x, top: mineTooltip.y - 8 }}
        >
          <p className="font-semibold text-premium-accent/90">
            {user?.full_name ?? "Você"}
          </p>
          {mineTooltip.label && (
            <p className="mt-0.5 text-[10px] text-premium-muted/80">
              {mineTooltip.label}
            </p>
          )}
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-premium-border/65"
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}
