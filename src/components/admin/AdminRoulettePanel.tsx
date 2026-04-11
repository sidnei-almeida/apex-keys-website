"use client";

import { getApiBaseUrl } from "@/lib/api/config";
import { adminDrawRandom, adminGetWheelSegments, getRaffles } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { AdminWheelSegmentOut, AdminWheelSegmentsOut, RaffleListOut } from "@/types/api";
import { ApiError } from "@/lib/api/http";
import { Disc3, Loader2, RefreshCw, Search, Sparkles, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RaffleWheelSvg } from "./RaffleWheelSvg";
import { useWheelSound } from "./useWheelSound";

const SPIN_MS_DEFAULT = 9000;
const SPIN_MS_REDUCED = 450;

function eligibleForDraw(r: RaffleListOut): boolean {
  return r.status === "sold_out" && r.winning_ticket_number == null;
}

function raffleCoverUrl(url: string | null | undefined): string | undefined {
  const u = url?.trim();
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  const base = getApiBaseUrl().replace(/\/+$/, "");
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

function StatusBadge({ status }: { status: string }) {
  const specs: Record<string, { label: string; className: string }> = {
    active: {
      label: "Ativa",
      className:
        "border-premium-accent/40 bg-premium-accent/10 text-premium-accent",
    },
    sold_out: {
      label: "Esgotada",
      className:
        "border-premium-border/50 bg-premium-surface/70 text-premium-text",
    },
    finished: {
      label: "Encerrada",
      className: "border-premium-border/40 bg-premium-bg/60 text-premium-muted",
    },
    canceled: {
      label: "Cancelada",
      className: "border-red-900/40 bg-red-950/25 text-red-300/90",
    },
  };
  const s = specs[status] ?? {
    label: status,
    className: "border-white/10 bg-white/[0.04] text-premium-muted",
  };
  return (
    <span
      className={`inline-flex shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.className}`}
    >
      {s.label}
    </span>
  );
}

export function AdminRoulettePanel() {
  const [raffles, setRaffles] = useState<RaffleListOut[]>([]);
  const [rafflesLoading, setRafflesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredRaffles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return raffles;
    return raffles.filter((r) => r.title.toLowerCase().includes(q));
  }, [raffles, searchQuery]);

  const loadWheel = useCallback(async (raffleId: string) => {
    if (!raffleId) return;
    const token = getAccessToken();
    if (!token) {
      setWheelData(null);
      setWheelError("Sessão inválida ou expirada. Atualize a página e inicia sessão de novo.");
      setWheelLoading(false);
      return;
    }
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
      setWheelError(null);
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

  const searchInputClass =
    "w-full rounded-lg border border-white/[0.08] bg-premium-bg/80 py-2.5 pl-9 pr-3 text-sm text-premium-text placeholder:text-premium-muted/50 focus:border-premium-accent/35 focus:outline-none focus:ring-1 focus:ring-premium-accent/20";

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-premium-border/60 bg-premium-surface/40 p-5 sm:p-6">
        <h3 className="font-heading text-sm font-semibold text-premium-text">
          Rifa e bilhetes
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-premium-muted">
          No site público, quando a rifa esgota com{" "}
          <span className="font-medium text-premium-text">100% de cotas pagas</span>, abre-se automaticamente
          uma janela de espera (por omissão{" "}
          <span className="font-medium text-premium-accent/90">30 min</span> na API para desenvolvimento; em
          produção definir <span className="font-mono text-[0.65rem]">LIVE_DRAW_DELAY_MINUTES=5</span>) com
          countdown em{" "}
          <span className="font-mono text-xs">/raffle/…/sorteio</span> (referência de horário:{" "}
          <span className="font-medium text-premium-text">Brasília</span>); os compradores recebem notificação.
          Depois disso o servidor sorteia e a roleta gira sozinha. Aqui podes forçar o sorteio manualmente antes
          do tempo (ou se o automático falhar) — só rifas{" "}
          <span className="font-medium text-premium-accent/90">sold out</span> sem vencedor.
        </p>
      </section>

      <div className="mx-auto mt-8 grid w-full max-w-[1600px] grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Mestre — lista de rifas */}
        <div className="flex h-[700px] flex-col overflow-hidden rounded-2xl border border-premium-border/40 bg-premium-surface/80 lg:col-span-3">
          <div className="shrink-0 border-b border-white/[0.06] p-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-premium-muted/60"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar rifa…"
                className={searchInputClass}
                autoComplete="off"
                aria-label="Buscar rifa"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2 [scrollbar-color:rgba(255,255,255,0.12)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent">
            {rafflesLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-premium-muted">
                <Loader2 className="size-7 animate-spin text-premium-accent/80" aria-hidden />
                <span className="text-xs">Carregando rifas…</span>
              </div>
            ) : filteredRaffles.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-premium-muted/80">
                {searchQuery.trim() ? "Nenhuma rifa encontrada." : "Sem rifas na lista."}
              </p>
            ) : (
              filteredRaffles.map((r) => {
                const active = selectedId === r.id;
                const cover = raffleCoverUrl(r.image_url);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg p-2.5 text-left transition-colors ${
                      active
                        ? "border border-premium-accent/25 bg-white/[0.06]"
                        : "border border-transparent hover:bg-white/5"
                    }`}
                  >
                    <div className="size-10 shrink-0 overflow-hidden rounded-md bg-premium-surface ring-1 ring-white/10">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-premium-bg">
                          <Disc3 className="size-5 text-premium-muted/50" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold leading-snug text-white sm:text-sm">{r.title}</p>
                      <div className="mt-0.5">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Palco — só a roleta */}
        <div className="flex min-h-[500px] flex-col items-center justify-center lg:col-span-6">
          {!selectedId ? (
            <div className="flex max-w-md flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-premium-surface/15 px-6 py-10 text-center">
              <Disc3 className="size-10 text-premium-muted/40" aria-hidden />
              <p className="text-base text-premium-muted">
                Selecione uma rifa na lista para carregar a roleta
              </p>
            </div>
          ) : wheelLoading ? (
            <div className="flex flex-col items-center gap-2 py-12 text-premium-muted">
              <Loader2 className="size-10 animate-spin text-premium-accent/80" aria-hidden />
              <span className="text-base">Carregando bilhetes…</span>
            </div>
          ) : wheelError ? (
            <p className="max-w-md px-2 text-center text-base text-red-400/90" role="alert">
              {wheelError}
            </p>
          ) : wheelData ? (
            <div className="relative aspect-square w-full max-w-[500px]">
              <RaffleWheelSvg
                variant="live"
                maxWidthClassName="h-full w-full max-h-full max-w-[500px]"
                segments={segments}
                rotationDeg={rotationDeg}
                transitionMs={spinMs}
                transitionEnabled={transitionEnabled}
                highlightTicketNumber={
                  phase === "celebration" && winner ? winner.ticket : null
                }
                emphasizeWinner={phase === "celebration"}
                visualEnergy={
                  phase === "celebration"
                    ? "celebrate"
                    : phase === "spinning"
                      ? "active"
                      : drawLoading
                        ? "anticipate"
                        : "idle"
                }
              />

              {phase === "celebration" && winner && (
                <div
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-full bg-premium-bg/80 backdrop-blur-[2px]"
                  aria-live="polite"
                >
                  <div className="apex-wheel-burst mx-4 w-full max-w-sm rounded-xl border border-premium-border bg-premium-surface px-6 py-7 text-center shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
                    <Trophy
                      className="mx-auto size-12 text-premium-accent opacity-90"
                      aria-hidden
                    />
                    <p className="mt-4 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-premium-accent">
                      Sorteio concluído
                    </p>
                    <p className="mt-3 font-mono text-xl font-semibold tabular-nums text-premium-accent">
                      Nº {winner.ticket}
                    </p>
                    <p className="mt-3 break-words text-base font-semibold text-premium-text">{winner.name}</p>
                    <p className="mt-4 text-sm leading-relaxed text-premium-muted">
                      Resultado registrado na rifa — atualize a página para ver a vitrine.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="max-w-md px-2 text-center text-base text-premium-muted">
              Não foi possível carregar o estado da roleta. Atualize com o botão no painel Controle ou escolha outra rifa.
            </p>
          )}
        </div>

        {/* Disparador — controle */}
        <div className="lg:col-span-3">
          {selectedId && wheelData ? (
            <aside className="w-full rounded-2xl border border-premium-border/50 bg-premium-surface p-6">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2 text-premium-accent">
                  <Sparkles className="size-5 shrink-0" aria-hidden />
                  <span className="font-heading text-lg font-semibold tracking-wide">Controle</span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadWheel(selectedId)}
                  disabled={wheelLoading}
                  title="Atualizar bilhetes"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-premium-border/45 p-2 text-premium-muted/75 transition-colors hover:border-premium-border/70 hover:text-premium-text disabled:opacity-40"
                >
                  {wheelLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="size-4" aria-hidden />
                  )}
                </button>
              </div>

              <dl className="mt-6 space-y-5 text-base">
                <div>
                  <dt className="text-premium-muted">Rifa</dt>
                  <dd className="mt-1 font-medium leading-snug text-premium-text">{wheelData.raffle_title}</dd>
                </div>
                <div>
                  <dt className="text-premium-muted">Estado</dt>
                  <dd className="mt-1 font-mono text-base text-premium-text">{wheelData.raffle_status}</dd>
                </div>
                <div>
                  <dt className="text-premium-muted">Bilhetes na roleta</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-premium-text">
                    {segments.length}
                  </dd>
                </div>
              </dl>

              {actionError && (
                <p className="mt-5 text-base text-red-400/90" role="alert">
                  {actionError}
                </p>
              )}

              <button
                type="button"
                disabled={!canSpin || drawLoading}
                onClick={() => void runDraw()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-premium-accent py-4 text-lg font-bold text-[#0A0A0A] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {drawLoading ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-5" aria-hidden />
                )}
                Girar e sortear agora
              </button>

              <div className="mt-4 space-y-2">
                {selectedRaffle &&
                  !eligibleForDraw(selectedRaffle) &&
                  (selectedRaffle.status !== "sold_out" ? (
                    <p className="text-sm leading-relaxed text-premium-muted">
                      Esta rifa ainda não está esgotada. O sorteio só é permitido quando todas as cotas forem vendidas.
                    </p>
                  ) : selectedRaffle.winning_ticket_number != null ? (
                    <p className="text-sm leading-relaxed text-premium-muted">Esta rifa já foi sorteada.</p>
                  ) : null)}

                {wheelData && segments.length === 0 && !wheelLoading && (
                  <p className="text-sm text-premium-muted">Nenhum bilhete pago nesta rifa.</p>
                )}
              </div>
            </aside>
          ) : selectedId && wheelLoading ? (
            <aside className="flex min-h-[280px] w-full items-center justify-center rounded-2xl border border-premium-border/50 bg-premium-surface p-6">
              <div className="flex flex-col items-center gap-3 text-premium-muted">
                <Loader2 className="size-10 animate-spin text-premium-accent/80" aria-hidden />
                <span className="text-base">Carregando bilhetes…</span>
              </div>
            </aside>
          ) : !selectedId ? (
            <div
              className="hidden min-h-[500px] rounded-2xl border border-dashed border-premium-border/35 bg-premium-bg/50 lg:flex lg:items-center lg:justify-center"
              aria-hidden
            >
              <p className="px-4 text-center text-sm text-premium-muted/60">Controle da roleta</p>
            </div>
          ) : (
            <aside
              className="min-h-[200px] w-full rounded-2xl border border-premium-border/40 bg-premium-bg/40 lg:min-h-[280px]"
              aria-hidden
            />
          )}
        </div>
      </div>
    </div>
  );
}
