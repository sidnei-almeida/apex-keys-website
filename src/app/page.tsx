import type { ReactNode } from "react";
import type React from "react";
import { Box, Flame, Gamepad2, Ticket } from "lucide-react";

const SOLD = 75;
const TOTAL = 100;
const PERCENT = Math.round((SOLD / TOTAL) * 100);
const REMAINING = TOTAL - SOLD;

/** Contorno fino + destaque interno + sombra projetada de profundidade */
const edgeSurface =
  "border border-apex-accent/15 shadow-[0_8px_30px_rgb(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.03)]";

const ACTIVE_RAFFLES: Array<{
  id: string;
  title: string;
  priceLabel: string;
  sold: number;
  total: number;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>;
  imageUrl?: string;
}> = [
  {
    id: "1",
    title: "CS2 Prime + AWP Skin",
    priceLabel: "R$ 1,50 / número",
    sold: 30,
    total: 100,
    Icon: Gamepad2,
  },
  {
    id: "2",
    title: "Elden Ring",
    priceLabel: "R$ 2,00 / número",
    sold: 80,
    total: 100,
    Icon: Gamepad2,
  },
  {
    id: "3",
    title: "Pacote 3 Indies",
    priceLabel: "R$ 0,99 / número",
    sold: 15,
    total: 100,
    Icon: Box,
  },
];

function ProgressTrack({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-full border border-white/[0.06] bg-apex-bg shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function ProgressFill({ pct }: { pct: number }) {
  return (
    <div
      className="h-full rounded-full bg-apex-accent/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
      style={{ width: `${pct}%` }}
    />
  );
}

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-md bg-apex-surface/90 px-3 py-1 text-sm font-semibold tracking-wide text-apex-accent/85 ${edgeSurface}`}
            >
              <Flame
                className="size-4 shrink-0 text-apex-accent"
                strokeWidth={2}
                aria-hidden
              />
              SORTEIO EM DESTAQUE
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-apex-text/95 sm:text-4xl lg:text-5xl lg:leading-tight">
              Dead Space Remake - Steam Key
            </h1>
            <p className="max-w-xl text-lg text-apex-text/55">
              Sobreviva ao terror no espaço profundo. Garanta sua chave Steam por
              uma fração do preço.
            </p>
            <div className="flex flex-col gap-2">
              <ProgressTrack className="h-3">
                <ProgressFill pct={PERCENT} />
              </ProgressTrack>
              <div className="flex flex-wrap justify-between gap-2 text-sm text-apex-text/65">
                <span>{PERCENT}% Concluído</span>
                <span>Faltam {REMAINING} números</span>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-apex-accent to-teal-500 px-6 py-4 text-base font-bold text-apex-bg shadow-[0_4px_18px_rgba(0,229,255,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_24px_rgba(0,229,255,0.45)] sm:w-auto sm:px-8"
            >
              <Ticket className="size-5 shrink-0 opacity-95" aria-hidden />
              Garantir Meu Número - R$ 3,00
            </button>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div
              className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-apex-surface ${edgeSurface}`}
            >
              <Gamepad2
                className="size-24 text-apex-accent/50 drop-shadow-[0_0_6px_rgba(0,212,255,0.06)] sm:size-32 md:size-36"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-8 text-3xl font-bold text-apex-text/95">
          Sorteios Ativos
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ACTIVE_RAFFLES.map((raffle) => {
            const pct = Math.round((raffle.sold / raffle.total) * 100);
            const Icon = raffle.Icon;
            return (
              <article
                key={raffle.id}
                className={`group overflow-hidden rounded-xl bg-apex-surface ${edgeSurface} transition-all duration-300 hover:-translate-y-1 hover:border-apex-accent/40 hover:shadow-[0_12px_40px_rgb(0,0,0,0.45),0_0_0_1px_rgba(0,229,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.04)]`}
              >
                <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden border-b border-white/[0.05] bg-apex-bg transition-colors duration-300 group-hover:border-apex-accent/15">
                  {raffle.imageUrl ? (
                    <>
                      {/* Camada de fundo — mesma imagem + desfoque pesado */}
                      <img
                        src={raffle.imageUrl}
                        alt=""
                        aria-hidden
                        className="pointer-events-none absolute inset-0 size-full scale-110 object-cover object-center opacity-30 blur-2xl"
                      />
                      {/* Imagem preenche o container (object-cover para resoluções variadas) */}
                      <img
                        src={raffle.imageUrl}
                        alt={raffle.title}
                        className="relative z-10 size-full object-cover object-center drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)] ring-1 ring-apex-secondary/20"
                      />
                    </>
                  ) : (
                    <Icon
                      className="size-14 text-apex-accent/45 drop-shadow-[0_0_5px_rgba(0,229,255,0.06)] transition-all duration-300 group-hover:text-apex-accent/65 group-hover:drop-shadow-[0_0_10px_rgba(0,229,255,0.15)]"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="truncate text-lg font-bold text-apex-text/95">
                    {raffle.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-apex-success/90">
                    {raffle.priceLabel}
                  </p>
                  <div className="mt-3">
                    <ProgressTrack className="h-2">
                      <ProgressFill pct={pct} />
                    </ProgressTrack>
                  </div>
                  <p className="mt-2 text-sm text-apex-text/50">
                    {raffle.sold}/{raffle.total} vendidos
                  </p>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-lg border border-apex-accent/20 bg-apex-surface py-2.5 text-sm font-semibold text-apex-text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200 hover:border-apex-accent/50 hover:bg-apex-accent/10 hover:text-apex-accent"
                  >
                    Participar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
