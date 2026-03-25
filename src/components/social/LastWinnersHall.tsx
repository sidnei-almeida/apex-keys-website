"use client";

import { Medal, Trophy, type LucideIcon } from "lucide-react";
import { useState } from "react";

type PodiumSlot = "champion" | "silver" | "bronze" | "honor";

type WinnerMock = {
  id: string;
  fullName: string;
  initials: string;
  avatarUrl: string;
  gameTitle: string;
  gameCoverUrl: string;
  ticket: string;
  winnerStat: string;
  slot: PodiumSlot;
  /** Ordem visual no pódio horizontal: 4º – 2º – 1º – 3º – 5º */
  podiumIndex: number;
  /** Deslocamento vertical final (pódio em camadas) */
  liftClass: string;
  animationDelayMs: number;
};

const WINNERS: WinnerMock[] = [
  {
    id: "w4",
    fullName: "Ana Silveira",
    initials: "AS",
    avatarUrl: "https://i.pravatar.cc/320?img=5",
    gameTitle: "Starfield",
    gameCoverUrl:
      "https://images5.alphacoders.com/138/thumb-1920-1389830.jpg",
    ticket: "#0233",
    winnerStat: "1x Vencedor",
    slot: "honor",
    podiumIndex: 0,
    liftClass: "lg:translate-y-3",
    animationDelayMs: 80,
  },
  {
    id: "w2",
    fullName: "Luiza Ferreira",
    initials: "LF",
    avatarUrl: "https://i.pravatar.cc/320?img=9",
    gameTitle: "God of War Ragnarök",
    gameCoverUrl:
      "https://images7.alphacoders.com/138/thumb-1920-1387216.jpg",
    ticket: "#0198",
    winnerStat: "1x Vencedor",
    slot: "silver",
    podiumIndex: 1,
    liftClass: "lg:-translate-y-1",
    animationDelayMs: 200,
  },
  {
    id: "w1",
    fullName: "Carlos Mendonça",
    initials: "CM",
    avatarUrl: "https://i.pravatar.cc/320?img=12",
    gameTitle: "Elden Ring",
    gameCoverUrl:
      "https://images6.alphacoders.com/137/thumb-1920-1379254.jpg",
    ticket: "#0042",
    winnerStat: "1x Vencedor",
    slot: "champion",
    podiumIndex: 2,
    liftClass: "lg:-translate-y-6 xl:-translate-y-8",
    animationDelayMs: 360,
  },
  {
    id: "w3",
    fullName: "Rafael Torres",
    initials: "RT",
    avatarUrl: "https://i.pravatar.cc/320?img=15",
    gameTitle: "Hogwarts Legacy",
    gameCoverUrl:
      "https://images3.alphacoders.com/139/thumb-1920-1396444.jpg",
    ticket: "#0561",
    winnerStat: "1x Vencedor",
    slot: "bronze",
    podiumIndex: 3,
    liftClass: "lg:translate-y-1",
    animationDelayMs: 520,
  },
  {
    id: "w5",
    fullName: "João Vieira",
    initials: "JV",
    avatarUrl: "https://i.pravatar.cc/320?img=33",
    gameTitle: "Street Fighter 6",
    gameCoverUrl:
      "https://images6.alphacoders.com/139/thumb-1920-1397239.jpg",
    ticket: "#0088",
    winnerStat: "1x Vencedor",
    slot: "honor",
    podiumIndex: 4,
    liftClass: "lg:translate-y-4",
    animationDelayMs: 640,
  },
];

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
        className={`flex size-full items-center justify-center rounded-full bg-gradient-to-br from-apex-surface to-black font-heading font-bold text-apex-accent ring-2 ring-black/50 ${
          isChamp ? "text-2xl" : "text-xl"
        }`}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL externa (mock)
    <img
      src={src}
      alt=""
      width={256}
      height={256}
      onError={() => setFailed(true)}
      className="size-full rounded-full object-cover ring-2 ring-black/50 transition duration-300 group-hover:scale-[1.03] group-hover:ring-apex-accent/30"
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
      "border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-apex-secondary/10 text-amber-200",
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
    className: "border-apex-accent/25 bg-apex-accent/10 text-apex-accent",
    icon: Medal,
  },
};

export function LastWinnersHall() {
  const ordered = [...WINNERS].sort((a, b) => a.podiumIndex - b.podiumIndex);

  return (
    <section
      className="relative mx-auto w-full max-w-[min(100%,120rem)] px-4 pb-24 pt-10 sm:px-6 md:pb-28 md:pt-12 lg:px-10 lg:pt-14 xl:px-12 2xl:px-14 min-[1800px]:px-16 min-[2400px]:px-20"
      aria-labelledby="hall-fama-heading"
    >
      <div className="mb-10 max-w-2xl">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-apex-secondary/90">
          Ranking de elite
        </p>
        <h2
          id="hall-fama-heading"
          className="mt-2 font-heading text-3xl font-bold tracking-tight text-white md:text-4xl"
        >
          Hall da Fama
        </h2>
        <p className="mt-3 font-body text-sm leading-relaxed text-apex-text-muted/85 md:text-base">
          Pódium de campeões Apex — cada vitória é sorteada com transparência
          total e entrega de chave comprovada.
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-end lg:justify-center lg:gap-3 xl:gap-5">
        {ordered.map((w) => {
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
                  className={`group relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:bg-white/[0.08] hover:shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,179,0,0.12)] sm:p-6 ${
                    isChamp
                      ? "ring-1 ring-apex-secondary/20 lg:min-h-[28rem] xl:min-h-[30rem]"
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
                      className={`relative rounded-full border-2 border-apex-secondary/30 bg-apex-surface/50 p-0.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition duration-300 ease-out group-hover:border-apex-accent/50 group-hover:shadow-[0_0_28px_rgba(0,229,255,0.18)] ${
                        isChamp ? "size-28 sm:size-32" : "size-24 sm:size-28"
                      }`}
                    >
                      <PodiumAvatar
                        src={w.avatarUrl}
                        initials={w.initials}
                        isChamp={isChamp}
                      />
                    </div>

                    <h3 className="mt-5 line-clamp-2 font-heading text-lg font-bold leading-tight tracking-tight text-white sm:text-xl">
                      {w.fullName}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-body text-xs text-apex-text-muted">
                      <span className="font-mono tabular-nums text-apex-text-muted/90">
                        Ticket {w.ticket}
                      </span>
                      <span className="text-apex-text-muted/50" aria-hidden>
                        ·
                      </span>
                      <span>{w.winnerStat}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-1 flex-col">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={w.gameCoverUrl}
                        alt=""
                        className="size-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <p className="absolute bottom-2 left-2 right-2 font-heading text-sm font-bold leading-snug text-white drop-shadow-md sm:text-base">
                        {w.gameTitle}
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
