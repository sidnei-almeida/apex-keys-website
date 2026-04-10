"use client";

import { getApiBaseUrl } from "@/lib/api/config";
import {
  getRaffleCardCta,
  getRaffleListBadgeLabel,
  getRaffleStatus,
  getRaffleStatusKey,
  raffleSoldCount,
  raffleTotalTickets,
} from "@/lib/raffle-catalog";
import type { RaffleListOut } from "@/types/api";
import { ChevronRight, Gamepad2, Ticket } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

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

function ProgressTrack({
  className,
  children,
  muted,
}: {
  className?: string;
  children: ReactNode;
  muted: boolean;
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)] ${
        muted
          ? "border border-zinc-800/90 bg-black/50"
          : "border border-premium-border bg-premium-bg"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function ProgressFill({ pct, muted }: { pct: number; muted: boolean }) {
  return (
    <div
      className={`h-full rounded-full ${muted ? "bg-zinc-600" : "bg-premium-accent"}`}
      style={{ width: `${Math.min(100, pct)}%` }}
    />
  );
}

export function RaffleGridCard({ raffle }: { raffle: RaffleListOut }) {
  const isConcluded = getRaffleStatus(raffle) === "concluded";
  const soldOutAccent =
    !isConcluded && getRaffleStatusKey(raffle) === "sold_out";

  const total = raffleTotalTickets(raffle);
  const sold = raffleSoldCount(raffle);
  const pct = total > 0 ? Math.round((sold / total) * 100) : 0;
  const imgUrl = raffleImageUrl(raffle.image_url);
  const badgeLabel = getRaffleListBadgeLabel(raffle);
  const cta = getRaffleCardCta(raffle);

  const articleClass = isConcluded
    ? "group overflow-hidden rounded-xl border border-zinc-800/70 bg-[#111111] opacity-[0.96] shadow-[0_6px_22px_rgba(0,0,0,0.48)] transition-colors duration-200 hover:border-zinc-700/65"
    : "group overflow-hidden rounded-xl border border-premium-border bg-premium-surface shadow-[0_8px_28px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-premium-muted/40";

  const badgeClass = isConcluded
    ? "rounded-md border border-zinc-700/60 bg-[#111111] px-2 py-0.5 font-body text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-400"
    : soldOutAccent
      ? "rounded-md border border-amber-500/30 bg-premium-bg/95 px-2 py-0.5 font-body text-xs font-medium text-amber-100/90"
      : "rounded-md border border-premium-border bg-premium-bg/95 px-2 py-0.5 font-body text-xs font-medium text-premium-text";

  const titleClass = isConcluded
    ? "truncate font-heading text-lg font-semibold tracking-tight text-zinc-300/95"
    : "truncate font-heading text-lg font-bold text-premium-text";

  const priceClass = isConcluded
    ? "mt-2 font-mono text-sm font-medium text-zinc-500"
    : "mt-2 font-mono text-sm font-semibold text-premium-text";

  const soldMetaClass = isConcluded
    ? "mt-2 font-mono text-xs font-medium tabular-nums text-zinc-500 sm:text-sm"
    : "mt-2 font-mono text-xs font-medium tabular-nums text-premium-muted sm:text-sm";

  const imgMainClass = isConcluded
    ? "relative z-10 size-full object-cover object-center grayscale saturate-0 contrast-[0.86] brightness-[0.84] opacity-[0.88] transition duration-200"
    : "relative z-10 size-full object-cover object-center transition duration-300";

  const imgBlurClass = isConcluded
    ? "pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-15 blur-2xl grayscale saturate-0"
    : "pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-30 blur-2xl";

  const ctaClass = isConcluded
    ? "mt-4 flex w-full cursor-default items-center justify-center gap-1.5 rounded-lg border border-zinc-700/75 bg-zinc-950/60 py-2.5 font-body text-sm font-medium text-zinc-400 transition-colors duration-200 group-hover:border-zinc-600/85 group-hover:bg-zinc-900/50 group-hover:text-zinc-300"
    : cta.prominent && !soldOutAccent
      ? "mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-premium-accent bg-transparent py-2.5 font-body text-sm font-semibold text-premium-accent transition-colors group-hover:bg-premium-accent group-hover:text-black"
      : "mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-premium-accent/55 bg-transparent py-2.5 font-body text-sm font-semibold text-premium-accent transition-colors group-hover:border-premium-accent/75 group-hover:bg-premium-accent/12";

  const linkFocus = isConcluded
    ? "block rounded-xl outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-500"
    : "block rounded-xl outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-premium-accent/60";

  return (
    <article className={articleClass}>
      <Link
        href={cta.href}
        aria-label={`${raffle.title}. ${badgeLabel}. ${cta.label}.`}
        className={`${linkFocus} ${isConcluded ? "!cursor-default" : ""}`}
      >
        <div
          className={`relative flex aspect-video w-full items-center justify-center overflow-hidden ${
            isConcluded
              ? "border-b border-zinc-900/90 bg-neutral-950"
              : "border-b border-premium-border bg-premium-bg"
          }`}
        >
          <span className={`absolute right-2 top-2 z-30 ${badgeClass}`}>{badgeLabel}</span>
          {imgUrl ? (
            <>
              <img src={imgUrl} alt="" aria-hidden className={imgBlurClass} />
              <img src={imgUrl} alt={raffle.title} className={imgMainClass} />
              {isConcluded ? (
                <div
                  className="pointer-events-none absolute inset-0 z-[18] bg-gradient-to-t from-black/35 via-zinc-950/20 to-zinc-950/35"
                  aria-hidden
                />
              ) : null}
            </>
          ) : (
            <Gamepad2
              className={`size-14 ${isConcluded ? "text-zinc-600" : "text-premium-muted/50"}`}
              strokeWidth={1.5}
              aria-hidden
            />
          )}
        </div>
        <div className="p-5">
          <h3 className={titleClass}>{raffle.title}</h3>
          <p className={priceClass}>
            {formatBRL(raffle.ticket_price)} / número
          </p>
          <ProgressTrack className="mt-3 h-2" muted={isConcluded}>
            <ProgressFill pct={pct} muted={isConcluded} />
          </ProgressTrack>
          <p className={soldMetaClass}>
            {sold}/{total} vendidos
          </p>
          <span className={ctaClass}>
            {cta.prominent ? (
              <Ticket className="size-4 shrink-0" aria-hidden />
            ) : (
              <ChevronRight className="size-4 shrink-0 opacity-70" aria-hidden />
            )}
            {cta.label}
          </span>
        </div>
      </Link>
    </article>
  );
}
