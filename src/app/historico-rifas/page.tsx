"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getMyTickets } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { MyTicketOut } from "@/types/api";
import { ArrowLeft, ArrowRight, Gamepad2, History, Loader2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api/config";
import {
  HISTORICO_MODAL_NUMBER_CELL_CLASS,
  HISTORICO_TICKET_BADGE_CLASS,
} from "@/lib/raffle-number-cell-classes";

function formatBRL(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n)
    ? "R$ 0,00"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function raffleImageUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${getApiBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  sold_out: "Esgotada",
  finished: "Encerrada",
  canceled: "Cancelada",
};

/** Agrupa bilhetes por rifa */
function groupByRaffle(tickets: MyTicketOut[]): Map<string, MyTicketOut[]> {
  const map = new Map<string, MyTicketOut[]>();
  for (const t of tickets) {
    const key = t.raffle_id;
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }
  return map;
}

type RaffleTicketsModalState = {
  title: string;
  ticketNumbers: Array<number | string>;
};

function RaffleTicketsModal({
  state,
  onClose,
}: {
  state: RaffleTicketsModalState | null;
  onClose: () => void;
}) {
  const open = state !== null;
  const count = state?.ticketNumbers.length ?? 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!state) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="raffle-tickets-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-premium-border/70 bg-premium-surface/94 p-8 shadow-[0_28px_72px_-16px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(212,175,55,0.07)] ring-1 ring-premium-accent/10 sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-premium-muted/30 transition-all duration-200 hover:bg-white/[0.05] hover:text-premium-muted"
          aria-label="Fechar"
        >
          <X className="size-[1.15rem]" strokeWidth={1.75} aria-hidden />
        </button>

        <h2
          id="raffle-tickets-modal-title"
          className="pr-14 font-heading text-lg font-semibold leading-snug tracking-tight text-premium-text sm:text-xl"
        >
          {state.title}
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-premium-muted/88">
          Seus {count} bilhete{count === 1 ? "" : "s"} confirmados
        </p>

        <div className="mt-8 max-h-[min(20rem,52vh)] overflow-y-auto overscroll-y-contain rounded-lg border border-premium-border bg-premium-bg p-3 sm:p-4 [scrollbar-width:thin]">
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
            {state.ticketNumbers.map((n) => (
              <span key={String(n)} className={HISTORICO_MODAL_NUMBER_CELL_CLASS}>
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Pré-visualização: números à esquerda + reticências; ação à direita (no cartão). */
function TicketNumbersPreview({
  ticketNumbers,
  limit = 6,
  onVerTodos,
}: {
  ticketNumbers: Array<number | string>;
  limit?: number;
  onVerTodos: () => void;
}) {
  const hasMore = ticketNumbers.length > limit;
  const visible = ticketNumbers.slice(0, limit);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div
        className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5"
        aria-label="Números do bilhete"
      >
        {visible.map((n) => (
          <span key={String(n)} className={HISTORICO_TICKET_BADGE_CLASS}>
            {n}
          </span>
        ))}
        {hasMore ? (
          <button
            type="button"
            onClick={onVerTodos}
            className="select-none rounded-md px-2 py-1 text-base font-medium leading-none text-premium-muted/55 transition-colors hover:bg-premium-bg/60 hover:text-premium-text"
            aria-label="Ver todos os números dos bilhetes"
          >
            …
          </button>
        ) : null}
      </div>
      {hasMore ? (
        <button
          type="button"
          onClick={onVerTodos}
          className="group inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-lg border border-premium-border/45 bg-premium-bg/40 py-2 pl-3 pr-2.5 text-xs font-medium text-premium-muted transition-[color,background-color,border-color] duration-200 ease-out hover:border-premium-border/65 hover:bg-premium-bg/55 hover:text-premium-accent sm:self-center"
        >
          Ver todos
          <ArrowRight
            className="size-3.5 shrink-0 opacity-65 transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0.5 group-hover:opacity-90"
            strokeWidth={2}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}

export default function HistoricoRifasPage() {
  const { isReady, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<MyTicketOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketsModal, setTicketsModal] = useState<RaffleTicketsModalState | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    getMyTickets(token)
      .then(setTickets)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [isReady, isAuthenticated, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-premium-muted" aria-hidden />
      </div>
    );
  }

  const grouped = groupByRaffle(tickets);

  return (
    <div className="mx-auto w-full max-w-[min(100%,120rem)] px-4 py-12 sm:px-6 lg:px-8 xl:px-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-premium-muted transition-colors hover:text-premium-text"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Voltar
      </Link>

      <header className="mt-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-premium-text md:text-4xl">
          Histórico de Rifas
        </h1>
        <p className="mt-2 text-sm text-premium-muted md:text-base">
          {loading ? "Carregando…" : `${grouped.size} rifas no histórico`}
        </p>
        <p className="mt-1 text-sm text-premium-muted/65">
          Rifas em que você já participou (após conclusão)
        </p>
      </header>

      {loading && (
        <div className="mt-12 flex justify-center">
          <Loader2 className="size-8 animate-spin text-premium-muted" aria-hidden />
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300/90" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && grouped.size === 0 && (
        <div className="mt-12 rounded-2xl border border-premium-border/65 bg-gradient-to-br from-premium-surface/90 via-premium-bg/30 to-premium-surface/85 p-12 text-center shadow-[0_20px_56px_-20px_rgba(0,0,0,0.45)] ring-1 ring-premium-accent/10">
          <History className="mx-auto size-14 text-premium-muted/40" aria-hidden />
          <p className="mt-4 text-premium-muted/85">Nenhuma participação em rifas ainda.</p>
          <Link
            href="/rifas"
            className="mt-4 inline-block text-sm font-medium text-premium-muted transition-[color] duration-200 ease-out hover:text-premium-accent hover:underline hover:decoration-premium-accent/45 hover:underline-offset-4"
          >
            Ver rifas disponíveis
          </Link>
        </div>
      )}

      {!loading && !error && grouped.size > 0 && (
        <div className="mt-10 w-full space-y-7 md:space-y-8">
          {Array.from(grouped.entries()).map(([raffleId, list]) => {
            const r = list[0]?.raffle;
            if (!r) return null;
            const imgUrl = raffleImageUrl(r.image_url);
            const created = list[0]?.created_at;
            if (!created) return null;
            const statusLabel = STATUS_LABEL[r.status] ?? r.status;

            const ticketNumbers = list.map((t) => t.ticket_number);
            const perTicketPrice = parseFloat(String(r.ticket_price));
            const totalPaid =
              Number.isFinite(perTicketPrice) && perTicketPrice >= 0
                ? perTicketPrice * list.length
                : NaN;

            return (
              <article
                key={raffleId}
                className="group relative flex w-full flex-col overflow-hidden rounded-[1.35rem] border border-premium-border/60 bg-gradient-to-br from-premium-surface/92 via-premium-bg/92 to-premium-surface/85 shadow-[0_22px_60px_-20px_rgba(0,0,0,0.48),inset_0_0_0_1px_rgba(212,175,55,0.05)] ring-1 ring-premium-accent/10 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-premium-accent/22 hover:shadow-[0_28px_72px_-18px_rgba(0,0,0,0.52),inset_0_0_0_1px_rgba(212,175,55,0.08)] md:flex-row md:items-stretch"
              >
                {/* Imagem 16:9 + overlay escuro suave + cantos alinhados ao card */}
                <div className="relative aspect-video w-full shrink-0 overflow-hidden border-b border-premium-border/50 bg-premium-bg md:w-72 md:rounded-l-[1.35rem] md:border-b-0 md:border-r md:border-premium-border/40">
                  {imgUrl ? (
                    <>
                      <Image
                        src={imgUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 18rem"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                        unoptimized
                      />
                      <div
                        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-premium-bg/85 via-premium-bg/25 to-premium-bg/50"
                        aria-hidden
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-premium-bg to-premium-surface/80">
                      <Gamepad2
                        className="size-16 text-premium-muted/35"
                        aria-hidden
                      />
                    </div>
                  )}

                  <div className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-lg border border-premium-border/55 bg-premium-bg/88 px-2 py-1 text-[11px] font-medium text-premium-text/92 backdrop-blur-sm">
                    <span
                      className="relative inline-flex size-2 shrink-0 items-center justify-center"
                      aria-hidden
                    >
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-premium-accent/35 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-premium-accent/75" />
                    </span>
                    {statusLabel}
                  </div>
                </div>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between px-7 py-7 sm:px-8 sm:py-8 md:pl-9">
                  {/* Linha 1: título + contagem */}
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="min-w-0 flex-1 font-heading text-xl font-semibold leading-snug tracking-tight text-premium-text sm:text-2xl">
                      <span className="line-clamp-2">{r.title}</span>
                    </h2>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-premium-muted/42">
                        Bilhetes
                      </p>
                      <p className="mt-1 text-xl font-semibold tabular-nums leading-none text-premium-text sm:text-2xl">
                        {list.length}
                      </p>
                    </div>
                  </div>

                  {/* Linha 2: números + reticências (esq.) · Ver todos (dir.) */}
                  <div className="mt-6">
                    <TicketNumbersPreview
                      ticketNumbers={ticketNumbers}
                      limit={6}
                      onVerTodos={() =>
                        setTicketsModal({
                          title: r.title,
                          ticketNumbers,
                        })
                      }
                    />
                  </div>

                  {/* Linha 3: metadados em grelha */}
                  <div className="mt-8 grid grid-cols-1 gap-5 border-t border-premium-border/30 pt-7 sm:grid-cols-3 sm:items-end sm:gap-6">
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-premium-muted/40">
                        Participação
                      </p>
                      <p className="mt-1.5 text-sm text-premium-muted/72">
                        {formatDate(created)}
                      </p>
                    </div>
                    <div className="min-w-0 sm:text-center">
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-premium-muted/40">
                        Total pago
                      </p>
                      {Number.isFinite(totalPaid) ? (
                        <p className="mt-1.5 text-sm font-semibold tabular-nums text-premium-text/88">
                          {formatBRL(totalPaid)}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-sm text-premium-muted/45">—</p>
                      )}
                    </div>
                    <div className="min-w-0 sm:text-right">
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-premium-muted/40">
                        Valor da cota
                      </p>
                      <p className="mt-1.5 text-sm">
                        <span className="font-mono font-medium tabular-nums text-premium-accent/68">
                          {formatBRL(r.ticket_price)}
                        </span>
                        <span className="text-xs font-normal text-premium-muted/52">
                          {" "}
                          / cota
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <RaffleTicketsModal
        state={ticketsModal}
        onClose={() => setTicketsModal(null)}
      />
    </div>
  );
}
