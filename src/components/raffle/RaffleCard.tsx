"use client";

import { getApiBaseUrl } from "@/lib/api/config";
import type { RaffleListOut } from "@/types/api";
import { Gamepad2, Ticket } from "lucide-react";
import Link from "next/link";

const edgeSurface =
  "border border-premium-border shadow-[0_8px_28px_rgba(0,0,0,0.4)]";

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

function ProgressTrack({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-full border border-premium-border bg-premium-bg shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
      {children}
    </div>
  );
}

function ProgressFill({ pct }: { pct: number }) {
  return (
    <div
      className="h-full rounded-full bg-premium-accent"
      style={{ width: `${Math.min(100, pct)}%` }}
    />
  );
}

const STATUS_LABELS: Record<string, string> = {
  active: "Vendendo",
  sold_out: "Esgotada",
  finished: "Finalizada",
  canceled: "Cancelada",
};

export function RaffleGridCard({ raffle }: { raffle: RaffleListOut }) {
  const pct =
    raffle.total_tickets > 0
      ? Math.round((raffle.sold / raffle.total_tickets) * 100)
      : 0;
  const imgUrl = raffleImageUrl(raffle.image_url);
  const statusLabel = STATUS_LABELS[raffle.status] ?? raffle.status;
  const canParticipate = raffle.status === "active" || raffle.status === "sold_out";
  const buttonText = canParticipate ? "Participar" : "Ver detalhes";

  return (
    <article
      className={`group overflow-hidden rounded-xl bg-premium-surface ${edgeSurface} transition-all duration-300 hover:-translate-y-1 hover:border-premium-muted/40`}
    >
      <Link href={`/raffle/${raffle.id}`}>
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden border-b border-premium-border bg-premium-bg">
          <span className="absolute right-2 top-2 z-10 rounded-md border border-premium-border bg-premium-bg/95 px-2 py-0.5 font-body text-xs font-medium text-premium-text">
            {statusLabel}
          </span>
          {imgUrl ? (
            <>
              <img
                src={imgUrl}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-30 blur-2xl"
              />
              <img
                src={imgUrl}
                alt={raffle.title}
                className="relative z-10 size-full object-cover object-center"
              />
            </>
          ) : (
            <Gamepad2
              className="size-14 text-premium-muted/50"
              strokeWidth={1.5}
              aria-hidden
            />
          )}
        </div>
        <div className="p-5">
          <h3 className="truncate font-heading text-lg font-bold text-premium-text">
            {raffle.title}
          </h3>
          <p className="mt-2 font-mono text-sm font-semibold text-premium-text">
            {formatBRL(raffle.ticket_price)} / número
          </p>
          <ProgressTrack>
            <ProgressFill pct={pct} />
          </ProgressTrack>
          <p className="mt-2 font-mono text-sm tabular-nums text-premium-muted">
            {raffle.sold}/{raffle.total_tickets} vendidos
          </p>
          <span className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-premium-accent bg-transparent py-2.5 font-body text-sm font-semibold text-premium-accent transition-colors group-hover:bg-premium-accent group-hover:text-black">
            <Ticket className="size-4" aria-hidden />
            {buttonText}
          </span>
        </div>
      </Link>
    </article>
  );
}
