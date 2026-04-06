"use client";

/** Segmento mínimo para desenhar a roleta (admin ou público). */
export type RaffleWheelSegment = {
  ticket_number: number;
  full_name: string;
};

const R = 100;
const CX = 0;
const CY = 0;

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

type Props = {
  segments: RaffleWheelSegment[];
  rotationDeg: number;
  transitionMs: number;
  transitionEnabled: boolean;
};

export function RaffleWheelSvg({
  segments,
  rotationDeg,
  transitionMs,
  transitionEnabled,
}: Props) {
  const n = segments.length;

  if (n === 1) {
    const seg = segments[0]!;
    return (
      <div className="relative mx-auto w-full max-w-[min(100vw-2rem,28rem)]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1"
          aria-hidden
        >
          <div className="h-0 w-0 border-x-[14px] border-x-transparent border-t-[22px] border-t-premium-accent drop-shadow-[0_2px_8px_rgba(212,175,55,0.45)]" />
        </div>
        <svg viewBox="-108 -108 216 216" className="aspect-square w-full overflow-visible" role="img" aria-label="Roleta com 1 bilhete pago">
          <defs>
            <radialGradient id="wheel-hub-single" cx="40%" cy="35%">
              <stop offset="0%" stopColor="rgba(212,175,55,0.35)" />
              <stop offset="100%" stopColor="rgba(22,22,22,0.95)" />
            </radialGradient>
            <filter id="wheel-shadow-single" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.45" />
            </filter>
          </defs>
          <g
            filter="url(#wheel-shadow-single)"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              transformOrigin: "0px 0px",
              transition: transitionEnabled
                ? `transform ${transitionMs}ms cubic-bezier(0.1, 0.82, 0.12, 1)`
                : "none",
            }}
          >
            <circle r={R} fill="rgba(212,175,55,0.2)" stroke="rgba(212,175,55,0.35)" strokeWidth={1.2} />
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
          </g>
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
        </svg>
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

  const fontSize = n > 120 ? 5 : n > 60 ? 6.5 : n > 30 ? 8 : 10;
  const labelR = n > 120 ? 62 : 58;

  return (
    <div className="relative mx-auto w-full max-w-[min(100vw-2rem,28rem)]">
      {/* Ponteiro fixo (topo) */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1"
        aria-hidden
      >
        <div className="h-0 w-0 border-x-[14px] border-x-transparent border-t-[22px] border-t-premium-accent drop-shadow-[0_2px_8px_rgba(212,175,55,0.45)]" />
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
        </defs>

        <g filter="url(#wheel-shadow)">
          <g
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              transformOrigin: "0px 0px",
              transition: transitionEnabled
                ? `transform ${transitionMs}ms cubic-bezier(0.1, 0.82, 0.12, 1)`
                : "none",
            }}
          >
            {segments.map((seg, i) => {
              const fill =
                i % 2 === 0
                  ? "rgba(212,175,55,0.14)"
                  : "rgba(255,255,255,0.04)";
              const stroke = "rgba(212,175,55,0.22)";
              const mid = (i + 0.5) / n;
              const ang = mid * 2 * Math.PI;
              const tx = labelR * Math.sin(ang);
              const ty = -labelR * Math.cos(ang);
              const rotDeg = (mid * 360 + 180) % 360;

              return (
                <g key={`${seg.ticket_number}-${seg.full_name}`}>
                  <path
                    d={slicePath(i, n, R)}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={n > 200 ? 0.15 : 0.35}
                  />
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
                </g>
              );
            })}
          </g>
        </g>

        {/* Aro exterior */}
        <circle
          r={R + 3}
          fill="none"
          stroke="rgba(212,175,55,0.45)"
          strokeWidth={2.5}
        />
        <circle
          r={R + 1}
          fill="none"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={1}
        />

        {/* Centro */}
        <circle r={22} fill="url(#wheel-hub)" stroke="rgba(212,175,55,0.5)" strokeWidth={1.5} />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgb(var(--premium-accent) / 1)"
          fontSize={11}
          fontWeight={700}
          fontFamily="var(--font-heading), system-ui, sans-serif"
          letterSpacing="0.12em"
        >
          APEX
        </text>
      </svg>
    </div>
  );
}
