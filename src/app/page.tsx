"use client";

import { getRaffles } from "@/lib/api/services";
import { getApiBaseUrl } from "@/lib/api/config";
import type { RaffleListOut } from "@/types/api";
import { Box, Flame, Gamepad2, Loader2, Ticket } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

/** Contorno fino + destaque interno + sombra projetada de profundidade */
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

function ProgressTrack({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-full border border-white/[0.06] bg-apex-bg shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] ${className ?? ""}`}
    >
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

export default function Home() {
  const [raffles, setRaffles] = useState<RaffleListOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Busca todas as rifas e filtra as ativas (criadas e abertas para compra)
    getRaffles()
      .then((all) => all.filter((r) => r.status === "active" || r.status === "sold_out"))
      .then(setRaffles)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar rifas")
      )
      .finally(() => setLoading(false));
  }, []);

  const activeRaffles = raffles.filter((r) => r.status === "active");
  const featuredRaffle = activeRaffles[0] ?? raffles[0];
  const gridRaffles = raffles;

  return (
    <>
      {/* Hero / Destaque — primeira rifa ativa */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:pl-40">
        {loading && (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="size-10 animate-spin text-apex-accent" aria-hidden />
          </div>
        )}

        {!loading && featuredRaffle && (
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-6">
              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-md bg-apex-surface/90 px-3 py-1 text-sm font-semibold tracking-wide text-apex-accent/85 ${edgeSurface}`}
              >
                <Flame
                  className="size-4 shrink-0 text-apex-accent"
                  strokeWidth={2}
                  aria-hidden
                />
                SORTEIO EM DESTAQUE
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-apex-text/95 sm:text-4xl lg:text-5xl lg:leading-tight">
                {featuredRaffle.title}
              </h1>
              <p className="max-w-xl text-lg text-apex-text/55">
                Garanta sua chave Steam por uma fração do preço.
              </p>
              <div className="flex flex-col gap-2">
                <ProgressTrack className="h-3">
                  <ProgressFill
                    pct={
                      featuredRaffle.total_tickets > 0
                        ? (featuredRaffle.sold / featuredRaffle.total_tickets) * 100
                        : 0
                    }
                  />
                </ProgressTrack>
                <div className="flex flex-wrap justify-between gap-2 text-sm text-apex-text/65">
                  <span>
                    {featuredRaffle.total_tickets > 0
                      ? Math.round(
                          (featuredRaffle.sold / featuredRaffle.total_tickets) * 100
                        )
                      : 0}
                    % Concluído
                  </span>
                  <span>
                    Faltam{" "}
                    {Math.max(0, featuredRaffle.total_tickets - featuredRaffle.sold)}{" "}
                    números
                  </span>
                </div>
              </div>
              <Link
                href={`/raffle/${featuredRaffle.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-apex-accent to-teal-500 px-6 py-4 text-base font-bold text-apex-bg shadow-[0_4px_18px_rgba(0,229,255,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_24px_rgba(0,229,255,0.45)] sm:w-auto sm:px-8"
              >
                <Ticket className="size-5 shrink-0 opacity-95" aria-hidden />
                Garantir Meu Número - {formatBRL(featuredRaffle.ticket_price)}
              </Link>
            </div>

            <div className="mx-auto w-full max-w-md">
              <div
                className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-apex-surface ${edgeSurface}`}
              >
                {raffleImageUrl(featuredRaffle.image_url) ? (
                  <Image
                    src={raffleImageUrl(featuredRaffle.image_url)!}
                    alt={featuredRaffle.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <Gamepad2
                    className="size-24 text-apex-accent/50 drop-shadow-[0_0_6px_rgba(0,212,255,0.06)] sm:size-32 md:size-36"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && !featuredRaffle && !error && (
          <div className="rounded-xl border border-white/[0.08] bg-apex-surface/50 p-12 text-center">
            <Gamepad2 className="mx-auto size-16 text-apex-text-muted/40" aria-hidden />
            <p className="mt-4 text-apex-text-muted/80">
              Nenhuma rifa ativa no momento. Em breve!
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </section>

      {/* Grid de sorteios ativos */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-8 text-3xl font-bold text-apex-text/95">
          Sorteios Ativos
        </h2>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-apex-accent" aria-hidden />
          </div>
        )}

        {!loading && gridRaffles.length === 0 && !error && (
          <div className="rounded-xl border border-white/[0.08] bg-apex-surface/50 p-12 text-center">
            <Box className="mx-auto size-14 text-apex-text-muted/40" aria-hidden />
            <p className="mt-4 text-apex-text-muted/80">Nenhum sorteio ativo.</p>
          </div>
        )}

        {!loading && gridRaffles.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gridRaffles.map((raffle) => {
              const pct =
                raffle.total_tickets > 0
                  ? Math.round((raffle.sold / raffle.total_tickets) * 100)
                  : 0;
              const imgUrl = raffleImageUrl(raffle.image_url);
              return (
                <article
                  key={raffle.id}
                  className={`group overflow-hidden rounded-xl bg-apex-surface ${edgeSurface} transition-all duration-300 hover:-translate-y-1 hover:border-apex-accent/40 hover:shadow-[0_12px_40px_rgb(0,0,0,0.45),0_0_0_1px_rgba(0,229,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.04)]`}
                >
                  <Link href={`/raffle/${raffle.id}`}>
                    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden border-b border-white/[0.05] bg-apex-bg transition-colors duration-300 group-hover:border-apex-accent/15">
                      {imgUrl ? (
                        <>
                          <img
                            src={imgUrl}
                            alt=""
                            aria-hidden
                            className="pointer-events-none absolute inset-0 size-full scale-110 object-cover object-center opacity-30 blur-2xl"
                          />
                          <img
                            src={imgUrl}
                            alt={raffle.title}
                            className="relative z-10 size-full object-cover object-center drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)] ring-1 ring-apex-secondary/20"
                          />
                        </>
                      ) : (
                        <Gamepad2
                          className="size-14 text-apex-accent/45 drop-shadow-[0_0_5px_rgba(0,229,255,0.06)] transition-all duration-300 group-hover:text-apex-accent/65 group-hover:drop-shadow-[0_0_10px_rgba(0,229,255,0.15)]"
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
                      <div className="mt-3">
                        <ProgressTrack className="h-2">
                          <ProgressFill pct={pct} />
                        </ProgressTrack>
                      </div>
                      <p className="mt-2 text-sm text-apex-text/50">
                        {raffle.sold}/{raffle.total_tickets} vendidos
                      </p>
                      <span className="mt-4 flex w-full items-center justify-center rounded-lg border border-apex-accent/20 bg-apex-surface py-2.5 text-sm font-semibold text-apex-text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200 group-hover:border-apex-accent/50 group-hover:bg-apex-accent/10 group-hover:text-apex-accent">
                        Participar
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
