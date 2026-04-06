"use client";

import { RaffleWheelSvg } from "@/components/admin/RaffleWheelSvg";
import { useWheelSound } from "@/components/admin/useWheelSound";
import { getPublicLiveDraw } from "@/lib/api/services";
import type { PublicLiveDrawOut, PublicWheelSegmentOut } from "@/types/api";
import { Loader2, Radio, Trophy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const SPIN_MS_DEFAULT = 9000;
const SPIN_MS_REDUCED = 450;

function useReducedSpinMs() {
  const [ms, setMs] = useState(SPIN_MS_DEFAULT);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMs(mq.matches ? SPIN_MS_REDUCED : SPIN_MS_DEFAULT);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return ms;
}

export function LiveSorteioClient({ raffleId }: { raffleId: string }) {
  const [data, setData] = useState<PublicLiveDrawOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [countdown, setCountdown] = useState<number | null>(null);
  const spinMs = useReducedSpinMs();
  const [rotationDeg, setRotationDeg] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const [phase, setPhase] = useState<"idle" | "spinning" | "done">("idle");
  const spunForWinnerRef = useRef<number | null>(null);
  const firstPollDoneRef = useRef(false);
  const hadWinnerOnFirstPollRef = useRef(false);

  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { resume, playTick, playWin } = useWheelSound();

  const stopTicks = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  const startTicks = useCallback(
    (durationMs: number) => {
      stopTicks();
      const start = Date.now();
      tickIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.min(1, elapsed / durationMs);
        const ease = 1 - (1 - p) ** 2.4;
        playTick(Math.max(0, 1 - ease));
        if (p >= 1) stopTicks();
      }, 85);
    },
    [playTick, stopTicks],
  );

  const poll = useCallback(async () => {
    try {
      const d = await getPublicLiveDraw(raffleId);
      if (!firstPollDoneRef.current) {
        firstPollDoneRef.current = true;
        hadWinnerOnFirstPollRef.current = d.winner_ticket_number != null;
      }
      setData(d);
      setError(null);
      if (d.seconds_until_draw != null) {
        setCountdown(d.seconds_until_draw);
      } else {
        setCountdown(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar sorteio.");
    } finally {
      setLoading(false);
    }
  }, [raffleId]);

  useEffect(() => {
    void poll();
  }, [poll]);

  useEffect(() => {
    if (!data) return;
    const fast =
      data.status === "sold_out" &&
      data.winner_ticket_number == null &&
      (data.seconds_until_draw ?? 0) <= 0;
    const interval = setInterval(
      () => {
        void poll();
      },
      fast ? 900 : 2500,
    );
    return () => clearInterval(interval);
  }, [data, poll]);

  useEffect(() => {
    if (countdown == null || countdown <= 0) return;
    const t = setInterval(() => {
      setCountdown((c) => (c == null || c <= 0 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const computeRotation = useCallback((segments: PublicWheelSegmentOut[], winnerTicket: number, fullSpins: number) => {
    const n = segments.length;
    const winnerIndex = segments.findIndex((s) => s.ticket_number === winnerTicket);
    const idx = winnerIndex >= 0 ? winnerIndex : 0;
    if (n === 1) return fullSpins * 360 + Math.random() * 40;
    const slice = 360 / n;
    const degree = idx * slice + slice / 2;
    const jitter = (Math.random() - 0.5) * slice * 0.28;
    return fullSpins * 360 + (360 - degree) + jitter;
  }, []);

  const runSpinToWinner = useCallback(
    async (segments: PublicWheelSegmentOut[], winnerTicket: number) => {
      if (spunForWinnerRef.current === winnerTicket) return;
      spunForWinnerRef.current = winnerTicket;
      await resume();
      const totalRotation = computeRotation(segments, winnerTicket, 7);

      setPhase("spinning");
      setTransitionEnabled(false);
      setRotationDeg(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTicks(spinMs);
          setTransitionEnabled(true);
          setRotationDeg(totalRotation);
        });
      });
      window.setTimeout(() => {
        stopTicks();
        setPhase("done");
        playWin();
      }, spinMs + 120);
    },
    [resume, spinMs, startTicks, stopTicks, playWin, computeRotation],
  );

  useEffect(() => {
    if (!data || data.segments.length === 0) return;
    const w = data.winner_ticket_number;
    const name = data.winner_full_name;
    if (w == null || !name) return;
    if (spunForWinnerRef.current === w) return;

    if (hadWinnerOnFirstPollRef.current) {
      spunForWinnerRef.current = w;
      const snap = computeRotation(data.segments, w, 0);
      setTransitionEnabled(false);
      setRotationDeg(snap);
      setPhase("done");
      return;
    }

    void runSpinToWinner(data.segments, w);
  }, [data, runSpinToWinner, computeRotation]);

  const formatHms = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-premium-muted">
        <Loader2 className="size-10 animate-spin text-premium-accent" aria-hidden />
        <p className="text-sm">A carregar sorteio ao vivo…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/25 p-6 text-center text-red-200/90">
        <p>{error}</p>
        <Link href={`/raffle/${raffleId}`} className="mt-4 inline-block text-sm text-premium-accent hover:underline">
          Voltar à rifa
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const segments = data.segments;
  const isCanceled = data.status === "canceled";
  const isActiveOnly = data.status === "active";
  const showWheel = segments.length > 0 && !isCanceled;
  const waitingAfterZero =
    data.status === "sold_out" &&
    data.winner_ticket_number == null &&
    (countdown ?? 0) <= 0;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6">
      <div className="text-center">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-premium-muted">
          Apex Keys — ao vivo
        </p>
        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-premium-text sm:text-3xl">
          {data.raffle_title}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-premium-muted">
          Transparência total: todos os números pagos entram na roleta. O sorteio é aleatório no servidor.
        </p>
      </div>

      {isCanceled && (
        <p className="rounded-lg border border-premium-border/50 bg-premium-surface/50 p-4 text-center text-sm text-premium-muted">
          Esta rifa foi cancelada.
        </p>
      )}

      {isActiveOnly && (
        <p className="rounded-lg border border-premium-border/50 bg-premium-surface/50 p-4 text-center text-sm text-premium-muted">
          A roleta ao vivo fica disponível quando todos os números estiverem{" "}
          <span className="text-premium-text">pagos</span> (não só reservados).
        </p>
      )}

      {data.status === "sold_out" && data.winner_ticket_number == null && countdown != null && countdown > 0 && (
        <div className="rounded-2xl border border-premium-accent/30 bg-gradient-to-b from-premium-accent/10 to-transparent px-6 py-10 text-center">
          <Radio className="mx-auto size-10 text-premium-accent animate-pulse" aria-hidden />
          <p className="mt-4 font-heading text-lg font-semibold text-premium-text">Sorteio em</p>
          <p className="mt-2 font-mono text-5xl font-bold tabular-nums tracking-tight text-premium-accent sm:text-6xl">
            {formatHms(countdown)}
          </p>
          <p className="mt-4 text-sm text-premium-muted">
            Quando o tempo chegar a zero, o site pede o resultado ao servidor e a roleta gira automaticamente.
          </p>
        </div>
      )}

      {waitingAfterZero && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-premium-border/60 bg-premium-surface/40 py-8">
          <Loader2 className="size-8 animate-spin text-premium-accent" aria-hidden />
          <p className="text-sm font-medium text-premium-text">A iniciar o sorteio…</p>
          <p className="max-w-sm text-center text-xs text-premium-muted">Aguarda um momento — o primeiro pedido após o horário regista o vencedor.</p>
        </div>
      )}

      {showWheel && (
        <div className="relative rounded-2xl border border-premium-border/50 bg-gradient-to-b from-premium-surface/60 to-premium-bg/90 px-4 py-10 sm:px-8">
          <RaffleWheelSvg
            segments={segments}
            rotationDeg={rotationDeg}
            transitionMs={spinMs}
            transitionEnabled={transitionEnabled}
          />

          {phase === "done" && data.winner_ticket_number != null && data.winner_full_name && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-[2px]"
              aria-live="polite"
            >
              <div className="apex-wheel-burst mx-4 max-w-md rounded-2xl border border-premium-accent/40 bg-premium-surface/95 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                <Trophy className="mx-auto size-14 text-premium-accent drop-shadow-[0_0_24px_rgba(212,175,55,0.45)]" aria-hidden />
                <p className="mt-4 font-heading text-lg font-bold text-premium-text">Vencedor</p>
                <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-premium-accent">
                  Nº {data.winner_ticket_number}
                </p>
                <p className="mt-3 text-lg font-semibold text-premium-text">{data.winner_full_name}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <Link
          href={`/raffle/${raffleId}`}
          className="rounded-lg border border-premium-border/50 px-4 py-2 text-premium-muted transition-colors hover:border-premium-accent/40 hover:text-premium-accent"
        >
          Voltar à rifa
        </Link>
      </div>
    </div>
  );
}
