"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getAccessToken } from "@/lib/auth/token-storage";
import { getMyTickets, getPublicLiveDraw } from "@/lib/api/services";
import type { PublicLiveDrawOut } from "@/types/api";
import { Disc3 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function formatCountdown(seconds: number): string {
  if (seconds >= 60) {
    return `${Math.max(1, Math.ceil(seconds / 60))} min`;
  }
  return `${Math.max(0, seconds)}s`;
}

function shortCountdown(seconds: number, spinning: boolean): string {
  if (spinning) return "Giro";
  if (seconds >= 60) return `${Math.max(1, Math.ceil(seconds / 60))}m`;
  return `${seconds}s`;
}

function pickBestLiveDraw(
  rows: { id: string; d: PublicLiveDrawOut }[],
): {
  raffleId: string;
  title: string;
  mode: "countdown" | "spinning";
  seconds: number;
} | null {
  const candidates = rows.filter(
    (x) =>
      x.d.status === "sold_out" &&
      x.d.winner_ticket_number == null &&
      x.d.scheduled_live_draw_at != null,
  );
  if (candidates.length === 0) return null;

  const spinning = candidates.filter((x) => (x.d.seconds_until_draw ?? 1) <= 0);
  if (spinning.length > 0) {
    const x = spinning[0];
    return {
      raffleId: x.id,
      title: x.d.raffle_title,
      mode: "spinning",
      seconds: 0,
    };
  }

  const counting = candidates
    .filter((x) => (x.d.seconds_until_draw ?? 0) > 0)
    .sort(
      (a, b) =>
        (a.d.seconds_until_draw ?? 0) - (b.d.seconds_until_draw ?? 0),
    );
  if (counting.length === 0) return null;

  const x = counting[0];
  return {
    raffleId: x.id,
    title: x.d.raffle_title,
    mode: "countdown",
    seconds: x.d.seconds_until_draw ?? 0,
  };
}

type PickState = {
  raffleId: string;
  title: string;
  mode: "countdown" | "spinning";
  seconds: number;
};

const linkBase =
  "shrink-0 items-center rounded-lg border border-premium-accent/35 bg-premium-accent/10 text-premium-accent transition-colors hover:border-premium-accent/55 hover:bg-premium-accent/15";

/**
 * Indicador ao vivo da roleta (só logado, só se participar numa rifa sold_out com sorteio agendado).
 * Desktop: à esquerda da carteira. Mobile: à esquerda do valor da carteira.
 */
export function HeaderLiveDrawChip() {
  const { isAuthenticated } = useAuth();
  const [pick, setPick] = useState<PickState | null>(null);
  const [displaySec, setDisplaySec] = useState(0);

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setPick(null);
      return;
    }
    try {
      const tickets = await getMyTickets(token, "sold_out");
      const paid = tickets.filter((t) => t.status === "paid");
      const ids = [...new Set(paid.map((t) => t.raffle_id))];
      if (ids.length === 0) {
        setPick(null);
        return;
      }
      const results = await Promise.all(
        ids.slice(0, 14).map(async (id) => {
          try {
            const d = await getPublicLiveDraw(id);
            return { id, d };
          } catch {
            return null;
          }
        }),
      );
      const valid = results.filter(
        (x): x is { id: string; d: PublicLiveDrawOut } => x != null,
      );
      setPick(pickBestLiveDraw(valid));
    } catch {
      setPick(null);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPick(null);
      return;
    }
    void refresh();
    const id = setInterval(() => void refresh(), 2800);
    return () => clearInterval(id);
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (pick?.mode === "countdown") setDisplaySec(pick.seconds);
    else setDisplaySec(0);
  }, [pick?.raffleId, pick?.mode, pick?.seconds]);

  useEffect(() => {
    if (!pick || pick.mode !== "countdown" || displaySec <= 0) return;
    const t = setInterval(() => setDisplaySec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [pick?.raffleId, pick?.mode, displaySec > 0]);

  if (!isAuthenticated || !pick) return null;

  const showSpinning =
    pick.mode === "spinning" ||
    (pick.mode === "countdown" && displaySec <= 0);
  const label = showSpinning ? "Girando" : formatCountdown(displaySec);
  const labelShort = shortCountdown(displaySec, showSpinning);
  const href = `/raffle/${pick.raffleId}/sorteio`;
  const title = `${pick.title} — roleta ao vivo`;
  const spinClass = showSpinning ? "animate-spin" : "";
  const spinStyle = showSpinning ? { animationDuration: "2.2s" } : undefined;

  return (
    <>
      <Link
        href={href}
        title={title}
        className={`${linkBase} hidden gap-2 px-3 py-2 md:flex`}
      >
        <Disc3
          className={`size-4 shrink-0 ${spinClass}`}
          style={spinStyle}
          aria-hidden
        />
        <span className="max-w-[5.5rem] truncate font-body text-[11px] font-semibold leading-tight">
          {label}
        </span>
        <span className="sr-only">
          Abrir sorteio ao vivo. Estado: {label}.
        </span>
      </Link>
      <Link
        href={href}
        title={title}
        className={`${linkBase} flex gap-1 px-2 py-1.5 md:hidden`}
      >
        <Disc3
          className={`size-4 shrink-0 ${spinClass}`}
          style={spinStyle}
          aria-hidden
        />
        <span className="max-w-[3.25rem] truncate font-mono text-[10px] font-bold uppercase leading-none tracking-tight">
          {labelShort}
        </span>
        <span className="sr-only">
          Abrir sorteio ao vivo. Estado: {label}.
        </span>
      </Link>
    </>
  );
}
