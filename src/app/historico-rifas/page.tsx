"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getMyTickets } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { MyTicketOut } from "@/types/api";
import { ArrowLeft, Gamepad2, History, Loader2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api/config";

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

const chipClass =
  "flex h-7 w-[2.1rem] shrink-0 items-center justify-center rounded-md border border-premium-accent bg-premium-accent text-[12px] font-bold leading-none text-[#0A0A0A] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="raffle-tickets-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-premium-border bg-premium-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-premium-muted transition-colors hover:text-premium-text"
          aria-label="Fechar"
        >
          <X className="size-5" aria-hidden />
        </button>

        <h2
          id="raffle-tickets-modal-title"
          className="pr-12 font-heading text-xl font-bold tracking-tight text-premium-text"
        >
          {state.title}
        </h2>
        <p className="mt-1 text-sm text-premium-muted">
          Seus {count} bilhete{count === 1 ? "" : "s"} confirmados
        </p>

        <div className="mt-6 max-h-64 overflow-y-auto rounded-lg border border-premium-border bg-premium-bg p-3 pr-2 sm:p-4 [scrollbar-width:thin]">
          <div className="grid grid-cols-5 justify-items-center gap-2 sm:grid-cols-8 md:grid-cols-10">
            {state.ticketNumbers.map((n) => (
              <span key={String(n)} className={chipClass}>
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketChips({
  ticketNumbers,
  limit = 5,
  onVerTodos,
  className,
}: {
  ticketNumbers: Array<number | string>;
  limit?: number;
  onVerTodos: () => void;
  className?: string;
}) {
  const hasMore = ticketNumbers.length > limit;
  const visible = ticketNumbers.slice(0, limit);

  return (
    <div
      className={`flex min-h-[2.15rem] flex-wrap gap-2 ${className ?? ""}`}
      aria-label="Números do bilhete"
    >
      {visible.map((n) => (
        <span key={String(n)} className={chipClass}>
          {n}
        </span>
      ))}

      {hasMore ? (
        <button
          type="button"
          onClick={onVerTodos}
          className="self-center rounded-lg border border-premium-accent/45 bg-transparent px-3 py-1 text-[12px] font-bold text-premium-accent transition-colors hover:bg-premium-accent hover:text-[#0A0A0A]"
        >
          Ver todos
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
        <p className="mt-1 text-sm text-premium-muted/90">
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
        <div className="mt-12 rounded-xl border border-premium-border bg-premium-surface p-12 text-center">
          <History className="mx-auto size-14 text-premium-muted/50" aria-hidden />
          <p className="mt-4 text-premium-muted">Nenhuma participação em rifas ainda.</p>
          <Link
            href="/rifas"
            className="mt-4 inline-block text-sm font-medium text-premium-accent hover:underline"
          >
            Ver rifas disponíveis
          </Link>
        </div>
      )}

      {!loading && !error && grouped.size > 0 && (
        <div className="mt-10 w-full space-y-4">
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
                className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-premium-border bg-premium-surface shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:border-premium-muted/40 md:flex-row md:items-stretch"
              >
                {/* Âncora de altura: 16:9, sem padding — imagem colada à esquerda */}
                <div className="relative aspect-video w-full shrink-0 overflow-hidden border-b border-premium-border bg-premium-bg md:w-72 md:border-b-0 md:border-r">
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 18rem"
                      className="absolute inset-0 h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-premium-bg">
                      <Gamepad2
                        className="size-16 text-premium-muted/45"
                        aria-hidden
                      />
                    </div>
                  )}

                  <div className="absolute right-2 top-2 z-10 inline-flex items-center gap-2 rounded-md border border-premium-border bg-premium-bg/95 px-2 py-0.5 text-xs font-medium text-premium-text backdrop-blur-sm">
                    <span
                      className="relative inline-flex size-2.5 items-center justify-center"
                      aria-hidden
                    >
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-premium-accent/60 opacity-95" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-premium-accent/90" />
                    </span>
                    {statusLabel}
                  </div>
                </div>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between p-5">
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                        <h2 className="truncate font-heading text-lg font-bold text-premium-text">
                          {r.title}
                        </h2>
                        <div className="mt-2">
                          <TicketChips
                            ticketNumbers={ticketNumbers}
                            limit={5}
                            className="mt-0"
                            onVerTodos={() =>
                              setTicketsModal({
                                title: r.title,
                                ticketNumbers,
                              })
                            }
                          />
                        </div>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold text-premium-text">
                        Você tem {list.length} bilhete
                        {list.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex shrink-0 flex-wrap items-end justify-between gap-x-4 gap-y-2 text-sm text-premium-muted">
                    <p className="min-w-0">
                      Participação em {formatDate(created)}
                    </p>
                    {Number.isFinite(totalPaid) ? (
                      <p className="text-center">
                        Total pago:{" "}
                        <span className="font-semibold text-premium-text">
                          {formatBRL(totalPaid)}
                        </span>
                      </p>
                    ) : (
                      <span className="text-center text-premium-muted/70">—</span>
                    )}
                    <p className="text-right font-mono font-semibold tabular-nums text-premium-text">
                      {formatBRL(r.ticket_price)}{" "}
                      <span className="text-premium-accent/90">/ cota</span>
                    </p>
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
