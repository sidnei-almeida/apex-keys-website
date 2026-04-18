"use client";

import { APEX_BRAND_LOGO_SRC } from "@/lib/apex-brand-logo";
import type { ReactNode } from "react";
import { useId, useState } from "react";

/** Segmento — admin e público (avatar opcional). */
export type RaffleWheelSegment = {
  ticket_number: number;
  full_name: string;
  avatar_url?: string | null;
};

const R = 100;
const CX = 0;
const CY = 0;

/** Rotação longa: arranque suave, zona estável no meio, desaceleração longa e paragem precisa. */
const SPIN_TRANSITION_EASING = "cubic-bezier(0.12, 0.78, 0.08, 1)";

/** Intensidade visual (camadas CSS + SVG); não altera a lógica do sorteio. */
export type WheelVisualEnergy = "idle" | "anticipate" | "active" | "celebrate";

const PARTICLE_COUNT = 10;

/** Fatia cujo centro está alinhado ao ponteiro (topo), para realce durante o giro. */
function sliceIndexAtPointer(rotationDeg: number, n: number): number {
  if (n <= 1) return 0;
  const t = ((rotationDeg % 360) + 360) % 360;
  return Math.min(n - 1, Math.floor((t / 360) * n));
}

function WheelBackdrop() {
  return (
    <>
      <div className="apex-wheel-ambient-layer" aria-hidden />
      <div className="apex-wheel-ambient-layer apex-wheel-ambient-layer--outer" aria-hidden />
      <div className="apex-wheel-particles-host" aria-hidden>
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <span
            key={i}
            className="apex-wheel-particle"
            style={{ ["--w-i" as string]: String(i) }}
          />
        ))}
      </div>
    </>
  );
}

/** Gradientes partilhados: côncavo do disco, bevel por fatia, corpos radiais (sem blur SVG). */
function WheelDepthSvgDefs({ id }: { id: (name: string) => string }) {
  return (
    <>
      <radialGradient id={id("wheel-concave")} gradientUnits="userSpaceOnUse" cx={0} cy={-20} r={R * 1.09}>
        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
        <stop offset="44%" stopColor="rgba(0,0,0,0)" />
        <stop offset="74%" stopColor="rgba(0,0,0,0.11)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.36)" />
      </radialGradient>
      <radialGradient id={id("wheel-well-shade")} gradientUnits="userSpaceOnUse" cx={0} cy={24} r={R * 0.96}>
        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
        <stop offset="50%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.09)" />
      </radialGradient>
      <radialGradient id={id("wheel-apex-softlight")} gradientUnits="userSpaceOnUse" cx={0} cy={-24} r={R * 0.86}>
        <stop offset="0%" stopColor="rgba(255,255,255,0.13)" />
        <stop offset="30%" stopColor="rgba(255,255,255,0.038)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
      <radialGradient id={id("seg-rim-vignette")} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R}>
        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
        <stop offset="60%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.135)" />
      </radialGradient>
      <linearGradient id={id("seg-bevel")} gradientUnits="userSpaceOnUse" x1={0} y1={-92} x2={0} y2={92}>
        <stop offset="0%" stopColor="rgba(255,255,255,0.072)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
      </linearGradient>
      <linearGradient id={id("seg-facet-a")} gradientUnits="userSpaceOnUse" x1={0} y1={-98} x2={0} y2={98}>
        <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
        <stop offset="55%" stopColor="rgba(0,0,0,0.02)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
      </linearGradient>
      <linearGradient id={id("seg-facet-b")} gradientUnits="userSpaceOnUse" x1={0} y1={-98} x2={0} y2={98}>
        <stop offset="0%" stopColor="rgba(255,255,255,0.038)" />
        <stop offset="50%" stopColor="rgba(0,0,0,0.04)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
      </linearGradient>
      <radialGradient id={id("seg-live-a")} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R} fx={0} fy={-30}>
        <stop offset="0%" stopColor="#161616" />
        <stop offset="30%" stopColor="#0d0d0d" />
        <stop offset="66%" stopColor="#040404" />
        <stop offset="100%" stopColor="#000000" />
      </radialGradient>
      <radialGradient id={id("seg-live-b")} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R} fx={6} fy={-22}>
        <stop offset="0%" stopColor="#121212" />
        <stop offset="34%" stopColor="#080808" />
        <stop offset="70%" stopColor="#030303" />
        <stop offset="100%" stopColor="#010101" />
      </radialGradient>
      <radialGradient id={id("seg-live-win")} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R} fx={0} fy={-34}>
        <stop offset="0%" stopColor="#211c12" />
        <stop offset="40%" stopColor="#12100a" />
        <stop offset="100%" stopColor="#040403" />
      </radialGradient>
      <radialGradient id={id("seg-adm-a")} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R} fx={0} fy={-26}>
        <stop offset="0%" stopColor="#181818" />
        <stop offset="34%" stopColor="#0e0e0e" />
        <stop offset="100%" stopColor="#020202" />
      </radialGradient>
      <radialGradient id={id("seg-adm-b")} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R} fx={5} fy={-18}>
        <stop offset="0%" stopColor="#111111" />
        <stop offset="36%" stopColor="#080808" />
        <stop offset="100%" stopColor="#010101" />
      </radialGradient>
      <radialGradient id={id("seg-adm-win")} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R} fx={0} fy={-28}>
        <stop offset="0%" stopColor="#1c1810" />
        <stop offset="44%" stopColor="#0e0c08" />
        <stop offset="100%" stopColor="#050504" />
      </radialGradient>
    </>
  );
}

/** Ouro metálico: anel exterior, bordos das fatias, reflexos (gradientes; sem glow difuso). */
function PremiumMetallicGoldDefs({ id }: { id: (name: string) => string }) {
  return (
    <>
      <linearGradient id={id("rim-gold-live")} gradientUnits="userSpaceOnUse" x1={-118} y1={-118} x2={118} y2={118}>
        <stop offset="0%" stopColor="#161208" />
        <stop offset="22%" stopColor="#5c4a1c" />
        <stop offset="38%" stopColor="#c4a038" />
        <stop offset="48%" stopColor="#f4f2ec" />
        <stop offset="58%" stopColor="#b89228" />
        <stop offset="78%" stopColor="#4a3814" />
        <stop offset="100%" stopColor="#0e0c06" />
      </linearGradient>
      <linearGradient id={id("rim-gold-admin")} gradientUnits="userSpaceOnUse" x1={-120} y1={-112} x2={116} y2={120}>
        <stop offset="0%" stopColor="#1a160c" />
        <stop offset="24%" stopColor="#665220" />
        <stop offset="40%" stopColor="#d4a82a" />
        <stop offset="50%" stopColor="#f6f4f0" />
        <stop offset="60%" stopColor="#c9a030" />
        <stop offset="82%" stopColor="#524018" />
        <stop offset="100%" stopColor="#100e08" />
      </linearGradient>
      <linearGradient id={id("slice-edge-live")} gradientUnits="userSpaceOnUse" x1={-108} y1={-108} x2={108} y2={108}>
        <stop offset="0%" stopColor="#1c1608" />
        <stop offset="28%" stopColor="#8a7028" />
        <stop offset="42%" stopColor="#f0ece6" />
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="58%" stopColor="#c4a028" />
        <stop offset="76%" stopColor="#403010" />
        <stop offset="100%" stopColor="#0c0a06" />
      </linearGradient>
      <linearGradient id={id("slice-edge-admin")} gradientUnits="userSpaceOnUse" x1={-108} y1={-116} x2={112} y2={104}>
        <stop offset="0%" stopColor="#20180c" />
        <stop offset="26%" stopColor="#96782c" />
        <stop offset="42%" stopColor="#ece8e2" />
        <stop offset="50%" stopColor="#faf8f4" />
        <stop offset="58%" stopColor="#c49828" />
        <stop offset="76%" stopColor="#483818" />
        <stop offset="100%" stopColor="#0e0c08" />
      </linearGradient>
      <linearGradient id={id("rim-inner-hilight")} gradientUnits="userSpaceOnUse" x1={0} y1={-122} x2={0} y2={122}>
        <stop offset="0%" stopColor="rgba(255,252,248,0.55)" />
        <stop offset="22%" stopColor="rgba(210,178,72,0.32)" />
        <stop offset="55%" stopColor="rgba(90,74,36,0.18)" />
        <stop offset="100%" stopColor="rgba(24,20,10,0.22)" />
      </linearGradient>
      <linearGradient id={id("rim-hairline")} gradientUnits="userSpaceOnUse" x1={-118} y1={-100} x2={118} y2={104}>
        <stop offset="0%" stopColor="rgba(70,56,28,0.5)" />
        <stop offset="36%" stopColor="rgba(248,242,230,0.72)" />
        <stop offset="52%" stopColor="rgba(200,172,72,0.58)" />
        <stop offset="100%" stopColor="rgba(48,38,18,0.48)" />
      </linearGradient>
    </>
  );
}

function slicePath(i: number, n: number, r: number): string {
  if (n <= 0) return "";
  if (n === 1) {
    return `M ${CX} ${CY} m 0 -${r} A ${r} ${r} 0 1 1 0.01 -${r} Z`;
  }
  const a0 = (i / n) * 2 * Math.PI;
  const a1 = ((i + 1) / n) * 2 * Math.PI;
  const x0 = CX + r * Math.sin(a0);
  const y0 = CY - r * Math.cos(a0);
  const x1 = CX + r * Math.sin(a1);
  const y1 = CY - r * Math.cos(a1);
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${CX} ${CY} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`;
}

function shortLabel(seg: RaffleWheelSegment, n: number): string {
  const num = String(seg.ticket_number);
  if (n > 80) return num;
  const name = seg.full_name.trim().split(/\s+/)[0] ?? "";
  const short = name.length > 8 ? `${name.slice(0, 7)}…` : name;
  return short ? `${num} · ${short}` : num;
}

/** Número na fatia live: sem "#", sempre pelo menos 2 caracteres (01, 07, 10, 123). */
function formatSliceTicketNumber(n: number): string {
  return String(n).padStart(2, "0");
}

/** Coroa dourada — centro da roleta live. */
function SvgCrownGold({ gradId }: { gradId: string }) {
  return (
    <g transform="translate(0,-0.5)">
      <path
        d="M-12 6.5 Q0 9.5 12 6.5 L12 3.5 L-12 3.5 Z"
        fill={`url(#${gradId})`}
        stroke="rgba(220,210,198,0.36)"
        strokeWidth={0.22}
      />
      <path
        d="M-12 3.5 L-8.5 -7 L-5 1 L0 -9 L5 1 L8.5 -7 L12 3.5 Z"
        fill={`url(#${gradId})`}
        stroke="rgba(255,252,232,0.44)"
        strokeWidth={0.3}
        strokeLinejoin="round"
      />
      <ellipse cx={0} cy={7.45} rx={9.85} ry={1.82} fill="rgba(0,0,0,0.38)" />
    </g>
  );
}

function LiveBezelDefs({ id }: { id: (name: string) => string }) {
  return (
    <linearGradient id={id("bezel-ring")} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="rgba(48,40,22,0.55)" />
      <stop offset="28%" stopColor="rgba(158,132,52,0.78)" />
      <stop offset="48%" stopColor="rgba(228,224,216,0.9)" />
      <stop offset="62%" stopColor="rgba(184,152,58,0.82)" />
      <stop offset="100%" stopColor="rgba(40,34,16,0.5)" />
    </linearGradient>
  );
}

/** Anel interior discreto (referência visual, sem decoração extra). */
function LiveWheelFixedBezel({ id }: { id: (name: string) => string }) {
  return (
    <g style={{ pointerEvents: "none" }} aria-hidden>
      <circle
        r={49.65}
        fill="none"
        stroke={`url(#${id("bezel-ring")})`}
        strokeWidth={0.42}
        opacity={0.87}
      />
    </g>
  );
}

function WheelPointer({ variant }: { variant: "admin" | "live" }) {
  const pid = useId().replace(/:/g, "");
  const fid = `wheel-ptr-${pid}`;

  if (variant === "admin") {
    return (
      <svg width={48} height={56} viewBox="0 0 48 56" aria-hidden>
        <defs>
          <linearGradient id={`${fid}-metal`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="8%" stopColor="#e8e4dc" />
            <stop offset="22%" stopColor="#e0c058" />
            <stop offset="48%" stopColor="#b88810" />
            <stop offset="100%" stopColor="#301808" />
          </linearGradient>
        </defs>
        <path d="M24 1.35 L42.55 39.55 L24 52.5 L5.45 39.55 Z" fill="rgba(0,0,0,0.4)" />
        <path
          d="M24 0.25 L42.5 39.15 L24 52 L5.5 39.15 Z"
          fill={`url(#${fid}-metal)`}
          stroke="rgba(255,252,240,0.98)"
          strokeWidth={1.06}
          strokeLinejoin="miter"
          strokeMiterlimit={16}
        />
        <path d="M24 5.35 L37.05 37.3 L24 44.95 L10.95 37.3 Z" fill="rgba(0,0,0,0.24)" />
        <circle cx={24} cy={20.15} r={4.95} fill="#060606" stroke="rgba(210,175,55,0.98)" strokeWidth={0.98} />
        <circle cx={24} cy={20.85} r={1.92} fill="#f4f2ec" />
      </svg>
    );
  }

  return (
    <svg width={50} height={58} viewBox="0 0 50 58" aria-hidden>
        <defs>
        <linearGradient id={`${fid}-live`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="7%" stopColor="#eee6d4" />
          <stop offset="20%" stopColor="#e8c048" />
          <stop offset="46%" stopColor="#c09008" />
          <stop offset="100%" stopColor="#381804" />
        </linearGradient>
      </defs>
      <path d="M25 1.4 L44.65 40.45 L25 54.55 L5.35 40.45 Z" fill="rgba(0,0,0,0.42)" />
      <path
        d="M25 0.2 L44.4 39.95 L25 54.25 L5.6 39.95 Z"
        fill={`url(#${fid}-live)`}
        stroke="rgba(255,252,248,0.98)"
        strokeWidth={1.1}
        strokeLinejoin="miter"
        strokeMiterlimit={16}
      />
      <path d="M25 5.75 L38.05 37.55 L25 45.75 L11.95 37.55 Z" fill="rgba(0,0,0,0.24)" />
      <circle cx={25} cy={20.55} r={5.05} fill="#050505" stroke="rgba(212,178,58,1)" strokeWidth={1} />
      <circle cx={25} cy={21.2} r={2} fill="#f2f0ea" />
    </svg>
  );
}

function LiveWheelHub({ energy }: { energy: WheelVisualEnergy }) {
  const uid = useId().replace(/:/g, "");
  const gid = `hub-crown-grad-${uid}`;
  const [failed, setFailed] = useState(false);
  const pulseHub =
    energy === "anticipate" || energy === "active"
      ? "motion-safe:animate-[pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none"
      : "";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center"
      aria-hidden
    >
      <div
        className={`relative flex aspect-square w-[min(36%,12rem)] min-w-[7rem] items-center justify-center overflow-hidden rounded-full border-[1.5px] border-[rgba(205,172,78,0.88)] bg-[radial-gradient(circle_at_50%_22%,#303030_0%,#101010_38%,#010101_100%)] shadow-[0_0_0_1px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-16px_30px_rgba(0,0,0,0.78),inset_0_0_0_1px_rgba(195,165,70,0.18),0_0_22px_rgba(175,145,58,0.14)] ring-1 ring-black/92 ${pulseHub}`}
      >
        <svg
          viewBox="-18 -18 36 36"
          className="relative z-[1] h-[72%] w-[72%] overflow-visible"
        >
          <defs>
            <linearGradient id={gid} x1="8%" y1="0%" x2="92%" y2="100%">
              <stop offset="0%" stopColor="#fffef8" />
              <stop offset="12%" stopColor="#f2e088" />
              <stop offset="32%" stopColor="#d8a010" />
              <stop offset="52%" stopColor="#a07008" />
              <stop offset="78%" stopColor="#4a2808" />
              <stop offset="100%" stopColor="#140804" />
            </linearGradient>
          </defs>
          <circle
            cx={0}
            cy={0}
            r={15.75}
            fill="none"
            stroke="rgba(188,155,58,0.45)"
            strokeWidth={0.42}
          />
          <circle
            cx={0}
            cy={0}
            r={15.25}
            fill="none"
            stroke="rgba(0,0,0,0.42)"
            strokeWidth={0.3}
          />
          <circle
            cx={0}
            cy={0}
            r={14.78}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.22}
          />
          <SvgCrownGold gradId={gid} />
        </svg>
        {!failed ? (
          // eslint-disable-next-line @next/next/no-img-element -- asset local da marca (discreto sob a coroa)
          <img
            src={APEX_BRAND_LOGO_SRC}
            alt=""
            className="absolute bottom-[14%] left-1/2 z-[2] h-[18%] w-[18%] -translate-x-1/2 object-contain opacity-[0.22] grayscale"
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
    </div>
  );
}

/** Conteúdo das fatias no modo live (baixa vs alta densidade). */
function LiveSliceDecorations({
  segments,
  highlightTicketNumber,
  emphasizeWinner,
}: {
  segments: RaffleWheelSegment[];
  highlightTicketNumber?: number | null;
  emphasizeWinner?: boolean;
}) {
  const n = segments.length;
  if (n <= 1) return null;

  const lowDensity = n <= 20;
  const winnerIdx =
    highlightTicketNumber != null
      ? segments.findIndex((s) => s.ticket_number === highlightTicketNumber)
      : -1;
  const winnerGlow =
    emphasizeWinner && winnerIdx >= 0
      ? {
          fill: "#fff8e8",
        }
      : null;

  return (
    <>
      {segments.map((seg, i) => {
        const mid = (i + 0.5) / n;
        const ang = mid * 2 * Math.PI;
        const rotDeg = (mid * 360 + 180) % 360;
        const isWinnerSlice = emphasizeWinner && winnerIdx === i;

        if (lowDensity) {
          const labelFill = "#ffffff";
          const rNum = R * 0.522;
          const nx = rNum * Math.sin(ang);
          const ny = -rNum * Math.cos(ang);
          const fsLow = n <= 8 ? 8.55 : n <= 14 ? 7.38 : 6.58;

          return (
            <g key={`live-low-${seg.ticket_number}-${i}`}>
              <g transform={`translate(${nx},${ny}) rotate(${rotDeg})`}>
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isWinnerSlice && winnerGlow ? winnerGlow.fill : labelFill}
                  fontSize={fsLow}
                  fontWeight={isWinnerSlice ? 700 : 600}
                  fontFamily="var(--font-body), system-ui, sans-serif"
                  letterSpacing={isWinnerSlice ? "0.04em" : "0.02em"}
                  style={{
                    paintOrder: "stroke fill",
                    stroke: "rgba(0,0,0,0.68)",
                    strokeWidth: 0.4,
                    textRendering: "geometricPrecision",
                  }}
                >
                  {formatSliceTicketNumber(seg.ticket_number)}
                </text>
              </g>
            </g>
          );
        }

        const textFill = "#ffffff";
        const rOut = R * 0.922;
        const tx = rOut * Math.sin(ang);
        const ty = -rOut * Math.cos(ang);
        const fs =
          n > 160 ? 3.62 : n > 120 ? 3.92 : n > 80 ? 4.55 : n > 50 ? 5.32 : 5.9;

        return (
          <g key={`live-hi-${seg.ticket_number}-${i}`}>
            <g transform={`translate(${tx},${ty}) rotate(${rotDeg})`}>
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isWinnerSlice && winnerGlow ? winnerGlow.fill : textFill}
                fontSize={fs}
                fontWeight={isWinnerSlice ? 800 : 700}
                fontFamily="var(--font-mono), ui-monospace, monospace"
                letterSpacing="0.03em"
                style={{
                  paintOrder: "stroke fill",
                  stroke: "rgba(0,0,0,0.7)",
                  strokeWidth: 0.32,
                  textRendering: "geometricPrecision",
                }}
              >
                {formatSliceTicketNumber(seg.ticket_number)}
              </text>
            </g>
          </g>
        );
      })}
    </>
  );
}

type Props = {
  segments: RaffleWheelSegment[];
  rotationDeg: number;
  transitionMs: number;
  transitionEnabled: boolean;
  variant?: "admin" | "live";
  maxWidthClassName?: string;
  /** Bilhete vencedor: realça a fatia e rótulos quando `emphasizeWinner` está ativo. */
  highlightTicketNumber?: number | null;
  /** Escala suave + ênfase na fatia vencedora (ex.: fase celebration/done). */
  emphasizeWinner?: boolean;
  /** Energia visual: idle / antecipação / giro / resultado (modo live). */
  visualEnergy?: WheelVisualEnergy;
};

export function RaffleWheelSvg({
  segments,
  rotationDeg,
  transitionMs,
  transitionEnabled,
  variant = "admin",
  maxWidthClassName,
  highlightTicketNumber = null,
  emphasizeWinner = false,
  visualEnergy = "idle",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;

  const n = segments.length;
  const isLive = variant === "live";
  const showAdminLabels = !isLive;

  const fontSize = n > 120 ? 5.78 : n > 60 ? 7.25 : n > 30 ? 8.75 : 10.65;
  const labelR = n > 120 ? 62.5 : 59.15;

  const winnerIdx =
    highlightTicketNumber != null
      ? segments.findIndex((s) => s.ticket_number === highlightTicketNumber)
      : -1;
  const showWinnerSlice = emphasizeWinner && winnerIdx >= 0;
  const sliceNearPointer =
    isLive && visualEnergy === "active" && n > 1
      ? sliceIndexAtPointer(rotationDeg, n)
      : -1;

  const wrapSpinning = (inner: ReactNode) => (
    <g filter={isLive ? "none" : `url(#${id("wh-sh")})`}>
      <g
        style={{
          transform: `rotate(${rotationDeg}deg)`,
          transformOrigin: "0px 0px",
          transition: transitionEnabled
            ? `transform ${transitionMs}ms ${SPIN_TRANSITION_EASING}`
            : "none",
        }}
      >
        {inner}
      </g>
    </g>
  );

  const outerMax =
    maxWidthClassName?.trim() ||
    (isLive
      ? "w-full max-w-[min(100vw-0.5rem,80rem)]"
      : "max-w-[min(100vw-2rem,28rem)]");

  const celebrateVisual = emphasizeWinner || visualEnergy === "celebrate";
  const shellClass =
    `apex-wheel-shell relative mx-auto transition-transform duration-[780ms] motion-safe:ease-[cubic-bezier(0.25,0.85,0.35,1)] ${outerMax} ` +
    (isLive ? "apex-wheel-shell--live " : "") +
    (celebrateVisual
      ? "motion-safe:scale-[1.035] apex-wheel-shell--celebrate-motion"
      : "scale-100") +
    " motion-reduce:scale-100 motion-reduce:transition-none";

  if (n === 1) {
    const seg = segments[0]!;
    const lowSingle = isLive;
    const singleWinner =
      showWinnerSlice && seg.ticket_number === highlightTicketNumber;

    return (
      <div
        className={shellClass}
        data-apex-wheel-energy={isLive ? visualEnergy : "idle"}
      >
        {isLive ? <WheelBackdrop /> : null}
        <div
          className={`pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 ${isLive ? "-translate-y-1" : "-translate-y-[3px]"}`}
          aria-hidden
          style={{
            filter:
              "drop-shadow(0 2px 1px rgba(0,0,0,0.52)) drop-shadow(0 3px 0 rgba(0,0,0,0.2))",
          }}
        >
          <WheelPointer variant={isLive ? "live" : "admin"} />
        </div>
        <svg
          viewBox="-120 -120 240 240"
          className="relative z-[4] aspect-square w-full overflow-visible"
          role="img"
          aria-label="Roleta com 1 bilhete pago"
        >
          <defs>
            <radialGradient id={id("hub-s")} cx="32%" cy="23%" r="62%">
              <stop offset="0%" stopColor="rgba(255,252,236,0.82)" />
              <stop offset="10%" stopColor="rgba(228,192,72,0.62)" />
              <stop offset="28%" stopColor="rgba(32,28,14,0.96)" />
              <stop offset="100%" stopColor="rgba(0,0,0,1)" />
            </radialGradient>
            <PremiumMetallicGoldDefs id={id} />
            <radialGradient id={id("face-1")} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R} fx={0} fy={-26}>
              <stop
                offset="0%"
                stopColor={isLive ? "#1e1e1e" : "rgba(228,200,108,0.18)"}
              />
              <stop offset="38%" stopColor={isLive ? "#121212" : "rgba(26,22,14,0.68)"} />
              <stop
                offset="58%"
                stopColor={isLive ? "#0a0a0a" : "rgba(22,20,14,0.82)"}
              />
              <stop offset="100%" stopColor={isLive ? "#010101" : "rgba(5,5,5,0.99)"} />
            </radialGradient>
            <WheelDepthSvgDefs id={id} />
            <filter id={id("wh-sh")} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.35" />
            </filter>
            {lowSingle ? <LiveBezelDefs id={id} /> : null}
          </defs>
          {wrapSpinning(
            <>
              <circle
                r={R}
                fill={`url(#${id("face-1")})`}
                stroke={`url(#${isLive ? id("slice-edge-live") : id("slice-edge-admin")})`}
                strokeWidth={isLive ? 0.36 : 0.88}
              />
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill={`url(#${id("wheel-apex-softlight")})`}
                opacity={0.4}
                style={{ mixBlendMode: "screen", pointerEvents: "none" }}
              />
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill={`url(#${id("wheel-well-shade")})`}
                opacity={0.58}
                style={{ mixBlendMode: "multiply", pointerEvents: "none" }}
              />
              <circle
                r={R}
                fill={`url(#${id("wheel-concave")})`}
                opacity={0.68}
                style={{ mixBlendMode: "multiply", pointerEvents: "none" }}
              />
              {singleWinner ? (
                <circle r={R} fill="rgba(212,175,55,0.1)" />
              ) : null}
              {showAdminLabels ? (
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  y={-52}
                  fill="#f4f4f4"
                  fontSize={12}
                  fontWeight={700}
                  fontFamily="var(--font-body), system-ui, sans-serif"
                  letterSpacing="0.02em"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.92)" }}
                >
                  {shortLabel(seg, 1)}
                </text>
              ) : null}
              {lowSingle ? (
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  y={-48}
                  fill={singleWinner ? "#fff8e8" : "#ffffff"}
                  fontSize={9.75}
                  fontWeight={600}
                  fontFamily="var(--font-body), system-ui, sans-serif"
                  style={{
                    paintOrder: "stroke fill",
                    stroke: "rgba(0,0,0,0.65)",
                    strokeWidth: 0.44,
                    textRendering: "geometricPrecision",
                  }}
                >
                  {formatSliceTicketNumber(seg.ticket_number)}
                </text>
              ) : null}
            </>,
          )}
          {isLive ? <LiveWheelFixedBezel id={id} /> : null}
          <circle
            r={R + 4.52}
            fill="none"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={0.44}
            opacity={0.48}
          />
          <circle
            r={R + 4.08}
            fill="none"
            stroke="rgba(0,0,0,0.38)"
            strokeWidth={0.3}
            opacity={0.55}
          />
          <circle
            r={R + 4.18}
            fill="none"
            stroke={`url(#${isLive ? id("rim-gold-live") : id("rim-gold-admin")})`}
            strokeWidth={1.16}
            opacity={0.97}
          />
          <circle
            r={R + 4.28}
            fill="none"
            stroke={`url(#${id("rim-hairline")})`}
            strokeWidth={0.11}
            opacity={0.55}
          />
          <circle
            r={R + 4.36}
            fill="none"
            stroke={`url(#${id("rim-hairline")})`}
            strokeWidth={0.16}
            opacity={0.86}
          />
          <circle
            r={R + 3.76}
            fill="none"
            stroke={`url(#${id("rim-inner-hilight")})`}
            strokeWidth={0.24}
            opacity={0.9}
          />
          <circle
            r={R + 0.38}
            fill="none"
            stroke={`url(#${isLive ? id("slice-edge-live") : id("slice-edge-admin")})`}
            strokeWidth={0.32}
            opacity={0.88}
          />
          {!isLive ? (
            <>
              <circle
                r={24.05}
                fill={`url(#${id("hub-s")})`}
                stroke={`url(#${id("slice-edge-admin")})`}
                strokeWidth={1.56}
              />
              <circle
                r={22.58}
                fill="none"
                stroke="rgba(190,158,58,0.42)"
                strokeWidth={0.36}
              />
              <circle
                r={22.12}
                fill="none"
                stroke="rgba(0,0,0,0.45)"
                strokeWidth={0.28}
              />
              <circle
                r={24.05}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.88}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#e9ca4e"
                fontSize={11.4}
                fontWeight={700}
                fontFamily="var(--font-heading), system-ui, sans-serif"
                letterSpacing="0.13em"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}
              >
                APEX
              </text>
            </>
          ) : null}
        </svg>
        {isLive ? <LiveWheelHub energy={visualEnergy} /> : null}
      </div>
    );
  }

  if (n === 0) {
    return (
      <div className="flex aspect-square w-full max-w-md items-center justify-center rounded-full border border-dashed border-premium-border/50 bg-premium-surface/50 text-sm text-premium-muted">
        Sem segmentos
      </div>
    );
  }

  return (
    <div
      className={shellClass}
      data-apex-wheel-energy={isLive ? visualEnergy : "idle"}
    >
      {isLive ? <WheelBackdrop /> : null}
      <div
        className={`pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 ${isLive ? "-translate-y-1" : "-translate-y-[3px]"}`}
        aria-hidden
        style={{
          filter:
            "drop-shadow(0 2px 1px rgba(0,0,0,0.52)) drop-shadow(0 3px 0 rgba(0,0,0,0.2))",
        }}
      >
        <WheelPointer variant={isLive ? "live" : "admin"} />
      </div>

      <svg
        viewBox="-120 -120 240 240"
        className="relative z-[4] aspect-square w-full overflow-visible"
        role="img"
        aria-label={`Roleta com ${n} bilhetes pagos`}
      >
        <defs>
          <radialGradient id={id("hub")} cx="32%" cy="23%" r="62%">
            <stop offset="0%" stopColor="rgba(255,252,236,0.82)" />
            <stop offset="10%" stopColor="rgba(228,192,72,0.62)" />
            <stop offset="28%" stopColor="rgba(32,28,14,0.96)" />
            <stop offset="100%" stopColor="rgba(0,0,0,1)" />
          </radialGradient>
          <PremiumMetallicGoldDefs id={id} />
          <filter id={id("wh-sh")} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.35" />
          </filter>
          {isLive ? <LiveBezelDefs id={id} /> : null}
          <WheelDepthSvgDefs id={id} />
        </defs>

        {wrapSpinning(
          <>
            {segments.map((seg, i) => {
              const isWinner = showWinnerSlice && winnerIdx === i;
              const nearPointer = !isWinner && i === sliceNearPointer;
              const fill = isWinner
                ? isLive
                  ? `url(#${id("seg-live-win")})`
                  : `url(#${id("seg-adm-win")})`
                : isLive
                  ? i % 2 === 0
                    ? `url(#${id("seg-live-a")})`
                    : `url(#${id("seg-live-b")})`
                  : i % 2 === 0
                    ? `url(#${id("seg-adm-a")})`
                    : `url(#${id("seg-adm-b")})`;
              const edgeGrad = isLive ? id("slice-edge-live") : id("slice-edge-admin");
              const goldStroke = `url(#${edgeGrad})`;
              const sw = n > 200 ? 0.235 : 0.285;
              const d = slicePath(i, n, R);
              const winBurst = celebrateVisual && isWinner;
              const facetId = i % 2 === 0 ? id("seg-facet-a") : id("seg-facet-b");

              return (
                <g key={`slice-${seg.ticket_number}-${i}`}>
                  <path
                    d={d}
                    fill={fill}
                    stroke={goldStroke}
                    strokeWidth={sw}
                    strokeLinejoin="miter"
                  />
                  <path
                    d={d}
                    fill={`url(#${id("seg-bevel")})`}
                    opacity={isWinner ? 0.34 : 0.4}
                    style={{ mixBlendMode: "multiply", pointerEvents: "none" }}
                  />
                  <path
                    d={d}
                    fill={`url(#${id("seg-rim-vignette")})`}
                    opacity={0.46}
                    style={{ mixBlendMode: "multiply", pointerEvents: "none" }}
                  />
                  <path
                    d={d}
                    fill={`url(#${facetId})`}
                    opacity={0.5}
                    style={{ mixBlendMode: "multiply", pointerEvents: "none" }}
                  />
                  {nearPointer ? (
                    <path
                      d={d}
                      fill="rgba(220,188,92,0.12)"
                      stroke={`url(#${edgeGrad})`}
                      strokeWidth={0.32}
                      style={{ pointerEvents: "none" }}
                    />
                  ) : null}
                  {isWinner ? (
                    <path
                      d={d}
                      fill={winBurst ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.1)"}
                      stroke={`url(#${edgeGrad})`}
                      strokeWidth={0.36}
                      style={{ pointerEvents: "none" }}
                    />
                  ) : null}
                </g>
              );
            })}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill={`url(#${id("wheel-apex-softlight")})`}
              opacity={0.4}
              style={{ mixBlendMode: "screen", pointerEvents: "none" }}
            />
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill={`url(#${id("wheel-well-shade")})`}
              opacity={0.58}
              style={{ mixBlendMode: "multiply", pointerEvents: "none" }}
            />
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill={`url(#${id("wheel-concave")})`}
              opacity={0.68}
              style={{ mixBlendMode: "multiply", pointerEvents: "none" }}
            />
            {n > 1
              ? segments.map((_, i) => {
                  const a = (i / n) * 2 * Math.PI;
                  const x = R * Math.sin(a);
                  const y = -R * Math.cos(a);
                  return (
                    <line
                      key={`sep-${i}`}
                      x1={CX}
                      y1={CY}
                      x2={x}
                      y2={y}
                      stroke={`url(#${isLive ? id("slice-edge-live") : id("slice-edge-admin")})`}
                      strokeWidth={n > 200 ? 0.235 : 0.295}
                      strokeLinecap="butt"
                    />
                  );
                })
              : null}
            {showAdminLabels
              ? segments.map((seg, i) => {
                  const isWinner = showWinnerSlice && winnerIdx === i;
                  const mid = (i + 0.5) / n;
                  const ang = mid * 2 * Math.PI;
                  const tx = labelR * Math.sin(ang);
                  const ty = -labelR * Math.cos(ang);
                  const rotDeg = (mid * 360 + 180) % 360;
                  return (
                    <g
                      key={`slice-lbl-${seg.ticket_number}-${i}`}
                      transform={`translate(${tx},${ty}) rotate(${rotDeg})`}
                    >
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={isWinner ? "#fff8e8" : "#fafafa"}
                        fontSize={fontSize}
                        fontWeight={isWinner ? 700 : 600}
                        fontFamily="var(--font-body), system-ui, sans-serif"
                        letterSpacing="0.02em"
                        style={{
                          paintOrder: "stroke fill",
                          stroke: "rgba(0,0,0,0.45)",
                          strokeWidth: 0.28,
                        }}
                      >
                        {shortLabel(seg, n)}
                      </text>
                    </g>
                  );
                })
              : null}
            {isLive ? (
              <LiveSliceDecorations
                segments={segments}
                highlightTicketNumber={highlightTicketNumber}
                emphasizeWinner={emphasizeWinner}
              />
            ) : null}
          </>,
        )}

        {isLive ? <LiveWheelFixedBezel id={id} /> : null}

        <circle
          r={R + 4.52}
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={0.44}
          opacity={0.48}
        />
        <circle
          r={R + 4.08}
          fill="none"
          stroke="rgba(0,0,0,0.38)"
          strokeWidth={0.3}
          opacity={0.55}
        />
        <circle
          r={R + 4.18}
          fill="none"
          stroke={`url(#${isLive ? id("rim-gold-live") : id("rim-gold-admin")})`}
          strokeWidth={1.16}
          opacity={0.97}
        />
        <circle
          r={R + 4.28}
          fill="none"
          stroke={`url(#${id("rim-hairline")})`}
          strokeWidth={0.11}
          opacity={0.55}
        />
        <circle
          r={R + 4.36}
          fill="none"
          stroke={`url(#${id("rim-hairline")})`}
          strokeWidth={0.16}
          opacity={0.86}
        />
        <circle
          r={R + 3.76}
          fill="none"
          stroke={`url(#${id("rim-inner-hilight")})`}
          strokeWidth={0.24}
          opacity={0.9}
        />
        <circle
          r={R + 0.38}
          fill="none"
          stroke={`url(#${isLive ? id("slice-edge-live") : id("slice-edge-admin")})`}
          strokeWidth={0.32}
          opacity={0.88}
        />

        {!isLive ? (
          <>
            <circle
              r={24.05}
              fill={`url(#${id("hub")})`}
              stroke={`url(#${id("slice-edge-admin")})`}
              strokeWidth={1.56}
            />
            <circle
              r={22.58}
              fill="none"
              stroke="rgba(190,158,58,0.42)"
              strokeWidth={0.36}
            />
            <circle r={22.12} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={0.28} />
            <circle r={24.05} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.88} />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#e9ca4e"
              fontSize={11.4}
              fontWeight={700}
              fontFamily="var(--font-heading), system-ui, sans-serif"
              letterSpacing="0.13em"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}
            >
              APEX
            </text>
          </>
        ) : null}
      </svg>
      {isLive ? <LiveWheelHub energy={visualEnergy} /> : null}
    </div>
  );
}
