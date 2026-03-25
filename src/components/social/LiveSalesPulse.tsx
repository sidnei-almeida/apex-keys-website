"use client";

import { getRecentPurchasePulses } from "@/lib/api/services";
import type { RecentPurchasePulseOut } from "@/types/api";
import { Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/** Compras reais: rotação e sensação de “acabou de acontecer”. */
const REAL_ROTATE_MS = 9_000;
const REAL_REFETCH_MS = 45_000;

/**
 * Fallback ilustrativo (sem compras na API): muito mais espaçado para não parecer
 * robô nem óbvio que é exemplo.
 */
const MOCK_FIRST_SHOW_MS = 120_000; // 2 min na página antes do 1.º “exemplo”
const MOCK_ROTATE_MS = 55_000; // entre um exemplo e outro
const MOCK_PULSES = [
  {
    id: "mock-1",
    line: "Sidnei A. comprou 5 números de Dead Space",
    time: "Há pouco",
  },
  {
    id: "mock-2",
    line: "Mariana R. garantiu 12 cotas de Baldur's Gate 3",
    time: "Há pouco",
  },
  {
    id: "mock-3",
    line: "Pedro H. acabou de reservar 3 números de Cyberpunk 2077",
    time: "Há pouco",
  },
  {
    id: "mock-4",
    line: "Amanda K. comprou 8 números de Resident Evil 4",
    time: "Há pouco",
  },
] as const;

function formatRelativeTimePt(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 45) return "Agora há pouco";
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return min <= 1 ? "Há 1 minuto" : `Há ${min} minutos`;
  }
  const h = Math.floor(min / 60);
  if (h < 24) {
    return h === 1 ? "Há 1 hora" : `Há ${h} horas`;
  }
  const d = Math.floor(h / 24);
  return d === 1 ? "Há 1 dia" : `Há ${d} dias`;
}

function pulseLine(p: RecentPurchasePulseOut): string {
  const n = p.quantity;
  const nums = n === 1 ? "número" : "números";
  return `${p.display_name} comprou ${n} ${nums} de ${p.raffle_title}`;
}

export function LiveSalesPulse() {
  const [realItems, setRealItems] = useState<RecentPurchasePulseOut[]>([]);
  const [index, setIndex] = useState(0);
  /** Só depois do atraso inicial mostramos mocks (evita “exemplo” logo ao abrir). */
  const [mockUnlocked, setMockUnlocked] = useState(false);

  const hasReal = realItems.length > 0;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getRecentPurchasePulses();
        if (cancelled) return;
        setRealItems(data);
      } catch {
        if (!cancelled) setRealItems([]);
      }
    }

    void load();
    const refetch = window.setInterval(() => void load(), REAL_REFETCH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(refetch);
    };
  }, []);

  useEffect(() => {
    if (hasReal) return;
    const t = window.setTimeout(() => setMockUnlocked(true), MOCK_FIRST_SHOW_MS);
    return () => window.clearTimeout(t);
  }, [hasReal]);

  const rotateMs = hasReal ? REAL_ROTATE_MS : MOCK_ROTATE_MS;
  const activeCount = hasReal
    ? realItems.length
    : mockUnlocked
      ? MOCK_PULSES.length
      : 0;

  useEffect(() => {
    if (activeCount === 0) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % activeCount);
    }, rotateMs);
    return () => window.clearInterval(id);
  }, [activeCount, rotateMs]);

  const display = useMemo(() => {
    if (hasReal) {
      const i = index % realItems.length;
      const p = realItems[i]!;
      return {
        key: p.id,
        line: pulseLine(p),
        time: formatRelativeTimePt(p.purchased_at),
      };
    }
    if (mockUnlocked) {
      const m = MOCK_PULSES[index % MOCK_PULSES.length]!;
      return { key: m.id, line: m.line, time: m.time };
    }
    return null;
  }, [hasReal, realItems, index, mockUnlocked]);

  if (!display) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 z-50 max-w-[min(calc(100vw-2rem),20rem)] sm:bottom-6 sm:left-6"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        key={display.key}
        className="apex-fomo-enter rounded-xl border border-premium-border bg-premium-surface p-3 shadow-lg sm:p-3.5"
      >
        <div className="flex gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg border border-premium-border bg-premium-bg">
            <Flame
              className="size-5 text-premium-accent"
              strokeWidth={2}
              aria-hidden
            />
            <span
              className="absolute -right-0.5 -top-0.5 flex size-2.5 items-center justify-center"
              aria-hidden
            >
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-600/35 opacity-75" />
              <span className="relative size-2 rounded-full border border-premium-border bg-emerald-700/90" />
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-body text-sm leading-snug text-premium-text">
              {display.line}
            </p>
            <p className="mt-1 font-body text-xs text-premium-muted">
              {display.time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
