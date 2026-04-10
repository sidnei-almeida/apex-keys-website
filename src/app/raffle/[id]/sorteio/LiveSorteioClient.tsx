"use client";

import { RaffleWheelSvg } from "@/components/admin/RaffleWheelSvg";
import { useWheelSound } from "@/components/admin/useWheelSound";
import { formatBrasiliaHm } from "@/lib/format-brasilia-time";
import { getPublicLiveDraw } from "@/lib/api/services";
import { resolveUserAvatarUrl } from "@/lib/resolve-user-avatar-url";
import type { PublicLiveDrawOut, PublicWheelSegmentOut } from "@/types/api";
import { ArrowLeft, Loader2, Radio } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function winnerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
}

function WinnerRevealAvatar({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl: string | null | undefined;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveUserAvatarUrl(avatarUrl);
  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  const showImg = Boolean(resolved && !failed);

  return (
    <div
      className="mx-auto size-20 overflow-hidden rounded-full border border-premium-border bg-premium-cell ring-1 ring-black/20 sm:size-24"
      aria-hidden
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL da API / CDN
        <img
          src={resolved}
          alt=""
          width={96}
          height={96}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-lg font-semibold tracking-tight text-premium-text sm:text-xl">
          {winnerInitials(fullName)}
        </div>
      )}
    </div>
  );
}

export function LiveSorteioClient({ raffleId }: { raffleId: string }) {
  const [data, setData] = useState<PublicLiveDrawOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [countdown, setCountdown] = useState<number | null>(null);
  const spinMs = useReducedSpinMs();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [rotationDeg, setRotationDeg] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const [phase, setPhase] = useState<"idle" | "spinning" | "done">("idle");
  const spunForWinnerRef = useRef<number | null>(null);
  const firstPollDoneRef = useRef(false);
  const hadWinnerOnFirstPollRef = useRef(false);

  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotationRef = useRef(0);
  const { resume, playTick, playWin } = useWheelSound();

  rotationRef.current = rotationDeg;

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
      const delta = computeRotation(segments, winnerTicket, 7);
      const from = rotationRef.current;

      setPhase("spinning");
      setTransitionEnabled(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startTicks(spinMs);
          setTransitionEnabled(true);
          setRotationDeg(from + delta);
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

  const idleSpin = useMemo(() => {
    if (!data) return false;
    const segments = data.segments;
    const isCanceled = data.status === "canceled";
    const showWheel = segments.length > 0 && !isCanceled;
    return (
      showWheel &&
      phase === "idle" &&
      data.winner_ticket_number == null &&
      !prefersReducedMotion
    );
  }, [data, phase, prefersReducedMotion]);

  useEffect(() => {
    if (idleSpin) setTransitionEnabled(false);
  }, [idleSpin]);

  useEffect(() => {
    if (!idleSpin) return;
    const id = window.setInterval(() => {
      setRotationDeg((d) => d - 0.9);
    }, 50);
    return () => clearInterval(id);
  }, [idleSpin]);

  const formatHms = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const backHref = `/raffle/${raffleId}`;
  const backLinkClass =
    "inline-flex items-center gap-2 text-sm text-premium-muted transition-colors hover:text-premium-text";

  if (loading && !data) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-premium-border" aria-hidden />
          <p className="text-xs text-premium-muted">Carregando…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link href={backHref} className={backLinkClass}>
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Voltar à rifa
        </Link>
        <div className="mt-8 rounded-xl border border-red-900/40 bg-red-950/20 p-6 text-center">
          <p className="text-sm text-red-200/90">{error}</p>
        </div>
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

  const showCountdown =
    data.status === "sold_out" && data.winner_ticket_number == null && countdown != null && countdown > 0;

  const winnerReady =
    phase === "done" && data.winner_ticket_number != null && data.winner_full_name;

  const scheduledBrasiliaHm = formatBrasiliaHm(data.scheduled_live_draw_at);

  return (
    <div className="w-full px-3 pb-16 pt-8 sm:px-5 sm:pt-10">
      <div className="mx-auto max-w-[min(100%,88rem)]">
        <Link href={backHref} className={backLinkClass}>
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Voltar à rifa
        </Link>

        <header className="mt-8 max-w-2xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-premium-muted">
            Ao vivo
          </p>
          <h1 className="mt-1 font-heading text-xl font-semibold tracking-tight text-premium-text sm:text-2xl">
            {data.raffle_title}
          </h1>
        </header>

        {showCountdown && (
          <div
            className="mt-8 flex max-w-md flex-col gap-3 border-l border-premium-accent/35 pl-5 sm:pl-6"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-premium-muted">
              <Radio className="size-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="text-xs font-medium tracking-wide">Até o sorteio</span>
            </div>
            <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-premium-text sm:text-5xl">
              {formatHms(countdown)}
            </p>
            {scheduledBrasiliaHm ? (
              <p className="text-[11px] leading-relaxed text-premium-muted/90">
                Sorteio previsto às{" "}
                <span className="font-medium text-premium-text/90">{scheduledBrasiliaHm}</span>{" "}
                (horário de Brasília)
              </p>
            ) : null}
            <p className="text-xs leading-relaxed text-premium-muted">
              A roleta gira automaticamente quando o tempo zerar.
            </p>
          </div>
        )}

        {isCanceled && (
          <p className="mt-10 max-w-md text-sm text-premium-muted">Esta rifa foi cancelada.</p>
        )}

        {isActiveOnly && (
          <p className="mt-10 max-w-md text-sm text-premium-muted">
            A roleta aparece quando todos os números estiverem{" "}
            <span className="text-premium-text">pagos</span>.
          </p>
        )}

        {waitingAfterZero && (
          <div className="mt-10 flex max-w-md flex-col gap-2">
            <Loader2 className="size-6 animate-spin text-premium-border" aria-hidden />
            <p className="text-sm text-premium-text">Preparando o sorteio…</p>
            <p className="text-xs text-premium-muted">Aguarde um instante.</p>
          </div>
        )}

        {showWheel && (
          <div className="relative mx-auto mt-12 w-full sm:mt-14">
            {phase === "spinning" ? (
              <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-premium-muted">
                Sorteando
              </p>
            ) : null}
            <RaffleWheelSvg
              variant="live"
              segments={segments}
              rotationDeg={rotationDeg}
              transitionMs={spinMs}
              transitionEnabled={transitionEnabled}
            />
          </div>
        )}

        <p className="mt-14 text-center">
          <Link href={backHref} className={`${backLinkClass} text-xs`}>
            <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
            Voltar à rifa
          </Link>
        </p>
      </div>

      {winnerReady ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-premium-bg/80 p-4 backdrop-blur-sm"
          aria-live="polite"
          role="dialog"
          aria-label="Resultado do sorteio"
        >
          <div className="apex-wheel-burst w-full max-w-sm rounded-2xl border border-premium-border bg-premium-surface px-8 py-9 text-center shadow-[0_32px_64px_rgba(0,0,0,0.5)] sm:max-w-md">
            <WinnerRevealAvatar
              fullName={data.winner_full_name ?? ""}
              avatarUrl={data.winner_avatar_url}
            />
            <h2 className="mt-6 font-heading text-xs font-semibold uppercase tracking-[0.22em] text-premium-accent">
              Vencedor da rifa
            </h2>
            <p className="mt-3 break-words font-heading text-lg font-semibold text-premium-text sm:text-xl">
              {data.winner_full_name}
            </p>
            <p className="mt-5 font-mono text-base font-medium tabular-nums text-premium-accent sm:text-lg">
              Nº {data.winner_ticket_number}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
