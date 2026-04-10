"use client";

import { useId } from "react";
import { Crosshair, KeyRound, QrCode, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MASCOT_SRC = "/images/sleepingcat.png";

/** Micro-badges — curtos para caber num layout horizontal */
const MICRO_BADGES = ["Seguro", "Instantâneo", "Digital"] as const;

type Step = {
  n: string;
  title: string;
  body: string;
  icon: LucideIcon;
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "Escolha sua rifa",
    body: "Jogo e números no painel — cada cota é única e reservada para você.",
    icon: Crosshair,
  },
  {
    n: "02",
    title: "Pagamento",
    body: "Pix ou saldo Apex Keys. Confirmação na hora na grelha.",
    icon: QrCode,
  },
  {
    n: "03",
    title: "Resgate Steam",
    body: "Sorteio auditável. A chave chega na conta do vencedor.",
    icon: KeyRound,
  },
];

/**
 * Thought bubble premium: bolhas crescentes (cabeça → nuvem) + nuvem principal orgânica num único SVG.
 */
function MascotDreamBubble({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const fillMain = `dream-fill-${uid}`;
  const halo = `dream-halo-${uid}`;
  const glow = `dream-glow-${uid}`;
  const bead = `dream-bead-${uid}`;

  return (
    <div className={className}>
      <div className="relative z-30 w-[min(100%,11.5rem)] drop-shadow-[0_12px_32px_rgba(0,0,0,0.45)] sm:w-[12.25rem] md:w-[11.75rem]">
        <svg
          className="h-auto w-full overflow-visible"
          viewBox="0 0 224 104"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <linearGradient id={fillMain} x1="6%" y1="8%" x2="94%" y2="92%">
              <stop offset="0%" stopColor="rgba(52,52,58,0.48)" />
              <stop offset="42%" stopColor="rgba(26,26,30,0.82)" />
              <stop offset="100%" stopColor="rgba(8,8,10,0.88)" />
            </linearGradient>
            <radialGradient id={bead} cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="rgba(58,58,64,0.9)" />
              <stop offset="100%" stopColor="rgba(20,20,24,0.65)" />
            </radialGradient>
            <radialGradient id={halo} cx="62%" cy="36%" r="58%">
              <stop offset="0%" stopColor="rgba(212,175,55,0.13)" />
              <stop offset="72%" stopColor="rgba(212,175,55,0)" />
            </radialGradient>
            <filter id={glow} x="-14%" y="-14%" width="128%" height="128%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.15" result="b" />
              <feFlood floodColor="rgba(212,175,55,0.2)" result="f" />
              <feComposite in="f" in2="b" operator="in" result="g" />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Cadeia de pensamento: menor junto à cabeça → maior até à nuvem */}
          <circle
            cx="22"
            cy="82"
            r="2.65"
            fill={`url(#${bead})`}
            stroke="rgba(212,175,55,0.18)"
            strokeWidth="0.42"
          />
          <circle
            cx="40"
            cy="66"
            r="4.05"
            fill={`url(#${bead})`}
            stroke="rgba(212,175,55,0.2)"
            strokeWidth="0.48"
            opacity={0.95}
          />
          <circle
            cx="58"
            cy="48"
            r="5.65"
            fill={`url(#${bead})`}
            stroke="rgba(212,175,55,0.22)"
            strokeWidth="0.52"
            opacity={0.93}
          />
          <circle
            cx="78"
            cy="32"
            r="7.15"
            fill={`url(#${bead})`}
            stroke="rgba(212,175,55,0.24)"
            strokeWidth="0.55"
            opacity={0.9}
          />

          <path
            d="M 104 24 C 92 10 100 4 118 8 C 132 0 152 2 168 16 C 188 10 210 28 204 48 C 214 62 200 84 178 86 C 168 96 142 96 124 86 C 108 94 84 88 86 66 C 72 52 86 30 104 24 Z"
            fill={`url(#${halo})`}
            opacity={0.88}
          />
          <path
            d="M 102 26 C 92 14 102 6 120 10 C 134 2 156 6 172 20 C 190 14 208 32 202 50 C 212 64 198 86 176 88 C 166 96 140 94 122 84 C 106 92 84 84 88 64 C 76 50 88 32 102 26 Z"
            fill={`url(#${fillMain})`}
            stroke="rgba(212,175,55,0.28)"
            strokeWidth="0.7"
            filter={`url(#${glow})`}
          />
          <path
            d="M 104 30 C 96 20 104 14 118 16 C 130 10 148 14 160 24 C 174 20 188 34 184 48 C 192 58 182 74 166 76 C 158 82 138 80 124 72 C 112 78 96 72 98 58 C 90 48 98 34 104 30 Z"
            fill="rgba(255,255,255,0.045)"
          />
        </svg>

        <div className="pointer-events-none absolute inset-y-[10%] left-[36%] right-[3%] flex flex-col items-center justify-center text-center [text-shadow:0_1px_14px_rgba(0,0,0,0.58)]">
          <p className="font-heading text-[0.56rem] font-semibold uppercase tracking-[0.28em] text-premium-accent/88 sm:text-[0.58rem]">
            APEX KEYS
          </p>
          <p className="mt-1 font-heading text-[0.88rem] font-semibold leading-none tracking-tight text-zinc-50 sm:text-[0.94rem]">
            3 passos
          </p>
        </div>
      </div>
    </div>
  );
}

export function HomeHowItWorksSection() {
  return (
    <section
      className="relative z-[2] mx-auto w-full max-w-[min(100vw,92rem)] px-4 pt-8 pb-5 sm:px-6 sm:pt-10 sm:pb-6 lg:px-10 lg:pb-7 xl:px-12 2xl:px-16"
      aria-labelledby="como-funciona-heading"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-64 -translate-y-1/2 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(212,175,55,0.05)_0%,transparent_65%)]"
        aria-hidden
      />

      {/*
        Bloco “Jornada do participante”: mascote no FLUXO desta secção (nunca sobre o hero).
        Margem negativa puxa o card para sob as patas — apoio na borda superior do card.
      */}
      <div className="relative isolate overflow-visible">
        <div className="pointer-events-none relative z-30 flex w-full justify-center md:justify-start md:pl-[2%] lg:pl-[1.5%]">
          <div className="relative w-[min(88vw,270px)] sm:w-[min(72vw,280px)] md:w-[248px] lg:w-[258px] xl:w-[266px]">
            <div className="relative mx-auto w-full max-w-[236px] md:mx-0 md:max-w-none">
              <MascotDreamBubble className="absolute -top-[8%] right-[-18%] z-30 sm:-top-[6%] sm:right-[-14%] md:-top-[10%] md:right-[-8%] lg:-top-[8%] lg:right-[-6%]" />

              <div className="relative">
                <div
                  className="pointer-events-none absolute -bottom-1 left-[14%] right-[14%] z-[5] h-2.5 rounded-[100%] bg-black/35 blur-md sm:h-3"
                  aria-hidden
                />
                <img
                  src={MASCOT_SRC}
                  alt="Gato a dormir, mascote da Apex Keys a sonhar com os três passos da plataforma."
                  width={320}
                  height={280}
                  className="relative z-10 mx-auto h-auto w-full max-w-[188px] object-contain object-bottom sm:max-w-[208px] md:max-w-[196px] lg:max-w-[204px] [filter:drop-shadow(0_14px_28px_rgba(0,0,0,0.48))_drop-shadow(0_2px_4px_rgba(0,0,0,0.35))]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative z-10 -mt-[clamp(2.75rem,7vw,3.75rem)] overflow-hidden rounded-2xl border border-premium-border/45 bg-gradient-to-r from-[#131313]/95 via-premium-surface/98 to-[#101010]/95 shadow-[0_20px_60px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.035)] backdrop-blur-[2px] sm:-mt-[clamp(3rem,6.5vw,3.5rem)] lg:rounded-3xl"
        >
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl lg:rounded-3xl"
            aria-hidden
          >
            <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(212,175,55,0.04)_0%,transparent_42%,transparent_58%,rgba(0,229,255,0.03)_100%)]" />
            <div className="absolute -right-20 top-0 size-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)] blur-2xl" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-[min(100%,80rem)] flex-col px-5 pb-8 pt-[clamp(3.25rem,8vw,4.25rem)] sm:px-8 sm:pb-9 sm:pt-10 lg:grid lg:max-w-none lg:grid-cols-[minmax(17.5rem,1.12fr)_minmax(0,1fr)] lg:items-center lg:gap-x-10 lg:gap-y-8 lg:px-12 lg:pb-11 lg:pt-11 xl:grid-cols-[minmax(19rem,1.08fr)_minmax(0,1fr)] xl:gap-x-14 xl:px-14 2xl:px-16">
            {/* Esquerda: copy + badges — mais largura útil, alinhado ao grid dos passos */}
            <div className="flex flex-col justify-center text-center lg:max-w-none lg:pr-2 lg:text-left xl:pr-4">
              <p className="inline-flex items-center justify-center gap-2 font-body text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-premium-muted/65 lg:justify-start">
                <Sparkles className="size-3 text-premium-accent/65" aria-hidden />
                Jornada do participante
              </p>
              <h2
                id="como-funciona-heading"
                className="mt-2 font-heading text-xl font-bold tracking-tight text-premium-text sm:text-2xl lg:text-[1.65rem] lg:leading-snug xl:text-[1.85rem]"
              >
                Como funciona a Apex Keys
              </h2>
              <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-premium-muted/95 sm:max-w-xl lg:mx-0 lg:max-w-[30rem]">
                Do catálogo ao resgate em três etapas — fluxo pensado para ser rápido e
                claro, com o mesmo padrão visual do restante da plataforma.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {MICRO_BADGES.map((label) => (
                  <span
                    key={label}
                    className="inline-flex rounded-full border border-zinc-700/70 bg-zinc-950/50 px-2.5 py-1 font-body text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-zinc-400 transition-colors duration-200 hover:border-zinc-600/80 hover:text-zinc-300"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Direita: 3 mini-cards — mesma altura visual que o bloco esquerdo */}
            <ol className="mt-8 grid min-w-0 grid-cols-1 gap-3.5 sm:mt-9 md:grid-cols-3 md:gap-3.5 lg:mt-0 lg:gap-3.5 xl:gap-4">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.n} className="flex min-h-0 min-w-0">
                    <article className="group flex h-full w-full flex-col rounded-xl border border-premium-border/50 bg-[#111]/90 p-4 shadow-[0_6px_24px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-premium-accent/22 hover:shadow-[0_10px_32px_rgba(0,0,0,0.35),0_0_20px_-8px_rgba(212,175,55,0.06)] sm:p-3.5 md:p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700/75 bg-zinc-950 font-mono text-[0.65rem] font-bold tabular-nums text-premium-accent/80">
                          {step.n}
                        </span>
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-premium-border/35 bg-premium-bg/70 text-premium-accent transition-colors group-hover:border-premium-accent/25">
                          <Icon className="size-4" strokeWidth={1.5} aria-hidden />
                        </div>
                      </div>
                      <h3 className="mt-3 font-heading text-sm font-semibold leading-snug text-premium-text sm:text-[0.8125rem]">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 flex-1 font-body text-[0.75rem] leading-relaxed text-premium-muted/90 sm:text-[0.7rem] md:text-[0.75rem]">
                        {step.body}
                      </p>
                    </article>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
