"use client";

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";

const MOCK_PULSES = [
  {
    id: "1",
    line: "Sidnei A. comprou 5 números de Dead Space",
    time: "Há 2 minutos",
  },
  {
    id: "2",
    line: "Mariana R. garantiu 12 cotas de Baldur's Gate 3",
    time: "Há 4 minutos",
  },
  {
    id: "3",
    line: "Pedro H. acabou de reservar 3 números de Cyberpunk 2077",
    time: "Há 6 minutos",
  },
  {
    id: "4",
    line: "Amanda K. comprou 8 números de Resident Evil 4",
    time: "Há 9 minutos",
  },
] as const;

const ROTATE_MS = 9_000;

export function LiveSalesPulse() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % MOCK_PULSES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const item = MOCK_PULSES[index]!;

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 z-50 max-w-[min(calc(100vw-2rem),20rem)] sm:bottom-6 sm:left-6"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        key={item.id}
        className="apex-fomo-enter rounded-xl border border-white/10 bg-apex-surface/40 p-3 shadow-2xl backdrop-blur-md sm:p-3.5"
      >
        <div className="flex gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg border border-apex-accent/25 bg-apex-accent/10">
            <Flame
              className="size-5 text-apex-secondary"
              strokeWidth={2}
              aria-hidden
            />
            <span className="absolute -right-0.5 -top-0.5 flex size-2.5 items-center justify-center" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
              <span className="relative size-2 rounded-full border border-apex-bg bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-body text-sm leading-snug text-apex-text/95">
              {item.line}
            </p>
            <p className="mt-1 font-body text-xs text-apex-text-muted">
              {item.time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
