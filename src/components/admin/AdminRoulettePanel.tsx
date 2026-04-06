"use client";

import { adminDrawRandom, adminGetWheelSegments, getRaffles } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { AdminWheelSegmentOut, AdminWheelSegmentsOut, RaffleListOut } from "@/types/api";
import { ApiError } from "@/lib/api/http";
import { Loader2, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RaffleWheelSvg } from "./RaffleWheelSvg";
import { useWheelSound } from "./useWheelSound";

const SPIN_MS_DEFAULT = 9000;
const SPIN_MS_REDUCED = 450;

function eligibleForDraw(r: RaffleListOut): boolean {
  return r.status === "sold_out" && r.winning_ticket_number == null;
}

export function AdminRoulettePanel() {
  const [raffles, setRaffles] = useState<RaffleListOut[]>([]);
  const [rafflesLoading, setRafflesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [wheelData, setWheelData] = useState<AdminWheelSegmentsOut | null>(null);
  const [wheelLoading, setWheelLoading] = useState(false);
  const [wheelError, setWheelError] = useState<string | null>(null);

  const [rotationDeg, setRotationDeg] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);

  const [phase, setPhase] = useState<"idle" | "spinning" | "celebration">("idle");
  const [winner, setWinner] = useState<{
    ticket: number;
    name: string;
    userId: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [drawLoading, setDrawLoading] = useState(false);

  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { resume, playTick, playWin } = useWheelSound();
  const [spinMs, setSpinMs] = useState(SPIN_MS_DEFAULT);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setSpinMs(mq.matches ? SPIN_MS_REDUCED : SPIN_MS_DEFAULT);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const loadRaffles = useCallback(async () => {
    setRafflesLoading(true);
    try {
      const list = await getRaffles();
      setRaffles(
        list.filter((r) => r.status === "active" || r.status === "sold_out" || r.status === "finished"),
      );
    } catch {
      setRaffles([]);
    } finally {
      setRafflesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRaffles();
  }, [loadRaffles]);

  const loadWheel = useCallback(async (raffleId: string) => {
    const token = getAccessToken();
    if (!token || !raffleId) return;
    setWheelLoading(true);
    setWheelError(null);
    setWinner(null);
    setPhase("idle");
    setRotationDeg(0);
    setTransitionEnabled(false);
    try {
      const data = await adminGetWheelSegments(token, raffleId);
      setWheelData(data);
    } catch (e) {
      setWheelData(null);
      setWheelError(
        e instanceof ApiError ? e.message : "Não foi possível carregar os bilhetes desta rifa.",
      );
    } finally {
      setWheelLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setWheelData(null);
      return;
    }
    void loadWheel(selectedId);
  }, [selectedId, loadWheel]);

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
        const intensity = Math.max(0, 1 - ease);
        playTick(intensity);
        if (p >= 1) stopTicks();
      }, 85);
    },
    [playTick, stopTicks],
  );

  useEffect(() => () => stopTicks(), [stopTicks]);

  const segments: AdminWheelSegmentOut[] = wheelData?.segments ?? [];
  const selectedRaffle = raffles.find((r) => r.id === selectedId);
  const canSpin =
    phase === "idle" &&
    !!wheelData &&
    wheelData.winning_ticket_number == null &&
    segments.length > 0 &&
    !!selectedRaffle &&
    eligibleForDraw(selectedRaffle);

  const runDraw = useCallback(async () => {
    if (!selectedId || !canSpin) return;
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    setDrawLoading(true);
    setWinner(null);
    await resume();

    let winnerIndex = 0;
    let resTicket = 0;
    let resName = "";
    let resUserId = "";

    try {
      const res = await adminDrawRandom(token, selectedId);
      resTicket = res.winner_ticket_number;
      resName = res.winner_full_name;
      resUserId = res.winner_user_id;
      const idx = segments.findIndex((s) => s.ticket_number === resTicket);
      winnerIndex = idx >= 0 ? idx : 0;
    } catch (e) {
      setDrawLoading(false);
      setActionError(e instanceof ApiError ? e.message : "Falha no sorteio.");
      return;
    }

    const n = segments.length;
    const fullSpins = 7;
    const totalRotation =
      n === 1
        ? fullSpins * 360 + Math.random() * 40
        : (() => {
            const slice = 360 / n;
            const degree = winnerIndex * slice + slice / 2;
            const jitter = (Math.random() - 0.5) * slice * 0.28;
            return fullSpins * 360 + (360 - degree) + jitter;
          })();

    setDrawLoading(false);
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
      setPhase("celebration");
      setWinner({ ticket: resTicket, name: resName, userId: resUserId });
      playWin();
      void loadRaffles();
    }, spinMs + 120);
  }, [selectedId, canSpin, segments, resume, startTicks, stopTicks, playWin, loadRaffles, spinMs]);

  const inputClass =
    "w-full rounded-lg border border-premium-border bg-premium-surface px-3 py-2.5 text-sm text-premium-text focus:border-premium-accent focus:outline-none focus:ring-1 focus:ring-premium-accent/35";

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-premium-border/60 bg-premium-surface/40 p-5 sm:p-6">
        <h3 className="font-heading text-sm font-semibold text-premium-text">
          Rifa e bilhetes
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-premium-muted">
          No site público, quando a rifa esgota com{" "}
          <span className="font-medium text-premium-text">100% de cotas pagas</span>, abre-se automaticamente
          uma janela de <span className="font-medium text-premium-accent/90">10 minutos</span> com countdown em{" "}
          <span className="font-mono text-xs">/raffle/…/sorteio</span>; os compradores recebem notificação.
          Depois disso o servidor sorteia e a roleta gira sozinha. Aqui podes forçar o sorteio manualmente antes
          do tempo (ou se o automático falhar) — só rifas{" "}
          <span className="font-medium text-premium-accent/90">sold out</span> sem vencedor.
        </p>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1">
            <span className="mb-1 block text-xs font-medium text-premium-muted">Rifa</span>
            <select
              className={inputClass}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={rafflesLoading}
            >
              <option value="">— Selecionar —</option>
              {raffles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.status}
                  {r.winning_ticket_number != null ? ` · nº ${r.winning_ticket_number}` : ""})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => selectedId && void loadWheel(selectedId)}
            disabled={!selectedId || wheelLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-premium-border/45 px-4 py-2.5 text-sm font-medium text-premium-muted/75 transition-colors hover:border-premium-border/70 hover:text-premium-text disabled:opacity-40"
          >
            {wheelLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            Atualizar bilhetes
          </button>
        </div>

        {wheelError && (
          <p className="mt-4 text-sm text-red-400/90" role="alert">
            {wheelError}
          </p>
        )}
      </section>

      {selectedId && wheelData && (
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-start">
          <div className="relative rounded-2xl border border-premium-border/50 bg-gradient-to-b from-premium-surface/80 to-premium-bg/90 px-4 py-10 sm:px-8">
            <RaffleWheelSvg
              segments={segments}
              rotationDeg={rotationDeg}
              transitionMs={spinMs}
              transitionEnabled={transitionEnabled}
            />

            {phase === "celebration" && winner && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 backdrop-blur-[2px]"
                aria-live="polite"
              >
                <div className="apex-wheel-burst mx-4 max-w-md rounded-2xl border border-premium-accent/40 bg-premium-surface/95 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                  <Trophy className="mx-auto size-14 text-premium-accent drop-shadow-[0_0_24px_rgba(212,175,55,0.5)]" aria-hidden />
                  <p className="mt-4 font-heading text-lg font-bold text-premium-text">Temos um vencedor!</p>
                  <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-premium-accent">
                    Nº {winner.ticket}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-premium-text">{winner.name}</p>
                  <p className="mt-4 text-xs text-premium-muted">
                    Resultado registado na rifa — a vitrine e o hall podem actualizar após refresh.
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 rounded-xl border border-premium-border/45 bg-premium-surface/30 p-5">
            <div className="flex items-center gap-2 text-premium-accent">
              <Sparkles className="size-5 shrink-0" aria-hidden />
              <span className="font-heading text-sm font-semibold tracking-wide">Controlo</span>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-premium-muted">Rifa</dt>
                <dd className="text-right font-medium text-premium-text">{wheelData.raffle_title}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-premium-muted">Estado</dt>
                <dd className="text-right text-premium-text">{wheelData.raffle_status}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-premium-muted">Bilhetes na roleta</dt>
                <dd className="font-mono text-premium-text">{segments.length}</dd>
              </div>
            </dl>

            {actionError && (
              <p className="text-sm text-red-400/90" role="alert">
                {actionError}
              </p>
            )}

            <button
              type="button"
              disabled={!canSpin || drawLoading}
              onClick={() => void runDraw()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-premium-accent py-3.5 text-sm font-bold text-[#0A0A0A] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {drawLoading ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-5" aria-hidden />
              )}
              Girar e sortear agora
            </button>

            {selectedRaffle && !eligibleForDraw(selectedRaffle) && (
              <p className="text-xs leading-relaxed text-premium-muted">
                {selectedRaffle.status !== "sold_out"
                  ? "Esta rifa ainda não está esgotada. O sorteio só é permitido quando todas as cotas forem vendidas."
                  : selectedRaffle.winning_ticket_number != null
                    ? "Esta rifa já foi sorteada."
                    : null}
              </p>
            )}

            {segments.length === 0 && !wheelLoading && (
              <p className="text-xs text-premium-muted">Nenhum bilhete pago nesta rifa.</p>
            )}
          </aside>
        </div>
      )}

    </div>
  );
}
