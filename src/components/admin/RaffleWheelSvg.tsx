"use client";

import { APEX_BRAND_LOGO_SRC } from "@/lib/apex-brand-logo";
import { getApiBaseUrl } from "@/lib/api/config";
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

function resolveAvatarUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  const base = getApiBaseUrl().replace(/\/+$/, "");
  return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
}

function initialsFromName(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return `${p[0]![0]!}${p[p.length - 1]![0]!}`.toUpperCase();
}

/** Número na fatia live: sem "#", sempre pelo menos 2 caracteres (01, 07, 10, 123). */
function formatSliceTicketNumber(n: number): string {
  return String(n).padStart(2, "0");
}

function WheelPointer({ variant }: { variant: "admin" | "live" }) {
  const pid = useId().replace(/:/g, "");
  const fid = `wheel-ptr-${pid}`;

  if (variant === "admin") {
    return (
      <svg
        width={50}
        height={58}
        viewBox="0 0 50 58"
        className="drop-shadow-[0_4px_18px_rgba(212,175,55,0.45)]"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${fid}-metal`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0d78c" />
            <stop offset="35%" stopColor="#d4af37" />
            <stop offset="70%" stopColor="#a67c00" />
            <stop offset="100%" stopColor="#8a6a1e" />
          </linearGradient>
          <filter id={fid} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#d4af37" floodOpacity="0.55" />
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>
        <path
          d="M25 2 L44 42 Q25 54 25 54 Q25 54 6 42 Z"
          fill={`url(#${fid}-metal)`}
          stroke="rgba(255,248,220,0.35)"
          strokeWidth={1.1}
          filter={`url(#${fid})`}
        />
        <path
          d="M25 8 L36 38 Q25 46 25 46 Q25 46 14 38 Z"
          fill="rgba(10,10,10,0.2)"
        />
        <circle cx={25} cy={20} r={5.5} fill="#0a0a0a" stroke="rgba(212,175,55,0.85)" strokeWidth={1} />
        <circle cx={25} cy={20} r={2.4} fill="rgba(255,255,255,0.95)" />
      </svg>
    );
  }

  return (
    <svg
      width={40}
      height={48}
      viewBox="0 0 40 48"
      className="drop-shadow-[0_5px_22px_rgba(212,175,55,0.5)]"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${fid}-live`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0d78c" />
          <stop offset="45%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#9a7b1a" />
        </linearGradient>
        <filter id={`${fid}-g`} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#d4af37" floodOpacity="0.65" />
          <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>
      <path
        d="M20 1.5 L35 38 Q20 46 20 46 Q20 46 5 38 Z"
        fill={`url(#${fid}-live)`}
        stroke="rgba(255,248,220,0.4)"
        strokeWidth={1.15}
        strokeLinejoin="round"
        filter={`url(#${fid}-g)`}
      />
      <circle cx={20} cy={18} r={4.5} fill="#0a0a0a" stroke="rgba(212,175,55,0.9)" strokeWidth={0.9} />
      <circle cx={20} cy={18} r={2} fill="rgba(255,255,255,0.92)" />
    </svg>
  );
}

function LiveWheelHub({ energy }: { energy: WheelVisualEnergy }) {
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
        className={`relative flex aspect-square w-[min(24%,8.75rem)] min-w-[4.75rem] items-center justify-center overflow-hidden rounded-full border border-premium-accent/35 bg-gradient-to-b from-zinc-800/50 via-premium-bg/92 to-zinc-950/95 shadow-[inset_0_2px_12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08),0_0_40px_-8px_rgba(212,175,55,0.35),0_8px_24px_-6px_rgba(0,0,0,0.65)] ring-2 ring-black/40 backdrop-blur-sm ${pulseHub} ${energy === "celebrate" ? "shadow-[inset_0_2px_12px_rgba(0,0,0,0.45),0_0_52px_-6px_rgba(212,175,55,0.55),0_8px_28px_-6px_rgba(0,0,0,0.55)]" : ""}`}
      >
        <div className="apex-wheel-hub-inner-glow" />
        <div className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle_at_35%_28%,rgba(212,175,55,0.22)_0%,transparent_55%)]" />
        {!failed ? (
          // eslint-disable-next-line @next/next/no-img-element -- asset local da marca
          <img
            src={APEX_BRAND_LOGO_SRC}
            alt=""
            className="relative z-[1] h-[78%] w-[78%] object-contain object-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="relative z-[1] font-heading text-[0.7rem] font-semibold tracking-[0.2em] text-premium-accent">
            APEX
          </span>
        )}
      </div>
    </div>
  );
}

/** Conteúdo das fatias no modo live (baixa vs alta densidade). */
function LiveSliceDecorations({
  segments,
  clipPatternId,
  highlightTicketNumber,
  emphasizeWinner,
}: {
  segments: RaffleWheelSegment[];
  clipPatternId: string;
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
          filter: "drop-shadow(0 0 5px rgba(212,175,55,0.65))",
          fill: "rgba(255,236,180,0.95)",
        }
      : null;

  /** Número mais ao centro; avatar mais à borda; mesmo eixo radial. */
  const AVATAR_R = 5.5;

  return (
    <>
      <defs>
        <clipPath id={clipPatternId} clipPathUnits="objectBoundingBox">
          <circle cx={0.5} cy={0.5} r={0.5} />
        </clipPath>
      </defs>
      {segments.map((seg, i) => {
        const mid = (i + 0.5) / n;
        const ang = mid * 2 * Math.PI;
        const rotDeg = (mid * 360 + 180) % 360;
        const isWinnerSlice = emphasizeWinner && winnerIdx === i;

        if (lowDensity) {
          const fillIsA = i % 2 === 0;
          const labelFill = fillIsA ? "rgba(255,255,255,0.88)" : "rgba(236,210,140,0.92)";
          const rNum = R * 0.38;
          const rAv = R * 0.71;
          const nx = rNum * Math.sin(ang);
          const ny = -rNum * Math.cos(ang);
          const ax = rAv * Math.sin(ang);
          const ay = -rAv * Math.cos(ang);
          const href = resolveAvatarUrl(seg.avatar_url);
          const initials = initialsFromName(seg.full_name);
          const fsLow = n <= 8 ? 7.4 : n <= 14 ? 6.5 : 5.8;

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
                    textShadow: isWinnerSlice
                      ? "0 0 10px rgba(212,175,55,0.55), 0 1px 3px rgba(0,0,0,0.9)"
                      : "0 1px 3px rgba(0,0,0,0.85)",
                    filter: isWinnerSlice ? winnerGlow?.filter : undefined,
                  }}
                >
                  {formatSliceTicketNumber(seg.ticket_number)}
                </text>
              </g>
              <g transform={`translate(${ax},${ay}) rotate(${rotDeg})`}>
                {href ? (
                  <>
                    <image
                      href={href}
                      x={-AVATAR_R}
                      y={-AVATAR_R}
                      width={AVATAR_R * 2}
                      height={AVATAR_R * 2}
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#${clipPatternId})`}
                    />
                    <circle
                      r={AVATAR_R}
                      fill="none"
                      stroke={
                        isWinnerSlice ? "rgba(212,175,55,0.85)" : "rgba(212,175,55,0.55)"
                      }
                      strokeWidth={isWinnerSlice ? 0.65 : 0.45}
                    />
                  </>
                ) : (
                  <>
                    <circle
                      r={AVATAR_R}
                      fill={isWinnerSlice ? "#2a2418" : "#252525"}
                      stroke={
                        isWinnerSlice ? "rgba(212,175,55,0.75)" : "rgba(212,175,55,0.5)"
                      }
                      strokeWidth={isWinnerSlice ? 0.55 : 0.45}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="rgba(212,175,55,0.88)"
                      fontSize={n <= 10 ? 4.1 : 3.7}
                      fontWeight={600}
                      fontFamily="var(--font-body), system-ui, sans-serif"
                    >
                      {initials}
                    </text>
                  </>
                )}
              </g>
            </g>
          );
        }

        const fillIsA = i % 2 === 0;
        const textFill = fillIsA ? "rgba(255,255,255,0.88)" : "rgba(236,210,140,0.9)";
        const rOut = R * 0.87;
        const tx = rOut * Math.sin(ang);
        const ty = -rOut * Math.cos(ang);
        const fs =
          n > 160 ? 3.12 : n > 120 ? 3.44 : n > 80 ? 4.08 : n > 50 ? 4.8 : 5.35;

        return (
          <g key={`live-hi-${seg.ticket_number}-${i}`}>
            <g transform={`translate(${tx},${ty}) rotate(${rotDeg})`}>
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isWinnerSlice && winnerGlow ? winnerGlow.fill : textFill}
                fontSize={fs}
                fontWeight={isWinnerSlice ? 700 : 600}
                fontFamily="var(--font-mono), ui-monospace, monospace"
                letterSpacing="0.03em"
                style={{
                  textShadow: isWinnerSlice
                    ? "0 0 8px rgba(212,175,55,0.5), 0 0 2px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.9)"
                    : "0 0 2px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.88)",
                  filter: isWinnerSlice ? winnerGlow?.filter : undefined,
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
  const clipPatternId = useId().replace(/:/g, "");
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;

  const n = segments.length;
  const isLive = variant === "live";
  const showAdminLabels = !isLive;

  const fontSize = n > 120 ? 5.2 : n > 60 ? 6.7 : n > 30 ? 8.2 : 10.2;
  const labelR = n > 120 ? 61 : 57;

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
    <g filter={isLive ? `url(#${id("wh-sh-live")})` : `url(#${id("wh-sh")})`}>
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
    (celebrateVisual
      ? "motion-safe:scale-[1.035] drop-shadow-[0_0_52px_rgba(212,175,55,0.38)] apex-wheel-shell--celebrate-motion"
      : "scale-100 drop-shadow-[0_0_28px_rgba(212,175,55,0.08)]") +
    " motion-reduce:scale-100 motion-reduce:transition-none motion-reduce:drop-shadow-none";

  if (n === 1) {
    const seg = segments[0]!;
    const href = isLive ? resolveAvatarUrl(seg.avatar_url) : null;
    const lowSingle = isLive;
    const AV = 6;
    const singleWinner =
      showWinnerSlice && seg.ticket_number === highlightTicketNumber;

    return (
      <div
        className={shellClass}
        data-apex-wheel-energy={isLive ? visualEnergy : "idle"}
      >
        {isLive ? <WheelBackdrop /> : null}
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[2px]"
          aria-hidden
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
            <radialGradient id={id("hub-s")} cx="38%" cy="32%" r="65%">
              <stop offset="0%" stopColor="rgba(212,175,55,0.42)" />
              <stop offset="45%" stopColor="rgba(45,38,22,0.92)" />
              <stop offset="100%" stopColor="rgba(12,12,12,0.98)" />
            </radialGradient>
            <linearGradient id={id("rim-gold")} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(180,150,70,0.5)" />
              <stop offset="35%" stopColor="rgba(212,175,55,0.85)" />
              <stop offset="65%" stopColor="rgba(140,115,45,0.75)" />
              <stop offset="100%" stopColor="rgba(90,75,35,0.55)" />
            </linearGradient>
            <radialGradient id={id("face-1")} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
              <stop offset="0%" stopColor={isLive ? "#242424" : "rgba(212,175,55,0.22)"} />
              <stop offset="55%" stopColor={isLive ? "#141414" : "rgba(212,175,55,0.08)"} />
              <stop offset="100%" stopColor={isLive ? "#0a0a0a" : "rgba(8,8,8,0.95)"} />
            </radialGradient>
            <filter id={id("wh-sh")} x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="5" stdDeviation="10" floodOpacity="0.5" />
            </filter>
            <filter id={id("wh-sh-live")} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.28" />
            </filter>
            <filter id={id("win-glow")} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {lowSingle ? (
              <clipPath id={`${clipPatternId}-one`} clipPathUnits="objectBoundingBox">
                <circle cx={0.5} cy={0.5} r={0.5} />
              </clipPath>
            ) : null}
          </defs>
          {wrapSpinning(
            <>
              <circle
                r={R - 1.2}
                fill="none"
                stroke="rgba(0,0,0,0.45)"
                strokeWidth={4}
                opacity={0.55}
                style={{ filter: "blur(3px)" }}
              />
              <circle
                r={R}
                fill={`url(#${id("face-1")})`}
                stroke={isLive ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.38)"}
                strokeWidth={isLive ? 0.4 : 1}
              />
              {singleWinner ? (
                <circle
                  r={R}
                  fill="rgba(212,175,55,0.12)"
                  filter={`url(#${id("win-glow")})`}
                />
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
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
                >
                  {shortLabel(seg, 1)}
                </text>
              ) : null}
              {lowSingle ? (
                <>
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    y={-38}
                    fill={singleWinner ? "rgba(255,240,200,0.98)" : "rgba(212,175,55,0.9)"}
                    fontSize={8.8}
                    fontWeight={600}
                    fontFamily="var(--font-body), system-ui, sans-serif"
                    style={{
                      textShadow: singleWinner
                        ? "0 0 10px rgba(212,175,55,0.55), 0 1px 3px rgba(0,0,0,0.85)"
                        : "0 1px 3px rgba(0,0,0,0.8)",
                    }}
                  >
                    {formatSliceTicketNumber(seg.ticket_number)}
                  </text>
                  <g transform="translate(0,-62)">
                    {href ? (
                      <>
                        <image
                          href={href}
                          x={-AV}
                          y={-AV}
                          width={AV * 2}
                          height={AV * 2}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath={`url(#${clipPatternId}-one)`}
                        />
                        <circle
                          r={AV}
                          fill="none"
                          stroke={
                            singleWinner ? "rgba(212,175,55,0.85)" : "rgba(212,175,55,0.55)"
                          }
                          strokeWidth={singleWinner ? 0.6 : 0.45}
                        />
                      </>
                    ) : (
                      <>
                        <circle
                          r={AV}
                          fill="#252525"
                          stroke="rgba(212,175,55,0.5)"
                          strokeWidth={0.45}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="rgba(212,175,55,0.82)"
                          fontSize={5}
                          fontWeight={500}
                          fontFamily="var(--font-body), system-ui, sans-serif"
                        >
                          {initialsFromName(seg.full_name)}
                        </text>
                      </>
                    )}
                  </g>
                </>
              ) : null}
            </>,
          )}
          {isLive ? (
            <g className="apex-wheel-rim-sweep" style={{ pointerEvents: "none" }}>
              <circle
                r={R + 5.5}
                fill="none"
                stroke="rgba(212,175,55,0.5)"
                strokeWidth={2.4}
                strokeDasharray="14 70"
                strokeLinecap="round"
                opacity={0.9}
              />
            </g>
          ) : null}
          <circle
            r={R + 5.5}
            fill="none"
            stroke={`url(#${id("rim-gold")})`}
            strokeWidth={5.2}
            opacity={0.92}
          />
          <circle
            r={R + 2.8}
            fill="none"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth={2.2}
            opacity={0.65}
          />
          <circle
            r={R + 7}
            fill="none"
            stroke="rgba(212,175,55,0.15)"
            strokeWidth={1.5}
            style={{ filter: "blur(4px)" }}
          />
          {!isLive ? (
            <>
              <circle
                r={24}
                fill={`url(#${id("hub-s")})`}
                stroke="rgba(212,175,55,0.55)"
                strokeWidth={1.6}
              />
              <circle
                r={24}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#e8c84a"
                fontSize={11.5}
                fontWeight={700}
                fontFamily="var(--font-heading), system-ui, sans-serif"
                letterSpacing="0.14em"
                style={{ textShadow: "0 0 12px rgba(212,175,55,0.35)" }}
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
        className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[2px]"
        aria-hidden
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
          <radialGradient id={id("hub")} cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.42)" />
            <stop offset="45%" stopColor="rgba(45,38,22,0.92)" />
            <stop offset="100%" stopColor="rgba(12,12,12,0.98)" />
          </radialGradient>
          <linearGradient id={id("rim-gold")} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(180,150,70,0.5)" />
            <stop offset="35%" stopColor="rgba(212,175,55,0.85)" />
            <stop offset="65%" stopColor="rgba(140,115,45,0.75)" />
            <stop offset="100%" stopColor="rgba(90,75,35,0.55)" />
          </linearGradient>
          <radialGradient id={id("sg-live-a")} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="50%" stopColor="#141414" />
            <stop offset="100%" stopColor="#080808" />
          </radialGradient>
          <radialGradient id={id("sg-live-b")} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
            <stop offset="0%" stopColor="#222222" />
            <stop offset="50%" stopColor="#111111" />
            <stop offset="100%" stopColor="#060606" />
          </radialGradient>
          <radialGradient id={id("sg-live-win")} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
            <stop offset="0%" stopColor="rgba(212,175,55,0.28)" />
            <stop offset="45%" stopColor="rgba(55,48,28,0.88)" />
            <stop offset="100%" stopColor="#0c0c0c" />
          </radialGradient>
          <radialGradient id={id("sg-adm-a")} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
            <stop offset="0%" stopColor="rgba(212,175,55,0.22)" />
            <stop offset="55%" stopColor="rgba(212,175,55,0.06)" />
            <stop offset="100%" stopColor="rgba(10,10,10,0.92)" />
          </radialGradient>
          <radialGradient id={id("sg-adm-b")} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
            <stop offset="0%" stopColor="rgba(255,255,255,0.09)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(8,8,8,0.9)" />
          </radialGradient>
          <radialGradient id={id("sg-adm-win")} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
            <stop offset="0%" stopColor="rgba(212,175,55,0.35)" />
            <stop offset="50%" stopColor="rgba(212,175,55,0.12)" />
            <stop offset="100%" stopColor="rgba(18,16,10,0.95)" />
          </radialGradient>
          <filter id={id("wh-sh")} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="5" stdDeviation="10" floodOpacity="0.5" />
          </filter>
          <filter id={id("wh-sh-live")} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.28" />
          </filter>
          <filter id={id("win-glow")} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {wrapSpinning(
          <>
            {segments.map((seg, i) => {
              const isWinner = showWinnerSlice && winnerIdx === i;
              const nearPointer = !isWinner && i === sliceNearPointer;
              const fill = isLive
                ? isWinner
                  ? `url(#${id("sg-live-win")})`
                  : i % 2 === 0
                    ? `url(#${id("sg-live-a")})`
                    : `url(#${id("sg-live-b")})`
                : isWinner
                  ? `url(#${id("sg-adm-win")})`
                  : i % 2 === 0
                    ? `url(#${id("sg-adm-a")})`
                    : `url(#${id("sg-adm-b")})`;
              const stroke = isLive ? "rgba(255,255,255,0.06)" : "rgba(212,175,55,0.26)";
              const sw = n > 200 ? 0.14 : isLive ? 0.32 : 0.38;
              const d = slicePath(i, n, R);
              const winBurst = celebrateVisual && isWinner;

              return (
                <g key={`slice-${seg.ticket_number}-${i}`}>
                  <path d={d} fill={fill} stroke={stroke} strokeWidth={sw} />
                  {nearPointer ? (
                    <path
                      d={d}
                      fill="rgba(212,175,55,0.1)"
                      stroke="rgba(212,175,55,0.28)"
                      strokeWidth={Math.max(sw, 0.42)}
                      className="apex-wheel-slice-near-pointer"
                      style={{ mixBlendMode: "screen", pointerEvents: "none" }}
                    />
                  ) : null}
                  {isWinner ? (
                    <path
                      d={d}
                      fill={winBurst ? "rgba(212,175,55,0.28)" : "rgba(212,175,55,0.14)"}
                      stroke={
                        winBurst ? "rgba(255,228,160,0.72)" : "rgba(212,175,55,0.45)"
                      }
                      strokeWidth={winBurst ? Math.max(sw, 0.85) : Math.max(sw, 0.5)}
                      filter={`url(#${id("win-glow")})`}
                      style={{ pointerEvents: "none" }}
                    />
                  ) : null}
                </g>
              );
            })}
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
                      stroke="rgba(212,175,55,0.18)"
                      strokeWidth={n > 200 ? 0.24 : 0.45}
                      strokeLinecap="round"
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
                        fill={isWinner ? "rgba(255,245,210,0.98)" : "#f0f0f0"}
                        fontSize={fontSize}
                        fontWeight={isWinner ? 700 : 600}
                        fontFamily="var(--font-body), system-ui, sans-serif"
                        letterSpacing="0.02em"
                        style={{
                          textShadow: isWinner
                            ? "0 0 10px rgba(212,175,55,0.45), 0 1px 4px rgba(0,0,0,0.95)"
                            : "0 1px 4px rgba(0,0,0,0.92)",
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
                clipPatternId={clipPatternId}
                highlightTicketNumber={highlightTicketNumber}
                emphasizeWinner={emphasizeWinner}
              />
            ) : null}
          </>,
        )}

        {isLive ? (
          <g className="apex-wheel-rim-sweep" style={{ pointerEvents: "none" }}>
            <circle
              r={R + 5.5}
              fill="none"
              stroke="rgba(212,175,55,0.5)"
              strokeWidth={2.4}
              strokeDasharray="14 70"
              strokeLinecap="round"
              opacity={0.9}
            />
          </g>
        ) : null}

        <circle
          r={R + 5.5}
          fill="none"
          stroke={`url(#${id("rim-gold")})`}
          strokeWidth={5.2}
          opacity={0.92}
        />
        <circle
          r={R + 2.8}
          fill="none"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth={2.4}
          opacity={0.7}
        />
        <circle
          r={R + 7}
          fill="none"
          stroke="rgba(212,175,55,0.18)"
          strokeWidth={1.8}
          style={{ filter: "blur(5px)" }}
        />

        {!isLive ? (
          <>
            <circle
              r={24}
              fill={`url(#${id("hub")})`}
              stroke="rgba(212,175,55,0.55)"
              strokeWidth={1.6}
            />
            <circle r={24} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#e8c84a"
              fontSize={11.5}
              fontWeight={700}
              fontFamily="var(--font-heading), system-ui, sans-serif"
              letterSpacing="0.14em"
              style={{ textShadow: "0 0 14px rgba(212,175,55,0.4)" }}
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
