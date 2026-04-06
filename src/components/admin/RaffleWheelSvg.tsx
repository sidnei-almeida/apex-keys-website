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

const LIVE_FILL_A = "#161616";
const LIVE_FILL_B = "#1a1a1a";
const LIVE_STROKE = "rgba(255,255,255,0.055)";

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

function formatTicketHash(n: number): string {
  if (n < 100) return `#${String(n).padStart(2, "0")}`;
  return `#${n}`;
}

function WheelPointerAdmin() {
  return (
    <svg
      width={44}
      height={52}
      viewBox="0 0 44 52"
      className="drop-shadow-[0_3px_12px_rgba(212,175,55,0.35)]"
      aria-hidden
    >
      <defs>
        <filter id="wheel-pointer-glow-admin" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#D4AF37" floodOpacity="0.45" />
        </filter>
      </defs>
      <path
        d="M22 4 L38 38 Q22 48 22 48 Q22 48 6 38 Z"
        fill="#D4AF37"
        stroke="rgba(212,175,55,0.9)"
        strokeWidth={1.25}
        filter="url(#wheel-pointer-glow-admin)"
      />
      <circle cx={22} cy={18} r={5} fill="#0a0a0a" stroke="rgba(212,175,55,0.75)" strokeWidth={0.75} />
      <circle cx={22} cy={18} r={2.2} fill="rgba(255,255,255,0.92)" />
    </svg>
  );
}

function WheelPointerLive() {
  return (
    <svg width={28} height={36} viewBox="0 0 28 36" className="opacity-95" aria-hidden>
      <path
        d="M14 1.5 L24 29 Q14 34 14 34 Q14 34 4 29 Z"
        fill="rgba(10,10,10,0.88)"
        stroke="#D4AF37"
        strokeWidth={1.15}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LiveWheelHub() {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center"
      aria-hidden
    >
      <div className="flex aspect-square w-[min(22%,8rem)] min-w-[4.25rem] items-center justify-center rounded-full border border-premium-border/45 bg-premium-bg/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(0,0,0,0.5)]">
        {!failed ? (
          <img
            src={APEX_BRAND_LOGO_SRC}
            alt=""
            className="h-[76%] w-[76%] object-contain object-center"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="font-heading text-[0.65rem] font-semibold tracking-[0.18em] text-premium-muted">
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
}: {
  segments: RaffleWheelSegment[];
  clipPatternId: string;
}) {
  const n = segments.length;
  if (n <= 1) return null;

  const lowDensity = n <= 20;
  /** Raio do avatar em unidades do viewBox (~ proporcional a w-6 na roda ~500px). */
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
        const fillIsA = i % 2 === 0;
        const textFill = fillIsA ? "#F3F4F6" : "#D4AF37";

        if (lowDensity) {
          const rNum = R * 0.44;
          const rAv = R * 0.62;
          const nx = rNum * Math.sin(ang);
          const ny = -rNum * Math.cos(ang);
          const ax = rAv * Math.sin(ang);
          const ay = -rAv * Math.cos(ang);
          const href = resolveAvatarUrl(seg.avatar_url);
          const initials = initialsFromName(seg.full_name);

          return (
            <g key={`live-low-${seg.ticket_number}-${i}`}>
              <g transform={`translate(${nx},${ny}) rotate(${rotDeg})`}>
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#D4AF37"
                  fontSize={n <= 8 ? 9 : n <= 14 ? 8 : 7}
                  fontWeight={700}
                  fontFamily="var(--font-body), system-ui, sans-serif"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
                >
                  {formatTicketHash(seg.ticket_number)}
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
                      stroke="rgba(212,175,55,0.55)"
                      strokeWidth={0.45}
                    />
                  </>
                ) : (
                  <>
                    <circle
                      r={AVATAR_R}
                      fill="#252525"
                      stroke="rgba(212,175,55,0.5)"
                      strokeWidth={0.45}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#D4AF37"
                      fontSize={n <= 10 ? 5 : 4.5}
                      fontWeight={700}
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

        const rOut = R * 0.87;
        const tx = rOut * Math.sin(ang);
        const ty = -rOut * Math.cos(ang);
        const fs =
          n > 160 ? 3.8 : n > 120 ? 4.2 : n > 80 ? 5 : n > 50 ? 5.8 : 6.5;

        return (
          <g key={`live-hi-${seg.ticket_number}-${i}`}>
            <g transform={`translate(${tx},${ty}) rotate(${rotDeg})`}>
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textFill}
                fontSize={fs}
                fontWeight={600}
                fontFamily="var(--font-mono), ui-monospace, monospace"
                style={{ textShadow: "0 0 2px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.85)" }}
              >
                {seg.ticket_number}
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
};

export function RaffleWheelSvg({
  segments,
  rotationDeg,
  transitionMs,
  transitionEnabled,
  variant = "admin",
  maxWidthClassName,
}: Props) {
  const clipPatternId = useId().replace(/:/g, "");
  const n = segments.length;
  const isLive = variant === "live";
  const showAdminLabels = !isLive;

  const fontSize = n > 120 ? 5 : n > 60 ? 6.5 : n > 30 ? 8 : 10;
  const labelR = n > 120 ? 62 : 58;

  const wrapSpinning = (inner: ReactNode) => (
    <g filter={isLive ? "url(#wheel-shadow-live)" : "url(#wheel-shadow)"}>
      <g
        style={{
          transform: `rotate(${rotationDeg}deg)`,
          transformOrigin: "0px 0px",
          transition: transitionEnabled
            ? `transform ${transitionMs}ms cubic-bezier(0.1, 0.82, 0.12, 1)`
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

  if (n === 1) {
    const seg = segments[0]!;
    const href = isLive ? resolveAvatarUrl(seg.avatar_url) : null;
    const lowSingle = isLive;
    const AV = 6;

    return (
      <div className={`relative mx-auto ${outerMax}`}>
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-px"
          aria-hidden
        >
          {isLive ? <WheelPointerLive /> : <WheelPointerAdmin />}
        </div>
        <svg viewBox="-108 -108 216 216" className="aspect-square w-full overflow-visible" role="img" aria-label="Roleta com 1 bilhete pago">
          <defs>
            <radialGradient id="wheel-hub-single" cx="40%" cy="35%">
              <stop offset="0%" stopColor="rgba(212,175,55,0.35)" />
              <stop offset="100%" stopColor="rgba(22,22,22,0.95)" />
            </radialGradient>
            <filter id="wheel-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.45" />
            </filter>
            <filter id="wheel-shadow-live" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.22" />
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
                r={R}
                fill={isLive ? LIVE_FILL_A : "rgba(212,175,55,0.2)"}
                stroke={isLive ? LIVE_STROKE : "rgba(212,175,55,0.35)"}
                strokeWidth={isLive ? 0.35 : 1.2}
              />
              {showAdminLabels ? (
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  y={-52}
                  fill="#ececec"
                  fontSize={12}
                  fontWeight={700}
                  fontFamily="var(--font-body), system-ui, sans-serif"
                >
                  {shortLabel(seg, 1)}
                </text>
              ) : null}
              {lowSingle ? (
                <>
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    y={-42}
                    fill="#D4AF37"
                    fontSize={11}
                    fontWeight={700}
                    fontFamily="var(--font-body), system-ui, sans-serif"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
                  >
                    {formatTicketHash(seg.ticket_number)}
                  </text>
                  <g transform="translate(0,-58)">
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
                        <circle r={AV} fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth={0.45} />
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
                          fill="#D4AF37"
                          fontSize={6}
                          fontWeight={700}
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
          {!isLive ? (
            <>
              <circle r={R + 3} fill="none" stroke="rgba(212,175,55,0.45)" strokeWidth={2.5} />
              <circle r={22} fill="url(#wheel-hub-single)" stroke="rgba(212,175,55,0.5)" strokeWidth={1.5} />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#D4AF37"
                fontSize={11}
                fontWeight={700}
                fontFamily="var(--font-heading), system-ui, sans-serif"
                letterSpacing="0.12em"
              >
                APEX
              </text>
            </>
          ) : (
            <circle r={R + 2} fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth={1} />
          )}
        </svg>
        {isLive ? <LiveWheelHub /> : null}
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
    <div className={`relative mx-auto ${outerMax}`}>
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-px"
        aria-hidden
      >
        {isLive ? <WheelPointerLive /> : <WheelPointerAdmin />}
      </div>

      <svg
        viewBox="-108 -108 216 216"
        className="aspect-square w-full overflow-visible"
        role="img"
        aria-label={`Roleta com ${n} bilhetes pagos`}
      >
        <defs>
          <radialGradient id="wheel-hub" cx="40%" cy="35%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.35)" />
            <stop offset="100%" stopColor="rgba(22,22,22,0.95)" />
          </radialGradient>
          <filter id="wheel-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.45" />
          </filter>
          <filter id="wheel-shadow-live" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.22" />
          </filter>
        </defs>

        {wrapSpinning(
          <>
            {segments.map((seg, i) => {
              const fill = isLive
                ? i % 2 === 0
                  ? LIVE_FILL_A
                  : LIVE_FILL_B
                : i % 2 === 0
                  ? "rgba(212,175,55,0.14)"
                  : "rgba(255,255,255,0.04)";
              const stroke = isLive ? LIVE_STROKE : "rgba(212,175,55,0.22)";
              const mid = (i + 0.5) / n;
              const ang = mid * 2 * Math.PI;
              const tx = labelR * Math.sin(ang);
              const ty = -labelR * Math.cos(ang);
              const rotDeg = (mid * 360 + 180) % 360;

              return (
                <g key={`slice-${seg.ticket_number}-${i}`}>
                  <path
                    d={slicePath(i, n, R)}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={n > 200 ? 0.12 : isLive ? 0.28 : 0.35}
                  />
                  {showAdminLabels ? (
                    <g transform={`translate(${tx},${ty}) rotate(${rotDeg})`}>
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ececec"
                        fontSize={fontSize}
                        fontWeight={600}
                        fontFamily="var(--font-body), system-ui, sans-serif"
                        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}
                      >
                        {shortLabel(seg, n)}
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}
            {isLive ? <LiveSliceDecorations segments={segments} clipPatternId={clipPatternId} /> : null}
          </>,
        )}

        {!isLive ? (
          <>
            <circle r={R + 3} fill="none" stroke="rgba(212,175,55,0.45)" strokeWidth={2.5} />
            <circle r={R + 1} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
            <circle r={22} fill="url(#wheel-hub)" stroke="rgba(212,175,55,0.5)" strokeWidth={1.5} />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#D4AF37"
              fontSize={11}
              fontWeight={700}
              fontFamily="var(--font-heading), system-ui, sans-serif"
              letterSpacing="0.12em"
            >
              APEX
            </text>
          </>
        ) : (
          <circle r={R + 2} fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth={1} />
        )}
      </svg>
      {isLive ? <LiveWheelHub /> : null}
    </div>
  );
}
