"use client";

import { Medal, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/http";
import { getRankingMe, getRankingTop } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { RankingCategoryApi, RankingMeOut, RankingPodiumEntryOut } from "@/types/api";

type PodiumSlot = "champion" | "silver" | "bronze" | "honor";

type HallCard = {
  id: string;
  fullName: string;
  initials: string;
  avatarUrl: string;
  gameTitle: string;
  gameCoverUrl: string | null;
  ticket: string;
  winnerStat: string;
  slot: PodiumSlot;
  /** Ordem visual no pódio horizontal: 4º – 2º – 1º – 3º – 5º */
  podiumIndex: number;
  liftClass: string;
  animationDelayMs: number;
};

/** Categorias do ranking — pódio e “Seu status” vêm da API por categoria. */
const RANKING_TABS = [
  { id: "victories" as const, label: "Mais Vitoriosos" },
  { id: "spenders" as const, label: "Top Compradores" },
  { id: "active" as const, label: "Mais Ativos" },
  { id: "hot" as const, label: "Sorte em Alta" },
] as const;

type RankingTabId = (typeof RANKING_TABS)[number]["id"];

const TAB_TO_CATEGORY: Record<RankingTabId, RankingCategoryApi> = {
  victories: "victories",
  spenders: "buyers",
  active: "active",
  hot: "hot",
};

function initialsFromFullName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] ?? "";
    const b = parts[parts.length - 1][0] ?? "";
    return (a + b).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

function rankToLayout(rank: number): Pick<
  HallCard,
  "slot" | "podiumIndex" | "liftClass" | "animationDelayMs"
> {
  switch (rank) {
    case 1:
      return {
        slot: "champion",
        podiumIndex: 2,
        liftClass: "lg:-translate-y-6 xl:-translate-y-8",
        animationDelayMs: 360,
      };
    case 2:
      return {
        slot: "silver",
        podiumIndex: 1,
        liftClass: "lg:-translate-y-1",
        animationDelayMs: 200,
      };
    case 3:
      return {
        slot: "bronze",
        podiumIndex: 3,
        liftClass: "lg:translate-y-1",
        animationDelayMs: 520,
      };
    case 4:
      return {
        slot: "honor",
        podiumIndex: 0,
        liftClass: "lg:translate-y-3",
        animationDelayMs: 80,
      };
    case 5:
      return {
        slot: "honor",
        podiumIndex: 4,
        liftClass: "lg:translate-y-4",
        animationDelayMs: 640,
      };
    default:
      return {
        slot: "honor",
        podiumIndex: 4,
        liftClass: "lg:translate-y-4",
        animationDelayMs: 0,
      };
  }
}

function emptyPodiumSlot(slot: number): HallCard {
  return {
    id: `podium-vago-${slot}`,
    fullName: "Posição aberta",
    initials: "—",
    avatarUrl: "",
    gameTitle: "Participe das rifas",
    gameCoverUrl: null,
    ticket: "—",
    winnerStat: "—",
    ...rankToLayout(slot),
  };
}

function mapPodiumToCard(e: RankingPodiumEntryOut): HallCard {
  const layout = rankToLayout(e.rank);
  const sp = e.spotlight;
  const ticket = sp
    ? `#${String(sp.winning_ticket_number).padStart(4, "0")}`
    : "—";
  return {
    id: e.user_id,
    fullName: e.full_name,
    initials: initialsFromFullName(e.full_name),
    avatarUrl:
      e.avatar_url?.trim() ||
      `https://i.pravatar.cc/320?u=${encodeURIComponent(e.user_id)}`,
    gameTitle: sp?.title ?? "Apex Keys",
    gameCoverUrl: sp?.image_url ?? null,
    ticket,
    winnerStat: e.stat_line,
    ...layout,
  };
}

function mergeRankingTopWithPlaceholders(rows: RankingPodiumEntryOut[]): HallCard[] {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  const merged: HallCard[] = [];
  for (let slot = 1; slot <= 5; slot++) {
    const real = sorted[slot - 1];
    if (real) merged.push(mapPodiumToCard(real));
    else merged.push(emptyPodiumSlot(slot));
  }
  return merged;
}

function UserRankingCard({
  loading,
  error,
  onRetry,
  data,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  data: RankingMeOut | null;
}) {
  const shell =
    "relative z-0 mx-auto w-full max-w-[15.5rem] sm:max-w-[16.25rem]";

  if (loading) {
    return (
      <div className={shell}>
        <div className="rounded-md border border-premium-border/20 bg-premium-surface/30 px-2.5 py-2">
          <div className="h-1.5 w-16 animate-pulse rounded bg-premium-border/30" />
          <div className="mt-2 h-5 w-24 animate-pulse rounded bg-premium-border/25" />
          <div className="mt-1.5 h-2 w-full animate-pulse rounded bg-premium-border/20" />
          <div className="mt-2 h-0.5 animate-pulse rounded-full bg-premium-border/25" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={shell}>
        <div className="rounded-md border border-red-500/20 bg-premium-surface/30 px-2.5 py-2">
          <p className="font-body text-[0.7rem] leading-relaxed text-red-200/85">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 font-body text-[0.7rem] font-semibold text-premium-accent/90 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const fill = Math.min(100, Math.max(0, data.progress_percent));
  const showRank =
    data.authenticated && data.in_ranking && data.rank != null;

  return (
    <div className={shell}>
      <div className="rounded-md border border-premium-border/20 bg-premium-surface/30 px-2.5 py-2">
        <p className="text-center font-heading text-[0.48rem] font-semibold uppercase tracking-[0.2em] text-premium-accent/50">
          SEU STATUS
        </p>

        {showRank ? (
          <div className="mt-1 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5">
            <span className="font-heading text-lg font-bold tabular-nums tracking-tight text-premium-text/90">
              #{data.rank}
            </span>
            {data.metric_display ? (
              <span className="font-body text-[0.65rem] font-medium text-premium-muted/90">
                {data.metric_display}
              </span>
            ) : null}
          </div>
        ) : null}

        {data.authenticated && !data.in_ranking && data.metric_display ? (
          <p className="mt-1 text-center font-body text-[0.65rem] font-medium text-premium-muted/90">
            {data.metric_display}
          </p>
        ) : null}

        <p className="mt-1 text-center font-body text-[0.65rem] leading-snug text-premium-muted/85">
          {data.next_target_label}
        </p>

        {!data.authenticated ? (
          <div className="mt-1.5 text-center">
            <Link
              href="/conta"
              className="font-body text-[0.65rem] font-semibold text-premium-accent/85 hover:text-premium-accent hover:underline"
            >
              Entrar na conta
            </Link>
          </div>
        ) : null}

        <div
          className="mt-1.5 h-0.5 overflow-hidden rounded-full border border-premium-border/20 bg-premium-bg/40"
          role="progressbar"
          aria-valuenow={fill}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso no ranking"
        >
          <div
            className="relative h-full overflow-hidden rounded-full transition-[width] duration-700 ease-in-out"
            style={{ width: `${fill}%` }}
          >
            <div className="h-full w-full rounded-full bg-premium-accent/40" />
            {data.authenticated ? (
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
                aria-hidden
              >
                <div className="absolute inset-y-0 w-[55%] bg-gradient-to-r from-transparent via-amber-200/35 to-transparent apex-hall-progress-shimmer opacity-50" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function RankingTabs({
  activeId,
  onChange,
  disabled,
}: {
  activeId: RankingTabId;
  onChange: (id: RankingTabId) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex w-full max-w-3xl flex-wrap justify-center gap-2 sm:gap-2.5"
      role="tablist"
      aria-label="Categorias do ranking"
    >
      {RANKING_TABS.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(t.id)}
            className={`rounded-xl border px-3.5 py-2.5 font-body text-xs font-semibold transition-all duration-500 ease-in-out sm:px-4 sm:text-[0.8125rem] ${
              active
                ? "border-premium-accent/35 bg-premium-accent/[0.08] text-premium-accent/95 shadow-[0_0_28px_-8px_rgba(212,175,55,0.35)]"
                : "border-premium-border/50 bg-zinc-950/40 text-premium-muted hover:border-premium-border/70 hover:bg-zinc-900/45 hover:text-premium-text"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function PodiumAvatar({
  src,
  initials,
  isChamp,
}: {
  src: string;
  initials: string;
  isChamp: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const noSrc = !src?.trim();

  if (noSrc || failed) {
    return (
      <div
        className={`flex size-full items-center justify-center rounded-full bg-premium-cell font-heading font-bold text-premium-muted ring-2 ring-premium-border ${
          isChamp ? "text-2xl" : "text-xl"
        }`}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL externa ou pravatar fallback
    <img
      src={src}
      alt=""
      width={256}
      height={256}
      onError={() => setFailed(true)}
      className="size-full rounded-full object-cover ring-2 ring-premium-border transition duration-300 group-hover:scale-[1.03]"
    />
  );
}

const slotBadge: Record<
  PodiumSlot,
  { label: string; className: string; icon: LucideIcon }
> = {
  champion: {
    label: "Campeão",
    className:
      "border-amber-600/40 bg-gradient-to-br from-amber-900/35 to-amber-950/25 text-amber-200",
    icon: Trophy,
  },
  silver: {
    label: "2º lugar",
    className: "border-slate-300/35 bg-slate-400/10 text-slate-200",
    icon: Medal,
  },
  bronze: {
    label: "3º lugar",
    className: "border-amber-800/40 bg-amber-950/30 text-amber-100/90",
    icon: Medal,
  },
  honor: {
    label: "Elite",
    className:
      "border-premium-border bg-premium-bg text-premium-muted",
    icon: Medal,
  },
};

function HallSkeleton() {
  return (
    <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-end lg:justify-center lg:gap-3 xl:gap-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-full max-w-md shrink-0 self-center lg:max-w-[13.5rem] lg:self-end xl:max-w-[15rem]"
        >
          <div className="h-[24rem] animate-pulse rounded-2xl border border-premium-border bg-premium-surface lg:min-h-[24rem]" />
        </div>
      ))}
    </div>
  );
}

export function LastWinnersHall() {
  const { isReady, user } = useAuth();
  const [podiumRows, setPodiumRows] = useState<RankingPodiumEntryOut[]>([]);
  const [podiumLoading, setPodiumLoading] = useState(true);
  const [podiumError, setPodiumError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RankingTabId>("victories");
  const [rankingMe, setRankingMe] = useState<RankingMeOut | null>(null);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [rankingError, setRankingError] = useState<string | null>(null);

  const retryRankingMe = useCallback(() => {
    if (!isReady) return;
    setRankingLoading(true);
    setRankingError(null);
    void (async () => {
      try {
        const data = await getRankingMe(
          TAB_TO_CATEGORY[activeTab],
          getAccessToken(),
        );
        setRankingMe(data);
      } catch (e) {
        setRankingMe(null);
        const msg =
          e instanceof ApiError
            ? e.detail ?? e.message
            : e instanceof Error
              ? e.message
              : "Não foi possível carregar o seu ranking.";
        setRankingError(msg);
      } finally {
        setRankingLoading(false);
      }
    })();
  }, [activeTab, isReady]);

  useEffect(() => {
    if (!isReady) return;

    let alive = true;
    setRankingLoading(true);
    setRankingError(null);
    void (async () => {
      try {
        const data = await getRankingMe(
          TAB_TO_CATEGORY[activeTab],
          getAccessToken(),
        );
        if (!alive) return;
        setRankingMe(data);
      } catch (e) {
        if (!alive) return;
        setRankingMe(null);
        const msg =
          e instanceof ApiError
            ? e.detail ?? e.message
            : e instanceof Error
              ? e.message
              : "Não foi possível carregar o seu ranking.";
        setRankingError(msg);
      } finally {
        if (alive) setRankingLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isReady, activeTab, user?.id]);

  const retryPodium = useCallback(() => {
    setPodiumLoading(true);
    setPodiumError(null);
    void getRankingTop(TAB_TO_CATEGORY[activeTab])
      .then((rows) => setPodiumRows(rows))
      .catch((e) => {
        setPodiumRows([]);
        const msg =
          e instanceof ApiError
            ? e.detail ?? e.message
            : e instanceof Error
              ? e.message
              : "Não foi possível carregar o pódio.";
        setPodiumError(msg);
      })
      .finally(() => setPodiumLoading(false));
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    setPodiumLoading(true);
    setPodiumError(null);
    void getRankingTop(TAB_TO_CATEGORY[activeTab])
      .then((rows) => {
        if (!cancelled) setPodiumRows(rows);
      })
      .catch((e) => {
        if (!cancelled) {
          setPodiumRows([]);
          const msg =
            e instanceof ApiError
              ? e.detail ?? e.message
              : e instanceof Error
                ? e.message
                : "Não foi possível carregar o pódio.";
          setPodiumError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setPodiumLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const tabCards = useMemo(
    () => mergeRankingTopWithPlaceholders(podiumRows),
    [podiumRows],
  );

  const displayOrdered = useMemo(
    () =>
      !podiumLoading && !podiumError
        ? [...tabCards].sort((a, b) => a.podiumIndex - b.podiumIndex)
        : [],
    [podiumLoading, podiumError, tabCards],
  );

  const podiumStaggerDelays = useMemo(() => {
    let sideIndex = 0;
    const delays: Record<string, number> = {};
    for (const w of displayOrdered) {
      const isPlaceholder = w.id.startsWith("podium-vago-");
      const isRealChamp = w.slot === "champion" && !isPlaceholder;
      delays[w.id] = isRealChamp ? 0 : 52 + sideIndex++ * 72;
    }
    return delays;
  }, [displayOrdered]);

  const handleTabChange = useCallback((id: RankingTabId) => {
    if (id === activeTab) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    if (!reduceMotion && typeof doc.startViewTransition === "function") {
      doc.startViewTransition(() => {
        flushSync(() => setActiveTab(id));
      });
    } else {
      setActiveTab(id);
    }
  }, [activeTab]);

  return (
    <section
      className="relative mx-auto w-full max-w-[min(100%,120rem)] px-4 pb-24 pt-10 sm:px-6 md:pb-28 md:pt-12 lg:px-10 lg:pt-14 xl:px-12 2xl:px-14 min-[1800px]:px-16 min-[2400px]:px-20"
      aria-labelledby="hall-fama-heading"
    >
      <div className="mx-auto flex w-full max-w-[min(100%,120rem)] flex-col items-center">
        <header className="mx-auto max-w-2xl text-center">
          <p className="font-heading text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-premium-accent/80">
            RANKING DA COMUNIDADE
          </p>
          <h2
            id="hall-fama-heading"
            className="mt-1.5 font-heading text-3xl font-bold leading-tight tracking-tight text-[#EAEAEA] md:text-[2rem] lg:text-[2.125rem]"
          >
            Hall da Fama
          </h2>
          <p className="mx-auto mt-2 max-w-md font-body text-sm leading-relaxed text-premium-muted sm:max-w-lg md:text-[0.9375rem]">
            Acompanhe os destaques da comunidade e veja onde você está em cada
            disputa.
          </p>
        </header>

        <div className="mt-6 flex w-full justify-center sm:mt-7">
          <RankingTabs
            activeId={activeTab}
            onChange={handleTabChange}
            disabled={podiumLoading}
          />
        </div>

        <div className="mt-9 w-full sm:mt-10 lg:mt-11">
          <UserRankingCard
            loading={!isReady || rankingLoading}
            error={rankingError}
            onRetry={retryRankingMe}
            data={rankingMe}
          />
        </div>

        {podiumError ? (
          <div
            className="mx-auto mt-10 max-w-md rounded-lg border border-red-500/30 bg-red-950/35 px-4 py-3 text-center font-body text-sm text-red-200/90 sm:mt-12"
            role="alert"
          >
            <p>{podiumError}</p>
            <button
              type="button"
              onClick={() => retryPodium()}
              className="mt-2 font-semibold text-premium-accent hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        {podiumLoading ? (
          <div className="relative z-0 mt-14 w-full min-w-0 sm:mt-16 lg:mt-[4.5rem]">
            <HallSkeleton />
          </div>
        ) : podiumError ? null : (
          <div className="relative z-0 mt-14 w-full min-w-0 sm:mt-16 lg:mt-[4.5rem]">
            <div className="flex flex-col items-stretch gap-6 pt-2 lg:flex-row lg:items-end lg:justify-center lg:gap-3 xl:gap-5">
                {displayOrdered.map((w) => {
                  const badge = slotBadge[w.slot];
                  const BadgeIcon = badge.icon;
                  const isChamp = w.slot === "champion";
                  const isPlaceholder = w.id.startsWith("podium-vago-");
                  const isRealChamp = isChamp && !isPlaceholder;
                  const enterClass = isRealChamp
                    ? "apex-hall-podium-champ-enter"
                    : "apex-hall-podium-side-enter";
                  const staggerMs = podiumStaggerDelays[w.id] ?? 0;

                  return (
                    <div
                      key={`${activeTab}-${w.id}`}
                      className={`relative w-full max-w-md shrink-0 self-center overflow-visible lg:max-w-[13.5rem] lg:self-end xl:max-w-[15rem] ${w.liftClass} ${isPlaceholder ? "opacity-[0.58] lg:opacity-[0.52]" : ""}`}
                    >
                      {isRealChamp ? (
                        <div
                          className="pointer-events-none absolute left-1/2 top-[42%] z-0 hidden h-[min(32rem,135%)] w-[min(22rem,118%)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.2)_0%,rgba(212,175,55,0.06)_42%,transparent_72%)] blur-2xl apex-hall-champ-spotlight lg:block"
                          aria-hidden
                        />
                      ) : null}
                      <div
                        className={`relative z-10 h-full transform-gpu ${enterClass}`}
                        style={{ animationDelay: `${staggerMs}ms` }}
                      >
                        <article
                          className={`group relative flex h-full flex-col rounded-2xl border p-5 transition-[transform,box-shadow,border-color,ring-color] duration-500 ease-[cubic-bezier(0.42,0,0.2,1)] will-change-transform sm:p-6 ${
                            isPlaceholder
                              ? "border-premium-border/15 bg-zinc-950/50 shadow-none hover:z-[15] hover:scale-[1.01] hover:border-premium-border/30 hover:shadow-md hover:ring-1 hover:ring-premium-border/25"
                              : isChamp
                                ? "border-premium-border bg-premium-surface ring-1 ring-premium-accent/15 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.42),0_0_52px_-14px_rgba(212,175,55,0.2)] hover:z-[15] hover:scale-[1.02] hover:border-premium-accent/25 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.55),0_0_60px_-12px_rgba(212,175,55,0.28)] hover:ring-2 hover:ring-premium-accent/30"
                                : "border-premium-border/80 bg-premium-surface/95 shadow-md hover:z-[15] hover:scale-[1.02] hover:border-premium-accent/20 hover:shadow-lg hover:ring-1 hover:ring-premium-accent/20"
                          } ${
                            isChamp
                              ? "lg:min-h-[28rem] xl:min-h-[30rem]"
                              : "lg:min-h-[24rem] xl:min-h-[25rem]"
                          } `}
                        >
                          <div
                            className={`absolute right-3 top-3 flex items-center gap-1 rounded-full border px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm ${
                              isPlaceholder
                                ? "border-premium-border/25 bg-zinc-900/60 text-premium-muted/70"
                                : badge.className
                            }`}
                          >
                            <BadgeIcon className="size-3" strokeWidth={2} aria-hidden />
                            {badge.label}
                          </div>

                          <div className="mt-6 flex flex-col items-center text-center">
                            <div
                              className={`relative rounded-full border p-0.5 transition duration-300 ease-out ${
                                isPlaceholder
                                  ? "border-premium-border/25 bg-zinc-900/40 size-24 sm:size-[6.5rem]"
                                  : `border-premium-border bg-premium-bg ${
                                      isChamp ? "size-28 sm:size-32" : "size-24 sm:size-28"
                                    }`
                              }`}
                            >
                              <PodiumAvatar
                                src={w.avatarUrl}
                                initials={w.initials}
                                isChamp={isChamp}
                              />
                            </div>

                            <h3
                              className={`mt-5 line-clamp-2 font-heading text-lg font-bold leading-tight tracking-tight sm:text-xl ${
                                isPlaceholder
                                  ? "text-premium-muted/55"
                                  : "text-premium-text"
                              }`}
                            >
                              {w.fullName}
                            </h3>

                            <div
                              className={`mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-body text-xs ${
                                isPlaceholder ? "text-premium-muted/45" : "text-premium-muted"
                              }`}
                            >
                              <span className="font-mono tabular-nums">
                                Ticket {w.ticket}
                              </span>
                              <span
                                className={
                                  isPlaceholder
                                    ? "text-premium-muted/35"
                                    : "text-premium-muted/60"
                                }
                                aria-hidden
                              >
                                ·
                              </span>
                              <span>{w.winnerStat}</span>
                            </div>
                          </div>

                          <div className="mt-5 flex min-h-0 flex-1 flex-col">
                            <div
                              className={`relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border shadow-inner ${
                                isPlaceholder
                                  ? "border-premium-border/15 bg-zinc-950/70"
                                  : "border-premium-border bg-premium-bg"
                              }`}
                            >
                              {w.gameCoverUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={w.gameCoverUrl}
                                  alt=""
                                  className={`size-full object-cover object-center transition duration-500 ${
                                    isPlaceholder
                                      ? "opacity-50 saturate-[0.75]"
                                      : "group-hover:scale-[1.04]"
                                  }`}
                                />
                              ) : null}
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              <p
                                className={`absolute bottom-2 left-2 right-2 font-heading text-sm font-bold leading-snug drop-shadow-md sm:text-base ${
                                  isPlaceholder ? "text-premium-muted/60" : "text-premium-text"
                                }`}
                              >
                                {w.gameTitle}
                              </p>
                            </div>
                            {isChamp && !isPlaceholder ? (
                              <p
                                className="mx-auto mt-auto max-w-[15.5rem] border-t border-amber-500/15 px-1 pt-2.5 text-center font-body text-[10px] font-medium leading-snug tracking-wide text-amber-200/70 sm:max-w-[17rem] sm:text-[11px]"
                                role="note"
                              >
                                Obrigado pela confiança. Parabéns por esta conquista.
                              </p>
                            ) : null}
                          </div>
                        </article>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <p
          className="mx-auto mt-10 max-w-3xl px-2 text-center font-body text-sm leading-relaxed text-premium-muted sm:mt-12 md:text-base"
          role="note"
        >
          À comunidade que compra rifas, compartilha, comenta ou se envolve com o
          nosso projeto de qualquer forma:{" "}
          <span className="text-premium-text/90">
            o nosso muito obrigado.
          </span>{" "}
          Sem vocês, nada disto seria possível.
        </p>
      </div>
    </section>
  );
}
