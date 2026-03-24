"use client";

import { getApiBaseUrl } from "@/lib/api/config";
import type { RaffleListOut } from "@/types/api";
import { Gamepad2, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const edgeSurface =
  "border border-apex-accent/15 shadow-[0_8px_30px_rgb(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.03)]";

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
    <div className="overflow-hidden rounded-full border border-white/[0.06] bg-apex-bg shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
      {children}
    </div>
  );
}

function ProgressFill({ pct }: { pct: number }) {
  return (
    <div
      className="h-full rounded-full bg-apex-accent/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
      style={{ width: `${Math.min(100, pct)}%` }}
    />
  );
}

export function RaffleGridCard({ raffle }: { raffle: RaffleListOut }) {
  const pct =
    raffle.total_tickets > 0
      ? Math.round((raffle.sold / raffle.total_tickets) * 100)
      : 0;
  const imgUrl = raffleImageUrl(raffle.image_url);

  return (
    <article
      className={`group overflow-hidden rounded-xl bg-apex-surface ${edgeSurface} transition-all duration-300 hover:-translate-y-1 hover:border-apex-accent/40 hover:shadow-[0_12px_40px_rgb(0,0,0,0.45)]`}
    >
      <Link href={`/raffle/${raffle.id}`}>
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden border-b border-white/[0.05] bg-apex-bg">
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
              className="size-14 text-apex-accent/45"
              strokeWidth={1.5}
              aria-hidden
            />
          )}
        </div>
        <div className="p-5">
          <h3 className="truncate text-lg font-bold text-apex-text/95">
            {raffle.title}
          </h3>
          <p className="mt-2 text-sm font-semibold text-apex-success/90">
            {formatBRL(raffle.ticket_price)} / número
          </p>
          <ProgressTrack>
            <ProgressFill pct={pct} />
          </ProgressTrack>
          <p className="mt-2 text-sm text-apex-text/50">
            {raffle.sold}/{raffle.total_tickets} vendidos
          </p>
          <span className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-apex-accent/20 bg-apex-surface py-2.5 text-sm font-semibold text-apex-text-muted transition-all group-hover:border-apex-accent/50 group-hover:bg-apex-accent/10 group-hover:text-apex-accent">
            <Ticket className="size-4" aria-hidden />
            Participar
          </span>
        </div>
      </Link>
    </article>
  );
}
