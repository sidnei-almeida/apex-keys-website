"use client";

import { getRaffles } from "@/lib/api/services";
import { getApiBaseUrl } from "@/lib/api/config";
import type { RaffleListOut } from "@/types/api";
import {
  ChevronRight,
  Flame,
  Gamepad2,
  Loader2,
  Sparkles,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

/** Glass + neon sutil em cards */
const glassCard =
  "rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150";

const CTA_GLOW =
  "shadow-[0_0_0_1px_rgba(0,229,255,0.25),0_4px_24px_rgba(0,229,255,0.35),0_12px_40px_rgba(0,180,200,0.15)]";

const MIN_CAROUSEL_SLIDES = 4;

/** Intervalo entre trocas de destaque no hero (várias rifas “ouro”). */
const HERO_SLIDE_INTERVAL_MS = 22_000;

/** Largura fixa por card para o cálculo do marquee (-50% = metade da faixa duplicada). */
const MARQUEE_CARD_WRAP =
  "shrink-0 px-2 w-[min(92vw,380px)] sm:w-[min(86vw,360px)] md:w-[320px] lg:w-[360px] xl:w-[400px]";

/** Moldura comum: coluna + 16:9 na área visual + rodapé (rifa e placeholder alinham altura). */
const MARQUEE_CARD_SHELL =
  "group flex flex-col overflow-hidden rounded-2xl";

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
      className={`overflow-hidden rounded-full border border-white/[0.08] bg-black/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function ProgressFill({ pct }: { pct: number }) {
  return (
    <div
      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-apex-accent to-teal-400 shadow-[0_0_12px_rgba(0,229,255,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]"
      style={{ width: `${Math.min(100, pct)}%` }}
    />
  );
}

type CarouselItem =
  | { kind: "raffle"; raffle: RaffleListOut }
  | { kind: "placeholder"; id: string };

function buildCarouselItems(
  raffles: RaffleListOut[],
  minSlides: number,
): CarouselItem[] {
  const items: CarouselItem[] = raffles.map((r) => ({
    kind: "raffle",
    raffle: r,
  }));
  let n = 0;
  while (items.length < minSlides) {
    items.push({ kind: "placeholder", id: `soon-${n++}` });
  }
  return items;
}

function CarouselPlaceholderCard() {
  return (
    <div className={MARQUEE_CARD_WRAP}>
      <article
        className={`${MARQUEE_CARD_SHELL} ${glassCard} transition-all duration-500 hover:border-white/[0.12]`}
        aria-hidden
      >
        <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-b from-apex-surface/40 to-black/30 px-5 py-6">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.04] sm:size-16">
            <Sparkles
              className="size-7 text-apex-accent/35 sm:size-8"
              strokeWidth={1.25}
              aria-hidden
            />
          </div>
          <div className="max-w-[min(100%,18rem)] space-y-1.5 text-center">
            <p className="text-sm font-semibold tracking-wide text-apex-text/50 sm:text-base">
              Próximos sorteios
            </p>
            <p className="line-clamp-3 text-xs leading-relaxed text-apex-text-muted/45 sm:line-clamp-2">
              Em breve novas chaves Steam com as mesmas garantias de
              transparência.
            </p>
          </div>
          <div className="mt-1 flex w-full max-w-[200px] flex-col gap-2 opacity-40">
            <div className="h-2 w-full rounded-full bg-white/[0.06]" />
            <div className="h-2 w-3/4 self-center rounded-full bg-white/[0.04]" />
          </div>
        </div>
        <div className="shrink-0 border-t border-white/[0.06] bg-black/20 p-4">
          <div
            className="flex w-full items-center justify-center rounded-xl border border-dashed border-white/10 py-3 text-sm font-medium text-apex-text-muted/50"
            aria-hidden
          >
            Em breve
          </div>
        </div>
      </article>
    </div>
  );
}

function RaffleCarouselCard({ raffle }: { raffle: RaffleListOut }) {
  const pct =
    raffle.total_tickets > 0
      ? Math.round((raffle.sold / raffle.total_tickets) * 100)
      : 0;
  const imgUrl = raffleImageUrl(raffle.image_url);

  return (
    <div className={MARQUEE_CARD_WRAP}>
      <article
        className={`${MARQUEE_CARD_SHELL} ${glassCard} transition-all duration-300 hover:-translate-y-1 hover:border-apex-accent/35 hover:shadow-[0_20px_50px_rgba(0,229,255,0.12)]`}
      >
        <Link
          href={`/raffle/${raffle.id}`}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-apex-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-apex-bg"
        >
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-black/50">
            {imgUrl ? (
              <Image
                src={imgUrl}
                alt={raffle.title}
                fill
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 50vw, 400px"
                className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                unoptimized
              />
            ) : (
              <Gamepad2
                className="size-24 text-apex-accent/40"
                strokeWidth={1.5}
                aria-hidden
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
              <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-white drop-shadow-md md:text-xl">
                {raffle.title}
              </h3>
              <p className="mt-1.5 text-sm font-semibold text-apex-accent/95">
                {formatBRL(raffle.ticket_price)} / cota
              </p>
              <ProgressTrack className="mt-3 h-2">
                <ProgressFill pct={pct} />
              </ProgressTrack>
              <p className="mt-2 text-xs font-medium text-white/75">
                {raffle.sold}/{raffle.total_tickets} vendidos
              </p>
            </div>
          </div>
          <div className="border-t border-white/[0.06] bg-black/20 p-4">
            <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-apex-accent/15 to-teal-500/10 py-3 text-sm font-bold text-apex-accent transition-all duration-300 group-hover:from-apex-accent group-hover:to-teal-400 group-hover:text-apex-bg group-hover:shadow-[0_0_24px_rgba(0,229,255,0.35)]">
              <Ticket className="size-4" aria-hidden />
              Participar
            </span>
          </div>
        </Link>
      </article>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-apex-bg -mt-10 md:-mt-12 lg:-mt-14"
      aria-busy
      aria-label="A carregar destaque"
    >
      <div className="flex min-h-[min(72vh,820px)] items-center justify-center bg-gradient-to-br from-apex-surface to-black">
        <Loader2
          className="size-12 animate-spin text-apex-accent/80"
          aria-hidden
        />
      </div>
    </div>
  );
}

function HomeHeroSpotlight({ slides }: { slides: RaffleListOut[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const idsKey = slides.map((s) => s.id).join("|");
  const safeIndex = Math.min(activeIndex, Math.max(0, slides.length - 1));
  const raffle = slides[safeIndex]!;

  useEffect(() => {
    setActiveIndex(0);
  }, [idsKey]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, HERO_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [slides.length, idsKey]);

  const heroPct =
    raffle.total_tickets > 0
      ? (raffle.sold / raffle.total_tickets) * 100
      : 0;

  return (
    <section
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-black -mt-10 md:-mt-12 lg:-mt-14"
      aria-roledescription="carrossel"
      aria-label="Sorteios em destaque no topo"
    >
      <div
        className="relative min-h-[min(78vh,900px)] w-full lg:min-h-[min(82vh,960px)]"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="absolute inset-0">
          {slides.map((r, i) => {
            const url = raffleImageUrl(r.image_url);
            const isActive = i === safeIndex;
            return (
              <div
                key={r.id}
                className={`absolute inset-0 transition-opacity duration-[1100ms] ease-in-out ${
                  isActive ? "z-[1] opacity-100" : "z-0 opacity-0"
                }`}
                aria-hidden={!isActive}
              >
                {url ? (
                  <Image
                    src={url}
                    alt=""
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-cover object-center"
                    unoptimized
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-apex-surface via-[#0a1628] to-black"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Gradiente: escuro à esquerda (legibilidade) → transparente à direita (imagem) */}
        <div
          className="absolute inset-0 z-[2] bg-gradient-to-r from-[#030508] from-0% via-[#060b14]/92 via-45% to-transparent to-[72%]"
          aria-hidden
        />
        <div
          className="absolute inset-0 z-[2] bg-gradient-to-t from-[#030508] via-transparent to-black/40"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-[min(78vh,900px)] w-full items-end lg:min-h-[min(82vh,960px)] lg:items-center">
          <div className="w-full px-5 pb-12 pt-32 sm:px-8 sm:pb-16 sm:pt-36 md:px-10 md:pb-20 md:pt-40 lg:px-14 lg:pt-44 xl:px-20 2xl:px-28">
            <div className="mx-auto w-full max-w-[min(1920px,100%)]">
              <div className="max-w-xl lg:max-w-2xl xl:max-w-[42rem]">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border border-apex-accent/30 bg-black/30 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-apex-accent ${CTA_GLOW}`}
                >
                  <Flame className="size-3.5" strokeWidth={2} aria-hidden />
                  Destaque
                  {slides.length > 1 ? (
                    <span className="font-mono font-normal tracking-normal text-white/50">
                      {safeIndex + 1}/{slides.length}
                    </span>
                  ) : null}
                </span>
                <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.8)] sm:text-5xl lg:text-6xl xl:text-[3.5rem]">
                  {raffle.title}
                </h1>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
                  Garanta sua chave Steam com pagamento seguro e números
                  auditáveis — transparência de ponta a ponta.
                </p>

                <div className="mt-8 max-w-md space-y-3">
                  <ProgressTrack className="h-3">
                    <ProgressFill pct={heroPct} />
                  </ProgressTrack>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
                    <span>
                      {raffle.total_tickets > 0 ? Math.round(heroPct) : 0}% das
                      cotas vendidas
                    </span>
                    <span>
                      Faltam{" "}
                      {Math.max(0, raffle.total_tickets - raffle.sold)} números
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <p className="text-sm font-medium text-white/50">A partir de</p>
                  <p className="text-3xl font-bold tabular-nums tracking-tight text-apex-accent drop-shadow-[0_0_20px_rgba(0,229,255,0.35)] sm:text-4xl">
                    {formatBRL(raffle.ticket_price)}
                    <span className="ml-2 text-lg font-semibold text-white/50">
                      / cota
                    </span>
                  </p>
                </div>

                <Link
                  href={`/raffle/${raffle.id}`}
                  className={`mt-10 inline-flex w-full max-w-md items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-apex-accent via-cyan-400 to-teal-400 px-8 py-4 text-base font-bold text-[#031018] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] sm:w-auto ${CTA_GLOW}`}
                >
                  <Ticket className="size-5 shrink-0" aria-hidden />
                  Garantir meu número
                </Link>

                {slides.length > 1 ? (
                  <div
                    className="mt-8 flex flex-wrap items-center gap-2"
                    aria-label="Trocar campanha em destaque"
                  >
                    {slides.map((r, i) => (
                      <button
                        key={r.id}
                        type="button"
                        aria-label={`Mostrar ${r.title}`}
                        aria-pressed={i === safeIndex}
                        onClick={() => setActiveIndex(i)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          i === safeIndex
                            ? "w-8 bg-apex-accent shadow-[0_0_12px_rgba(0,229,255,0.45)]"
                            : "w-2.5 bg-white/25 hover:bg-white/45"
                        }`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [raffles, setRaffles] = useState<RaffleListOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onHome = useMemo(
    () => raffles.filter((r) => r.featured_tier !== "none"),
    [raffles],
  );

  /** GET /raffles devolve ouro primeiro, por created_at asc (mais antiga = slide 1); várias ouro rodam no hero. */
  const heroSlides = useMemo(() => {
    const gold = onHome.filter((r) => r.featured_tier === "featured");
    if (gold.length > 0) return gold;
    const first = onHome[0];
    return first ? [first] : [];
  }, [onHome]);

  const carouselItems = useMemo(() => {
    const goldIds = new Set(
      onHome.filter((r) => r.featured_tier === "featured").map((r) => r.id),
    );
    const others = onHome.filter((r) => !goldIds.has(r.id));
    return buildCarouselItems(others, MIN_CAROUSEL_SLIDES);
  }, [onHome]);

  useEffect(() => {
    getRaffles()
      .then((all) =>
        all.filter((r) => r.status === "active" || r.status === "sold_out"),
      )
      .then(setRaffles)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar rifas"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="-mt-6 font-sans">
      {loading && <HeroSkeleton />}

      {!loading && heroSlides.length > 0 && (
        <HomeHeroSpotlight slides={heroSlides} />
      )}

      {!loading && heroSlides.length === 0 && !error && onHome.length === 0 && (
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div
            className={`mx-auto max-w-lg rounded-2xl ${glassCard} p-12`}
          >
            <Gamepad2
              className="mx-auto size-16 text-apex-text-muted/35"
              aria-hidden
            />
            <p className="mt-6 text-lg text-apex-text-muted/90">
              Nenhuma rifa ativa no momento.
            </p>
            <p className="mt-2 text-sm text-apex-text-muted/60">
              Volte em breve para novos sorteios.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Carrossel — sempre com estrutura + placeholders */}
      {!loading && onHome.length > 0 && (
        <section className="relative mx-auto max-w-[1920px] px-4 py-16 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
          <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Mais sorteios
              </h2>
              <p className="mt-2 max-w-xl text-sm text-apex-text-muted/80">
                Explore outras oportunidades — novos jogos chegam em breve.
              </p>
            </div>
            <Link
              href="/rifas"
              className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-apex-accent transition-colors hover:text-white sm:mt-0"
            >
              Ver catálogo completo
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="group-marquee relative">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0A111F] to-transparent sm:w-14 md:w-20"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0A111F] to-transparent sm:w-14 md:w-20"
              aria-hidden
            />
            <div className="overflow-hidden pb-2" role="region" aria-label="Mais sorteios em movimento contínuo">
              <div className="apex-marquee-track">
                {carouselItems.map((item, i) =>
                  item.kind === "raffle" ? (
                    <RaffleCarouselCard
                      key={`m1-${item.raffle.id}-${i}`}
                      raffle={item.raffle}
                    />
                  ) : (
                    <CarouselPlaceholderCard key={`m1-${item.id}-${i}`} />
                  ),
                )}
                {carouselItems.map((item, i) =>
                  item.kind === "raffle" ? (
                    <RaffleCarouselCard
                      key={`m2-${item.raffle.id}-${i}`}
                      raffle={item.raffle}
                    />
                  ) : (
                    <CarouselPlaceholderCard key={`m2-${item.id}-${i}`} />
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
