"use client";

import { Medal, Trophy, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getHallOfFame } from "@/lib/api/services";
import { ApiError } from "@/lib/api/http";
import type { HallOfFameEntryOut } from "@/types/api";

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

type MockHallBase = Omit<
  HallCard,
  "slot" | "podiumIndex" | "liftClass" | "animationDelayMs"
>;

/**
 * Placeholder por posição no ranking (1 = campeão … 5 = elite).
 * Quando há usuários reais, o 1º ocupa o lugar 1, o 2º o lugar 2, etc.;
 * cada lugar vazio continua com o mock dessa posição (ex.: 1 real → Carlos passa ao 2º lugar).
 */
const MOCK_HALL_BASE_FOR_RANK: readonly MockHallBase[] = [
  {
    id: "mock-hall-rank-1",
    fullName: "Carlos Mendonça",
    initials: "CM",
    avatarUrl: "https://i.pravatar.cc/320?img=12",
    gameTitle: "Elden Ring",
    gameCoverUrl:
      "https://images6.alphacoders.com/137/thumb-1920-1379254.jpg",
    ticket: "#0042",
    winnerStat: "1× Vencedor",
  },
  {
    id: "mock-hall-rank-2",
    fullName: "Ricardo Almeida",
    initials: "RA",
    avatarUrl: "https://i.pravatar.cc/320?img=51",
    gameTitle: "God of War Ragnarök",
    gameCoverUrl:
      "https://images7.alphacoders.com/138/thumb-1920-1387216.jpg",
    ticket: "#0198",
    winnerStat: "1× Vencedor",
  },
  {
    id: "mock-hall-rank-3",
    fullName: "Beatriz Nogueira",
    initials: "BN",
    avatarUrl: "https://i.pravatar.cc/320?img=28",
    gameTitle: "Starfield",
    gameCoverUrl:
      "https://images5.alphacoders.com/138/thumb-1920-1389830.jpg",
    ticket: "#0233",
    winnerStat: "1× Vencedor",
  },
  {
    id: "mock-hall-rank-4",
    fullName: "Mariana Costa",
    initials: "MC",
    avatarUrl: "https://i.pravatar.cc/320?img=45",
    gameTitle: "Hogwarts Legacy",
    gameCoverUrl:
      "https://images3.alphacoders.com/139/thumb-1920-1396444.jpg",
    ticket: "#0561",
    winnerStat: "1× Vencedor",
  },
  {
    id: "mock-hall-rank-5",
    fullName: "João Vieira",
    initials: "JV",
    avatarUrl: "https://i.pravatar.cc/320?img=33",
    gameTitle: "Street Fighter 6",
    gameCoverUrl:
      "https://images6.alphacoders.com/139/thumb-1920-1397239.jpg",
    ticket: "#0088",
    winnerStat: "1× Vencedor",
  },
];

function mockCardForRank(rank: number): HallCard {
  const base = MOCK_HALL_BASE_FOR_RANK[rank - 1];
  return { ...base, ...rankToLayout(rank) };
}

/** 1º humano no 1º lugar, 2º no 2º, …; lugares restantes com mock da mesma posição. */
function mergeApiRowsWithPlaceholders(rows: HallOfFameEntryOut[]): HallCard[] {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  const merged: HallCard[] = [];
  for (let slot = 1; slot <= 5; slot++) {
    const real = sorted[slot - 1];
    if (real) {
      merged.push(
        mapEntryToCard({
          ...real,
          rank: slot,
        }),
      );
    } else {
      merged.push(mockCardForRank(slot));
    }
  }
  return merged;
}

function mapEntryToCard(e: HallOfFameEntryOut): HallCard {
  const layout = rankToLayout(e.rank);
  const avatarUrl =
    e.avatar_url?.trim() ||
    `https://i.pravatar.cc/320?u=${encodeURIComponent(e.user_id)}`;
  const ticket = `#${String(e.spotlight.winning_ticket_number).padStart(4, "0")}`;
  const winnerStat =
    e.wins === 1 ? "1× Vencedor" : `${e.wins}× Vencedor`;
  return {
    id: e.user_id,
    fullName: e.full_name,
    initials: initialsFromFullName(e.full_name),
    avatarUrl,
    gameTitle: e.spotlight.title,
    gameCoverUrl: e.spotlight.image_url,
    ticket,
    winnerStat,
    ...layout,
  };
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

  if (failed) {
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
  const [apiRows, setApiRows] = useState<HallOfFameEntryOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await getHallOfFame();
        if (cancelled) return;
        setApiRows(rows);
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? e.detail ?? e.message
            : e instanceof Error
              ? e.message
              : "Não foi possível carregar o Hall da Fama.";
        setError(msg);
        setApiRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mergedCards = useMemo(
    () => mergeApiRowsWithPlaceholders(apiRows),
    [apiRows],
  );

  const displayOrdered = useMemo(
    () =>
      !loading && !error
        ? [...mergedCards].sort((a, b) => a.podiumIndex - b.podiumIndex)
        : [],
    [loading, error, mergedCards],
  );

  return (
    <section
      className="relative mx-auto w-full max-w-[min(100%,120rem)] px-4 pb-24 pt-10 sm:px-6 md:pb-28 md:pt-12 lg:px-10 lg:pt-14 xl:px-12 2xl:px-14 min-[1800px]:px-16 min-[2400px]:px-20"
      aria-labelledby="hall-fama-heading"
    >
      <div className="mb-10 max-w-2xl">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-premium-muted">
          Ranking de elite
        </p>
        <h2
          id="hall-fama-heading"
          className="mt-2 font-heading text-3xl font-bold tracking-tight text-premium-text md:text-4xl"
        >
          Hall da Fama
        </h2>
        <p className="mt-3 font-body text-sm leading-relaxed text-premium-muted md:text-base">
          Pódium de campeões Apex — cada vitória é sorteada com transparência
          total e entrega de chave comprovada.
        </p>
        {error ? (
          <p
            className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 font-body text-sm text-red-200/90"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      {loading ? (
        <HallSkeleton />
      ) : !error ? (
        <div className="flex flex-col">
          <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-end lg:justify-center lg:gap-3 xl:gap-5">
          {displayOrdered.map((w) => {
            const badge = slotBadge[w.slot];
            const BadgeIcon = badge.icon;
            const isChamp = w.slot === "champion";

            return (
              <div
                key={w.id}
                className={`w-full max-w-md shrink-0 self-center transition-transform duration-300 lg:max-w-[13.5rem] lg:self-end xl:max-w-[15rem] ${w.liftClass}`}
              >
                <div
                  className="apex-podium-enter h-full"
                  style={{
                    animationDelay: `${w.animationDelayMs}ms`,
                  }}
                >
                  <article
                    className={`group relative flex h-full flex-col rounded-2xl border border-premium-border bg-premium-surface p-5 shadow-lg transition-colors duration-300 hover:border-premium-border sm:p-6 ${
                      isChamp
                        ? "lg:min-h-[28rem] xl:min-h-[30rem]"
                        : "lg:min-h-[24rem] xl:min-h-[25rem]"
                    } `}
                  >
                    <div
                      className={`absolute right-3 top-3 flex items-center gap-1 rounded-full border px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm ${badge.className}`}
                    >
                      <BadgeIcon className="size-3" strokeWidth={2} aria-hidden />
                      {badge.label}
                    </div>

                    <div className="mt-6 flex flex-col items-center text-center">
                      <div
                        className={`relative rounded-full border border-premium-border bg-premium-bg p-0.5 transition duration-300 ease-out ${
                          isChamp ? "size-28 sm:size-32" : "size-24 sm:size-28"
                        }`}
                      >
                        <PodiumAvatar
                          src={w.avatarUrl}
                          initials={w.initials}
                          isChamp={isChamp}
                        />
                      </div>

                      <h3 className="mt-5 line-clamp-2 font-heading text-lg font-bold leading-tight tracking-tight text-premium-text sm:text-xl">
                        {w.fullName}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-body text-xs text-premium-muted">
                        <span className="font-mono tabular-nums">
                          Ticket {w.ticket}
                        </span>
                        <span className="text-premium-muted/60" aria-hidden>
                          ·
                        </span>
                        <span>{w.winnerStat}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex min-h-0 flex-1 flex-col">
                      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-premium-border bg-premium-bg shadow-inner">
                        {w.gameCoverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={w.gameCoverUrl}
                            alt=""
                            className="size-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                          />
                        ) : null}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <p className="absolute bottom-2 left-2 right-2 font-heading text-sm font-bold leading-snug text-premium-text drop-shadow-md sm:text-base">
                          {w.gameTitle}
                        </p>
                      </div>
                      {isChamp ? (
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
          <p
            className="mx-auto mt-10 max-w-3xl px-2 text-center font-body text-sm leading-relaxed text-premium-muted md:mt-12 md:text-base"
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
      ) : null}
    </section>
  );
}
