"use client";

import { RaffleWheelSvg, type WheelVisualEnergy } from "@/components/admin/RaffleWheelSvg";
import { useWheelSound } from "@/components/admin/useWheelSound";
import { useRouletteBackgroundMusic } from "@/hooks/useRouletteBackgroundMusic";
import { formatBrasiliaHm } from "@/lib/format-brasilia-time";
import { getPublicLiveDraw, getRaffleById } from "@/lib/api/services";
import { resolveUserAvatarUrl } from "@/lib/resolve-user-avatar-url";
import type { PublicLiveDrawOut, PublicWheelSegmentOut, RaffleDetailOut } from "@/types/api";
import { ArrowLeft, Gift, Loader2, Radio, Ticket, Timer, Users } from "lucide-react";
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
    <div className="relative mx-auto w-fit" aria-hidden>
      <div
        className="pointer-events-none absolute -inset-[1.1rem] rounded-full bg-[radial-gradient(circle_at_50%_36%,rgba(225,192,98,0.3)_0%,rgba(110,88,42,0.1)_48%,transparent_72%)] sm:-inset-6"
        aria-hidden
      />
      <div
        className="relative size-[6.125rem] rounded-full p-[3px] shadow-[inset_0_0_0_1px_rgba(255,248,220,0.32),0_0_0_1px_rgba(0,0,0,0.88),0_0_42px_rgba(195,162,72,0.26)] sm:size-[7.625rem]"
        style={{
          background:
            "linear-gradient(142deg, rgba(255,236,175,0.88) 0%, rgba(215,182,88,0.62) 28%, rgba(120,98,48,0.72) 62%, rgba(22,18,10,0.96) 100%)",
        }}
      >
        <div className="size-full overflow-hidden rounded-full bg-[#030303] ring-1 ring-black">
          {showImg ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL da API / CDN
            <img
              src={resolved}
              alt=""
              width={122}
              height={122}
              className="size-full object-cover"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,#1a1814_0%,#080808_100%)] text-lg font-bold tracking-tight text-[rgba(230,200,120,0.92)] sm:text-2xl">
              {winnerInitials(fullName)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCountdownHms(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LiveSorteioClient({ raffleId }: { raffleId: string }) {
  const [data, setData] = useState<PublicLiveDrawOut | null>(null);
  const [raffleMeta, setRaffleMeta] = useState<RaffleDetailOut | null>(null);
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
    let cancelled = false;
    void getRaffleById(raffleId)
      .then((r) => {
        if (!cancelled) setRaffleMeta(r);
      })
      .catch(() => {
        if (!cancelled) setRaffleMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [raffleId]);

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

  const rouletteMusicActive = useMemo(() => {
    if (!data) return false;
    if (data.status !== "sold_out" || data.segments.length === 0) return false;
    return phase !== "done";
  }, [data, phase]);

  const prevCountdownRef = useRef<number | null>(null);
  useEffect(() => {
    const prev = prevCountdownRef.current;
    if (countdown != null && countdown > 0 && (prev == null || prev <= 0)) {
      console.log("[roulette-music] LiveSorteio: countdown visível (>0)", countdown);
    }
    prevCountdownRef.current = countdown;
  }, [countdown]);

  useEffect(() => {
    console.log("[roulette-music] LiveSorteio: shouldPlay BGM =", rouletteMusicActive, {
      prefersReducedMotion,
      phase,
      status: data?.status,
      segments: data?.segments?.length ?? 0,
    });
  }, [rouletteMusicActive, prefersReducedMotion, phase, data?.status, data?.segments?.length]);

  useRouletteBackgroundMusic(rouletteMusicActive, {
    disabled: prefersReducedMotion,
  });

  const wheelVisualEnergy = useMemo((): WheelVisualEnergy => {
    if (!data || data.segments.length === 0) return "idle";
    if (phase === "done" && data.winner_ticket_number != null) return "celebrate";
    if (phase === "spinning") return "active";
    const waitingAfterTimer =
      data.status === "sold_out" &&
      data.winner_ticket_number == null &&
      (countdown ?? 0) <= 0;
    if (waitingAfterTimer) return "anticipate";
    if (
      data.status === "sold_out" &&
      countdown != null &&
      countdown > 0 &&
      countdown <= 30
    ) {
      return "anticipate";
    }
    return "idle";
  }, [data, phase, countdown]);

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

        {showCountdown && !showWheel && (
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

        {waitingAfterZero && !showWheel && (
          <div className="mt-10 flex max-w-md flex-col gap-2">
            <Loader2 className="size-6 animate-spin text-premium-border" aria-hidden />
            <p className="text-sm text-premium-text">Preparando o sorteio…</p>
            <p className="text-xs text-premium-muted">Aguarde um instante.</p>
          </div>
        )}

        {showWheel && (
          <div className="apex-live-sorteio-stage mt-12 sm:mt-14">
            <div className="relative z-[1] grid grid-cols-2 gap-2 px-1 sm:gap-3 sm:px-2">
              <div className="apex-live-sorteio-stat flex flex-col gap-1 px-2.5 py-2.5 sm:px-3 sm:py-3">
                <div className="flex items-center gap-1.5 text-[rgba(255,220,160,0.75)]">
                  <Ticket className="size-3.5 shrink-0 sm:size-4" strokeWidth={1.75} aria-hidden />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-300/95 sm:text-[10px]">
                    Números vendidos
                  </span>
                </div>
                <p className="apex-live-sorteio-stat-value text-lg tabular-nums sm:text-2xl">
                  {raffleMeta?.sold ?? segments.length}{" "}
                  <span className="text-sm font-medium text-zinc-500 sm:text-base">/</span>{" "}
                  <span className="text-base text-zinc-400 sm:text-xl">
                    {raffleMeta?.total_tickets ?? "—"}
                  </span>
                </p>
              </div>
              <div className="apex-live-sorteio-stat flex flex-col gap-1 px-2.5 py-2.5 sm:px-3 sm:py-3">
                <div className="flex items-center gap-1.5 text-[rgba(255,220,160,0.75)]">
                  <Ticket className="size-3.5 shrink-0 sm:size-4" strokeWidth={1.75} aria-hidden />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-300/95 sm:text-[10px]">
                    Valor do número
                  </span>
                </div>
                <p className="apex-live-sorteio-stat-value text-lg sm:text-2xl">
                  {raffleMeta?.ticket_price ?? "—"}
                </p>
              </div>
            </div>

            <p
              className="relative z-[1] mt-3 text-center text-[10px] font-medium uppercase tracking-[0.28em] text-[rgba(200,160,70,0.55)] sm:mt-4 sm:text-[11px]"
              aria-live="polite"
            >
              {phase === "spinning"
                ? "Sorteando…"
                : phase === "done" && data.winner_ticket_number != null
                  ? "Sorteio concluído"
                  : "Aguarde o sorteio…"}
            </p>

            <div className="relative z-[1] mx-auto mt-1 flex w-full max-w-[min(100%,32rem)] justify-center px-0 pt-2 sm:mt-2 sm:px-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- mascote decorativo em public */}
              <img
                src="/images/cat2.png"
                alt=""
                className="pointer-events-none absolute -left-1 bottom-0 z-10 hidden w-[min(42%,11.5rem)] max-w-none select-none drop-shadow-[0_16px_40px_rgba(0,0,0,0.7)] sm:block md:-left-2 md:w-[min(44%,13rem)] lg:-left-4 lg:w-[min(46%,15rem)]"
              />
              <div className="relative w-[min(100%,26rem)] sm:w-[min(100%,28rem)]">
                <RaffleWheelSvg
                  variant="live"
                  maxWidthClassName="w-full"
                  segments={segments}
                  rotationDeg={rotationDeg}
                  transitionMs={spinMs}
                  transitionEnabled={transitionEnabled}
                  highlightTicketNumber={data.winner_ticket_number ?? null}
                  emphasizeWinner={
                    phase === "done" && data.winner_ticket_number != null
                  }
                  visualEnergy={wheelVisualEnergy}
                />
              </div>
            </div>

            <div className="relative z-[1] mx-1 mt-5 grid grid-cols-1 gap-2 rounded-lg border border-[rgba(212,175,55,0.22)] bg-black/35 px-2 py-2.5 sm:mx-2 sm:mt-6 sm:grid-cols-3 sm:px-3 sm:py-3">
              <div className="flex items-center gap-2.5 border-b border-[rgba(212,175,55,0.12)] pb-2 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
                <Timer
                  className="size-5 shrink-0 text-[rgba(255,200,100,0.85)]"
                  strokeWidth={1.65}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-400 sm:text-[10px]">
                    Próximo sorteio em
                  </p>
                  <p
                    className="mt-0.5 font-mono text-base font-semibold tabular-nums tracking-tight text-[#ffd75a] sm:text-lg"
                    style={{
                      textShadow: "0 0 14px rgba(255,190,80,0.4)",
                    }}
                  >
                    {showCountdown && countdown != null && countdown > 0
                      ? formatCountdownHms(countdown)
                      : phase === "spinning"
                        ? "······"
                        : "00:00:00"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-b border-[rgba(212,175,55,0.12)] pb-2 sm:border-b-0 sm:border-r sm:pb-0 sm:px-1 sm:pr-3">
                <Users
                  className="size-5 shrink-0 text-[rgba(255,200,100,0.85)]"
                  strokeWidth={1.65}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-400 sm:text-[10px]">
                    Participantes
                  </p>
                  <p
                    className="mt-0.5 font-mono text-base font-semibold tabular-nums text-[#ffd75a] sm:text-lg"
                    style={{
                      textShadow: "0 0 14px rgba(255,190,80,0.35)",
                    }}
                  >
                    {segments.length}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pt-0.5 sm:pt-0">
                <Gift
                  className="size-5 shrink-0 text-[rgba(255,200,100,0.85)]"
                  strokeWidth={1.65}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-400 sm:text-[10px]">
                    Prêmio
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-zinc-100 sm:text-[0.95rem]">
                    {data.raffle_title}
                  </p>
                </div>
              </div>
            </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/[0.9] p-4"
          aria-live="polite"
          role="dialog"
          aria-label="Resultado do sorteio"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_92%_78%_at_50%_44%,transparent_26%,rgba(0,0,0,0.68)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_46%_at_50%_38%,rgba(210,178,88,0.26)_0%,rgba(88,72,36,0.09)_46%,transparent_64%)]"
            aria-hidden
          />
          <div className="apex-wheel-burst relative z-10 w-full max-w-sm sm:max-w-md">
            <div
              className="pointer-events-none absolute left-1/2 top-[38%] -z-10 h-[min(100vw,30rem)] w-[min(100vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(205,172,78,0.32)_0%,rgba(72,58,28,0.12)_38%,transparent_62%)]"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-2xl border-0 bg-transparent text-center shadow-[0_0_60px_rgba(168,142,62,0.14),0_36px_80px_rgba(0,0,0,0.82)]">
              <div
                className="relative rounded-2xl bg-[radial-gradient(ellipse_108%_100%_at_50%_10%,#252218_0%,#14110c_24%,#070605_52%,#000000_100%)] shadow-[inset_0_1px_0_rgba(255,248,220,0.1),inset_0_18px_36px_rgba(0,0,0,0.42),inset_0_-28px_56px_rgba(0,0,0,0.78),inset_0_0_0_1px_rgba(255,236,190,0.06),0_0_0_1px_rgba(228,200,108,0.38),0_0_0_2px_rgba(0,0,0,0.94),0_0_32px_rgba(175,148,68,0.1)]"
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(255,240,205,0.09)_0%,transparent_20%,transparent_46%,rgba(0,0,0,0.52)_100%)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,250,235,0.055),inset_0_32px_64px_rgba(0,0,0,0.22)]"
                  aria-hidden
                />
                <div className="relative px-7 pb-10 pt-9 sm:px-10 sm:pb-11 sm:pt-10">
                  <WinnerRevealAvatar
                    fullName={data.winner_full_name ?? ""}
                    avatarUrl={data.winner_avatar_url}
                  />
                  <div
                    className="mx-auto mt-7 h-px max-w-[11rem] bg-gradient-to-r from-transparent via-[rgba(218,188,98,0.38)] to-transparent sm:mt-8 sm:max-w-[13rem]"
                    aria-hidden
                  />
                  <h2 className="mt-[1.125rem] font-heading text-[10px] font-semibold uppercase tracking-[0.52em] text-[rgba(168,145,78,0.58)] sm:mt-5 sm:text-[11px]">
                    Vencedor da rifa
                  </h2>
                  <p className="mt-3.5 break-words font-heading text-[1.375rem] font-black leading-snug tracking-[-0.025em] text-white sm:mt-4 sm:text-[2rem]">
                    {data.winner_full_name}
                  </p>
                  <div
                    className="mx-auto mt-[1.35rem] h-px max-w-[17rem] bg-gradient-to-r from-transparent via-[rgba(205,178,95,0.22)] to-transparent sm:mt-6"
                    aria-hidden
                  />
                  <div className="mt-[1.125rem] flex justify-center sm:mt-5">
                    <div className="relative inline-flex min-w-[11.5rem] items-center justify-center rounded-xl px-8 py-[1.05rem] shadow-[inset_0_1px_0_rgba(255,236,200,0.12),inset_0_2px_3px_rgba(255,220,160,0.05),inset_0_-16px_32px_rgba(0,0,0,0.88),0_0_0_1px_rgba(0,0,0,0.92),0_0_28px_rgba(165,138,58,0.1)] sm:min-w-[13.5rem] sm:px-10 sm:py-5">
                      <div
                        className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(172deg,rgba(28,26,20,0.99)_0%,#030303_42%,#000000_100%)]"
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute inset-px rounded-[11px] bg-[linear-gradient(180deg,rgba(255,238,200,0.085)_0%,transparent_32%,transparent_55%,rgba(0,0,0,0.35)_100%)] shadow-[inset_0_0_20px_rgba(210,175,90,0.05)]"
                        aria-hidden
                      />
                      <p className="relative bg-gradient-to-b from-[#fffef8] via-[#f2c238] to-[#4a2c06] bg-clip-text font-mono text-[2.65rem] font-black tabular-nums leading-none text-transparent drop-shadow-[0_1px_0_rgba(0,0,0,0.92)] sm:text-[3.35rem]">
                        Nº {data.winner_ticket_number}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
