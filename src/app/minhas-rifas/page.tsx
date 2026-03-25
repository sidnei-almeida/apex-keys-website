"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getMyTickets } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { MyTicketOut } from "@/types/api";
import { ArrowLeft, Gamepad2, Loader2, Ticket } from "lucide-react";
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

function raffleImageUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${getApiBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

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

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  sold_out: "Esgotada",
  finished: "Finalizada",
  canceled: "Cancelada",
};

function TicketChips({
  ticketNumbers,
  limit = 10,
}: {
  ticketNumbers: Array<number | string>;
  limit?: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const hasMore = ticketNumbers.length > limit;
  const visible = ticketNumbers.slice(0, limit);

  const chipClass =
    "flex h-7 w-[2.1rem] shrink-0 items-center justify-center rounded-md border border-premium-accent bg-premium-accent text-[12px] font-bold leading-none text-[#0A0A0A] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

  return (
    <>
      <div className="mt-3 flex min-h-[2.15rem] flex-wrap gap-2" aria-label="Números do bilhete">
        {visible.map((n) => (
          <span key={String(n)} className={chipClass}>
            {n}
          </span>
        ))}

        {hasMore ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="self-center rounded-lg border border-premium-accent/45 bg-transparent px-3 py-1 text-[12px] font-bold text-premium-accent transition-colors hover:bg-premium-accent hover:text-[#0A0A0A]"
          >
            Ver todos
          </button>
        ) : null}
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Números do bilhete"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-premium-border bg-premium-surface shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-premium-border bg-premium-bg/30 p-5">
              <div>
                <p className="text-sm font-semibold text-premium-text">Números selecionados</p>
                <p className="mt-1 text-xs text-premium-muted">
                  {ticketNumbers.length} cota(s) no total
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-premium-border bg-transparent px-3 py-1.5 text-sm font-semibold text-premium-text/90 transition-colors hover:border-premium-muted/60 hover:bg-premium-bg/60"
                aria-label="Fechar"
              >
                Fechar
              </button>
            </div>

            <div className="max-h-[60vh] min-h-0 overflow-y-auto overscroll-contain p-5 [scrollbar-width:thin]">
              <div className="flex flex-wrap gap-2 pr-1">
                {ticketNumbers.map((n) => (
                  <span key={String(n)} className={chipClass}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function MinhasRifasPage() {
  const { isReady, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<MyTicketOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    getMyTickets(token, "active")
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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-premium-muted transition-colors hover:text-premium-text"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Voltar
      </Link>
      <header className="mt-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-premium-text md:text-4xl">
          Minhas Rifas Ativas
        </h1>
        <p className="mt-2 text-sm text-premium-muted md:text-base">
          {loading ? "Carregando…" : `${grouped.size} rifas ativas`}
        </p>
        <p className="mt-1 text-sm text-premium-muted/90">
          Rifas em que você participa e ainda estão abertas
        </p>
      </header>

      {loading && (
        <div className="mt-12 flex justify-center">
          <Loader2 className="size-8 animate-spin text-premium-muted" aria-hidden />
        </div>
      )}

      {error && (
        <p
          className="mt-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300/90"
          role="alert"
        >
          {error}
        </p>
      )}

      {!loading && !error && grouped.size === 0 && (
        <div className="mt-12 rounded-xl border border-premium-border bg-premium-surface p-12 text-center">
          <Ticket className="mx-auto size-14 text-premium-muted/50" aria-hidden />
          <p className="mt-4 text-premium-muted">Você ainda não participa de rifas ativas.</p>
          <Link
            href="/rifas"
            className="mt-4 inline-block text-sm font-medium text-premium-accent hover:underline"
          >
            Ver rifas disponíveis
          </Link>
        </div>
      )}

      {!loading && !error && grouped.size > 0 && (
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
          {Array.from(grouped.entries()).map(([raffleId, list]) => {
            const r = list[0]?.raffle;
            if (!r) return null;

            const imgUrl = raffleImageUrl(r.image_url);
            const ticketNumbers = list.map((t) => t.ticket_number);
            const statusLabel = STATUS_LABELS[r.status] ?? r.status;

            return (
              <article
                key={raffleId}
                className="group relative flex min-h-[28rem] h-full flex-col overflow-hidden rounded-2xl border border-premium-border bg-premium-surface shadow-[0_8px_28px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-premium-muted/40"
              >
                <div className="relative w-full">
                  <div className="relative aspect-video w-full overflow-hidden border-b border-premium-border bg-premium-bg">
                    {imgUrl ? (
                      <>
                        {/* Camada blurred pra dar profundidade (igual padrão do card /rifas) */}
                        <Image
                          src={imgUrl}
                          alt=""
                          fill
                          aria-hidden
                          className="pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-30 blur-2xl transition-transform duration-500 group-hover:scale-[1.11]"
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <Image
                          src={imgUrl}
                          alt=""
                          fill
                          className="relative z-10 size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-premium-bg">
                        <Gamepad2 className="size-16 text-premium-muted/45" aria-hidden />
                      </div>
                    )}

                    {/* Badge tático */}
                    <div className="absolute right-2 top-2 z-20 inline-flex items-center gap-2 rounded-md border border-premium-border bg-premium-bg/95 px-2 py-0.5 text-xs font-medium text-premium-text">
                      <span className="relative inline-flex size-2.5 items-center justify-center" aria-hidden>
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-premium-accent/60 opacity-95" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-premium-accent/90" />
                      </span>
                      {statusLabel}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div>
                    <h2 className="truncate font-heading text-lg font-bold text-premium-text">
                      {r.title}
                    </h2>

                    <p className="mt-2 font-body text-sm font-bold text-premium-text">
                      Você tem {list.length} bilhete{list.length > 1 ? "s" : ""}
                    </p>

                    <TicketChips ticketNumbers={ticketNumbers} />

                    <p className="mt-4 text-sm font-mono font-semibold text-premium-text">
                      {formatBRL(r.ticket_price)}{" "}
                      <span className="text-amber-200/70">/ cota</span>
                    </p>
                  </div>

                  <div className="mt-auto pt-5">
                    <Link
                      href={`/raffle/${raffleId}`}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-lg border border-premium-accent bg-transparent py-2.5 text-sm font-semibold text-premium-accent transition-colors hover:bg-premium-accent hover:text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Ticket className="size-4" aria-hidden />
                      Acessar Sorteio
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
