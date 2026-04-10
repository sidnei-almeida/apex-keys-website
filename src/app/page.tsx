"use client";

import { HomeHowItWorksSection } from "@/components/home/HomeHowItWorksSection";
import { HomeImagePreloads } from "@/components/home/HomeImagePreloads";
import { getRaffles } from "@/lib/api/services";
import { raffleImageUrl } from "@/lib/raffle-image-url";
import type { RaffleListOut } from "@/types/api";
import {
  ChevronRight,
  Flame,
  Gamepad2,
  Key,
  Loader2,
  ShieldCheck,
  Sparkles,
  Ticket,
  Zap,
} from "lucide-react";
import { LastWinnersHall } from "@/components/social/LastWinnersHall";
import { LiveSalesPulse } from "@/components/social/LiveSalesPulse";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

/** Cartões — surface premium, sem blur nem glow colorido */
const surfaceCard =
  "rounded-2xl border border-premium-border bg-premium-surface";

const MIN_CAROUSEL_SLIDES = 4;

/** Intervalo entre trocas de destaque no hero (várias rifas “ouro”). */
const HERO_SLIDE_INTERVAL_MS = 22_000;

/** Largura fixa por card no marquee (-50% = metade da faixa duplicada). */
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

function ProgressTrack({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-full border border-premium-border bg-premium-bg shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)] ${className ?? ""}`}
    >
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
        className={`${MARQUEE_CARD_SHELL} ${surfaceCard} transition-transform duration-300 ease-in-out hover:-translate-y-1`}
        aria-hidden
      >
        <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-b from-premium-bg to-premium-surface px-5 py-6">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-dashed border-premium-border bg-premium-bg sm:size-16">
            <Sparkles
              className="size-7 text-premium-muted/50 sm:size-8"
              strokeWidth={1.25}
              aria-hidden
            />
          </div>
          <div className="max-w-[min(100%,18rem)] space-y-1.5 text-center">
            <p className="font-heading text-sm font-semibold tracking-wide text-premium-text sm:text-base">
              Próximos sorteios
            </p>
            <p className="line-clamp-3 font-body text-xs leading-relaxed text-premium-muted sm:line-clamp-2">
              Em breve novas chaves Steam com as mesmas garantias de
              transparência.
            </p>
          </div>
          <div className="mt-1 flex w-full max-w-[200px] flex-col gap-2 opacity-50">
            <div className="h-2 w-full rounded-full bg-premium-border/60" />
            <div className="h-2 w-3/4 self-center rounded-full bg-premium-border/40" />
          </div>
        </div>
        <div className="shrink-0 border-t border-premium-border bg-premium-surface p-4">
          <div
            className="flex w-full items-center justify-center rounded-xl border border-premium-accent bg-transparent py-3 font-body text-sm font-semibold text-premium-accent transition-colors duration-300 ease-in-out group-hover:bg-premium-accent group-hover:text-black"
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
        className={`${MARQUEE_CARD_SHELL} ${surfaceCard} transition-transform duration-300 ease-in-out hover:-translate-y-1`}
      >
        <Link
          href={`/raffle/${raffle.id}`}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-premium-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-premium-bg"
        >
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-premium-bg">
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
                className="size-24 text-premium-muted/40"
                strokeWidth={1.5}
                aria-hidden
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#0A0A0A]/15 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
              <h3 className="line-clamp-2 font-heading text-lg font-bold tracking-tight text-premium-text drop-shadow-md md:text-xl">
                {raffle.title}
              </h3>
              <p className="mt-1.5 font-mono text-sm font-semibold tabular-nums">
                <span className="text-premium-text">{formatBRL(raffle.ticket_price)}</span>
                <span className="font-body font-normal text-premium-muted"> / cota</span>
              </p>
              <ProgressTrack className="mt-3 h-2">
                <ProgressFill pct={pct} />
              </ProgressTrack>
              <p className="mt-2 font-mono text-xs font-medium tabular-nums text-premium-muted">
                {raffle.sold}/{raffle.total_tickets} vendidos
              </p>
            </div>
          </div>
          <div className="border-t border-premium-border bg-premium-surface p-4">
            <span className="flex w-full items-center justify-center gap-2 rounded-xl border border-premium-accent bg-transparent py-3 font-body text-sm font-bold text-premium-accent transition-colors duration-300 ease-in-out group-hover:bg-premium-accent group-hover:text-black">
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
      className="relative w-full overflow-x-clip bg-premium-bg"
      aria-busy
      aria-label="A carregar destaque"
    >
      <div className="flex min-h-[min(72vh,820px)] items-center justify-center bg-premium-bg">
        <Loader2
          className="size-12 animate-spin text-premium-muted"
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
      className="relative z-[1] w-full overflow-x-clip bg-premium-bg shadow-[0_20px_48px_-12px_rgba(0,0,0,0.5)]"
      aria-roledescription="carrossel"
      aria-label="Sorteios em destaque no topo"
    >
      <div
        className="relative min-h-[min(78vh,900px)] w-full overflow-x-clip border-b border-premium-border/25 bg-premium-bg lg:min-h-[min(82vh,960px)]"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Arte em tela cheia — sem moldura interna; sangra de borda a borda */}
        <div className="absolute inset-0 h-full w-full">
          {slides.map((r, i) => {
            const url = raffleImageUrl(r.image_url);
            const isActive = i === safeIndex;
            return (
              <div
                key={r.id}
                className={`absolute inset-0 h-full w-full transition-opacity duration-[1100ms] ease-in-out ${
                  isActive ? "z-[1] opacity-100" : "z-0 opacity-0"
                }`}
                aria-hidden={!isActive}
              >
                {url ? (
                  // Hero: <img> direto — sem /_next/image nem Sharp; bytes iguais à origem (API/CDN).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "low"}
                    decoding="async"
                  />
                ) : (
                  <div
                    className="absolute inset-0 h-full w-full bg-gradient-to-br from-neutral-950 via-black to-black"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Legibilidade: preto #0A0A0A → transparente (esquerda→direita e baixo→cimo), sem azul nem blur. */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-[#0A0A0A]/93 via-[#0A0A0A]/45 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[#0A0A0A]/85 via-transparent to-transparent"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-[min(78vh,900px)] w-full items-end lg:min-h-[min(82vh,960px)] lg:items-center">
          <div className="w-full px-5 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32 md:px-10 md:pb-20 md:pt-36 lg:px-14 lg:pt-40 xl:px-20 2xl:px-28">
            <div className="mx-auto w-full max-w-[min(1920px,100%)]">
              <div className="max-w-xl lg:max-w-2xl xl:max-w-[42rem]">
                <span className="inline-flex items-center gap-2 rounded-full border border-premium-border bg-[#0A0A0A]/55 px-4 py-1.5 font-heading text-xs font-bold uppercase tracking-[0.2em] text-premium-accent">
                  <Flame className="size-3.5" strokeWidth={2} aria-hidden />
                  Destaque
                  {slides.length > 1 ? (
                    <span className="font-mono font-medium tracking-normal text-premium-muted">
                      {safeIndex + 1}/{slides.length}
                    </span>
                  ) : null}
                </span>
                <h1 className="mt-6 font-heading text-3xl font-bold leading-[1.1] tracking-tight text-premium-text sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl">
                  {raffle.title}
                </h1>
                <p className="mt-5 max-w-lg font-body text-base leading-relaxed text-premium-muted sm:text-lg">
                  Garanta sua chave Steam com pagamento seguro e números
                  auditáveis — transparência de ponta a ponta.
                </p>

                <div className="mt-8 max-w-md space-y-3">
                  <ProgressTrack className="h-3">
                    <ProgressFill pct={heroPct} />
                  </ProgressTrack>
                  <div className="flex flex-wrap items-center justify-between gap-3 font-body text-sm text-premium-muted">
                    <span className="font-mono tabular-nums">
                      {raffle.total_tickets > 0 ? Math.round(heroPct) : 0}% das
                      cotas vendidas
                    </span>
                    <span>
                      Faltam{" "}
                      <span className="font-mono tabular-nums">
                        {Math.max(0, raffle.total_tickets - raffle.sold)}
                      </span>{" "}
                      números
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <p className="font-body text-sm font-medium text-premium-muted">A partir de</p>
                  <p className="font-mono text-3xl font-bold tabular-nums tracking-tight text-premium-accent sm:text-4xl">
                    {formatBRL(raffle.ticket_price)}
                    <span className="ml-2 font-body text-lg font-semibold text-premium-accent/90">
                      / cota
                    </span>
                  </p>
                </div>

                <Link
                  href={`/raffle/${raffle.id}`}
                  className="mt-10 inline-flex w-full max-w-md items-center justify-center gap-3 rounded-xl bg-premium-accent px-8 py-4 font-body text-base font-bold text-black transition-opacity hover:opacity-95 active:opacity-90 sm:w-auto"
                >
                  <Ticket className="size-5 shrink-0" aria-hidden />
                  Garantir meu número
                </Link>

                {/* Micro-selos de confiança */}
                <div className="mt-5 flex flex-wrap items-center gap-5 opacity-60">
                  <span className="inline-flex items-center gap-1.5 font-body text-xs text-premium-muted">
                    <ShieldCheck className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                    Compra 100% Segura
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-body text-xs text-premium-muted">
                    <Zap className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                    Aprovação Imediata
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-body text-xs text-premium-muted">
                    <Key className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                    Entrega Oficial Steam
                  </span>
                </div>

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
                            ? "w-8 bg-premium-accent"
                            : "w-2.5 bg-premium-muted/35 hover:bg-premium-muted/55"
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

  /** Preload: até 4 slides do hero + 1ª capa do carrossel “Mais sorteios”. */
  const imagePreloadUrls = useMemo(() => {
    if (loading) return [];
    const seen = new Set<string>();
    const list: string[] = [];
    const add = (raw: string | null | undefined) => {
      const u = raffleImageUrl(raw);
      if (u && !seen.has(u)) {
        seen.add(u);
        list.push(u);
      }
    };
    for (const r of heroSlides.slice(0, 4)) {
      add(r.image_url);
    }
    const lead = carouselItems.find(
      (item): item is { kind: "raffle"; raffle: RaffleListOut } =>
        item.kind === "raffle",
    );
    if (lead) add(lead.raffle.image_url);
    return list;
  }, [loading, heroSlides, carouselItems]);

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
    <div className="overflow-x-clip bg-premium-bg font-body">
      <HomeImagePreloads urls={imagePreloadUrls} />

      {loading && <HeroSkeleton />}

      {!loading && heroSlides.length > 0 && (
        <HomeHeroSpotlight slides={heroSlides} />
      )}

      {!loading && heroSlides.length === 0 && !error && onHome.length === 0 && (
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className={`mx-auto max-w-lg rounded-2xl ${surfaceCard} p-12`}>
            <Gamepad2
              className="mx-auto size-16 text-premium-muted/40"
              aria-hidden
            />
            <p className="mt-6 font-body text-lg text-premium-text">
              Nenhuma rifa ativa no momento.
            </p>
            <p className="mt-2 font-body text-sm text-premium-muted">
              Volte em breve para novos sorteios.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-8 text-center">
            <p className="text-red-300/90">{error}</p>
          </div>
        </div>
      )}

      {!loading ? <HomeHowItWorksSection /> : null}

      {/* Carrossel — sempre com estrutura + placeholders */}
      {!loading && onHome.length > 0 && (
        <section
          className="relative mx-auto w-full max-w-none px-4 pt-3 pb-14 sm:px-6 sm:pt-4 md:pt-5 md:pb-16 lg:px-10 lg:pt-6 lg:pb-18 xl:px-12 2xl:px-14 min-[1800px]:px-16 min-[2400px]:px-20"
          aria-labelledby="catalogo-sorteios-heading"
        >
          <div className="mb-10 flex flex-col gap-6 sm:mb-11 sm:flex-row sm:items-end sm:justify-between md:mb-12 lg:mb-14">
            <div className="max-w-2xl text-left">
              <p className="font-heading text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-premium-accent/80">
                CATÁLOGO
              </p>
              <h2
                id="catalogo-sorteios-heading"
                className="mt-1.5 font-heading text-3xl font-bold leading-tight tracking-tight text-[#EAEAEA] md:text-[2rem] lg:text-[2.125rem]"
              >
                Sorteios disponíveis
              </h2>
              <p className="mt-2 max-w-lg font-body text-sm leading-relaxed text-premium-muted md:max-w-xl">
                Explore novas oportunidades e escolha seu próximo jogo.
              </p>
            </div>
            <Link
              href="/rifas"
              className="inline-flex w-fit shrink-0 items-center gap-2 self-start font-body text-sm font-semibold text-premium-muted transition-colors hover:text-premium-text sm:self-auto"
            >
              Ver catálogo completo
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>

          {/* Marquee em 100vw: mais cards visíveis em ultrawide; largura do card inalterada. */}
          <div className="relative w-full">
            <div className="group-marquee relative">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-premium-bg to-transparent sm:w-14 md:w-20 lg:w-24 min-[2000px]:w-28"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-premium-bg to-transparent sm:w-14 md:w-20 lg:w-24 min-[2000px]:w-28"
                aria-hidden
              />
              <div
                className="overflow-hidden pt-5 pb-8 sm:pt-6 md:pt-7"
                role="region"
                aria-label="Sorteios disponíveis em movimento contínuo"
              >
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
          </div>
        </section>
      )}

      {!loading ? <LastWinnersHall /> : null}
      <LiveSalesPulse />
    </div>
  );
}
