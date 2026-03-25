"use client";

import { HomeImagePreloads } from "@/components/home/HomeImagePreloads";
import { getRaffles } from "@/lib/api/services";
import { raffleImageUrl } from "@/lib/raffle-image-url";
import type { RaffleListOut } from "@/types/api";
import {
  ChevronRight,
  Flame,
  Gamepad2,
  Loader2,
  Lock,
  Sparkles,
  Ticket,
} from "lucide-react";
import { LastWinnersHall } from "@/components/social/LastWinnersHall";
import { LiveSalesPulse } from "@/components/social/LiveSalesPulse";
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
        className={`${MARQUEE_CARD_SHELL} ${glassCard} transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:border-apex-primary/30 hover:shadow-[0_24px_56px_rgba(0,0,0,0.45),0_0_0_1px_rgba(0,77,230,0.2),0_0_48px_rgba(0,77,230,0.06)]`}
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
            <p className="font-heading text-sm font-semibold tracking-wide text-apex-text/50 sm:text-base">
              Próximos sorteios
            </p>
            <p className="line-clamp-3 font-body text-xs leading-relaxed text-apex-text-muted/45 sm:line-clamp-2">
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
            className="flex w-full items-center justify-center rounded-xl border border-dashed border-white/10 py-3 font-body text-sm font-medium text-apex-text-muted/50 transition-all duration-300 ease-in-out group-hover:border-apex-accent/40 group-hover:bg-white/[0.06] group-hover:text-apex-accent/85"
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
        className={`${MARQUEE_CARD_SHELL} ${glassCard} transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:border-apex-primary/30 hover:shadow-[0_28px_68px_rgba(0,0,0,0.42),0_0_0_1px_rgba(0,77,230,0.22),0_0_52px_rgba(0,229,255,0.1)]`}
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
              <h3 className="line-clamp-2 font-heading text-lg font-bold tracking-tight text-white drop-shadow-md md:text-xl">
                {raffle.title}
              </h3>
              <p className="mt-1.5 font-mono text-sm font-semibold text-apex-accent/95">
                {formatBRL(raffle.ticket_price)} / cota
              </p>
              <ProgressTrack className="mt-3 h-2">
                <ProgressFill pct={pct} />
              </ProgressTrack>
              <p className="mt-2 font-mono text-xs font-medium tabular-nums text-white/75">
                {raffle.sold}/{raffle.total_tickets} vendidos
              </p>
            </div>
          </div>
          <div className="border-t border-white/[0.06] bg-black/20 p-4">
            <span className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-gradient-to-r from-apex-accent/15 to-teal-500/10 py-3 font-body text-sm font-bold text-apex-accent transition-all duration-300 ease-in-out group-hover:border-apex-accent/50 group-hover:from-apex-accent/28 group-hover:to-teal-400/22 group-hover:text-white group-hover:shadow-[0_0_24px_rgba(0,229,255,0.22)] group-hover:brightness-[1.06]">
              <Ticket className="size-4 transition-transform duration-300 group-hover:scale-105" aria-hidden />
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
      className="relative w-full overflow-x-clip bg-apex-bg"
      aria-busy
      aria-label="A carregar destaque"
    >
      <div className="flex min-h-[min(72vh,820px)] items-center justify-center bg-black">
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
      className="relative z-[1] w-full overflow-x-clip bg-black shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45),0_20px_60px_-15px_rgba(0,0,0,0.55)]"
      aria-roledescription="carrossel"
      aria-label="Sorteios em destaque no topo"
    >
      <div
        className="relative min-h-[min(78vh,900px)] w-full overflow-x-clip border-b border-white/[0.05] bg-black lg:min-h-[min(82vh,960px)]"
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

        {/* Scrim à esquerda quase preto; direita com imagem mais contida no escuro. */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-black/32"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(90deg,rgb(0_0_0/0.92)_0%,rgb(0_0_0/0.78)_20%,rgb(0_0_0/0.48)_36%,rgb(0_0_0/0.18)_50%,transparent_62%)]"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-[min(78vh,900px)] w-full items-end lg:min-h-[min(82vh,960px)] lg:items-center">
          <div className="w-full px-5 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32 md:px-10 md:pb-20 md:pt-36 lg:px-14 lg:pt-40 xl:px-20 2xl:px-28">
            <div className="mx-auto w-full max-w-[min(1920px,100%)]">
              <div className="max-w-xl lg:max-w-2xl xl:max-w-[42rem]">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border border-apex-accent/30 bg-black/30 px-4 py-1.5 font-heading text-xs font-bold uppercase tracking-[0.2em] text-apex-accent ${CTA_GLOW}`}
                >
                  <Flame className="size-3.5" strokeWidth={2} aria-hidden />
                  Destaque
                  {slides.length > 1 ? (
                    <span className="font-mono font-medium tracking-normal text-white/50">
                      {safeIndex + 1}/{slides.length}
                    </span>
                  ) : null}
                </span>
                <h1 className="mt-6 font-heading text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl">
                  {raffle.title}
                </h1>
                <p className="mt-5 max-w-lg font-body text-base leading-relaxed text-white/70 sm:text-lg">
                  Garanta sua chave Steam com pagamento seguro e números
                  auditáveis — transparência de ponta a ponta.
                </p>

                <div className="mt-8 max-w-md space-y-3">
                  <ProgressTrack className="h-3">
                    <ProgressFill pct={heroPct} />
                  </ProgressTrack>
                  <div className="flex flex-wrap items-center justify-between gap-3 font-body text-sm text-white/60">
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
                  <p className="font-body text-sm font-medium text-white/50">A partir de</p>
                  <p className="font-mono text-3xl font-bold tabular-nums tracking-tight text-apex-accent sm:text-4xl">
                    {formatBRL(raffle.ticket_price)}
                    <span className="ml-2 font-body text-lg font-semibold text-white/50">
                      / cota
                    </span>
                  </p>
                </div>

                <Link
                  href={`/raffle/${raffle.id}`}
                  className={`mt-10 inline-flex w-full max-w-md items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-apex-accent via-cyan-400 to-teal-400 px-8 py-4 font-body text-base font-bold text-[#031018] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] sm:w-auto ${CTA_GLOW}`}
                >
                  <Ticket className="size-5 shrink-0" aria-hidden />
                  Garantir meu número
                </Link>
                <p className="mt-4 flex max-w-md flex-wrap items-center gap-1.5 font-body text-xs text-apex-text-muted">
                  <Lock
                    className="size-3.5 shrink-0 text-apex-accent/70"
                    strokeWidth={2}
                    aria-hidden
                  />
                  Pagamento 100% Seguro via Pix • Chave entregue na hora
                </p>

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
    <div className="overflow-x-clip font-body">
      <HomeImagePreloads urls={imagePreloadUrls} />

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
            <p className="mt-6 font-body text-lg text-apex-text-muted/90">
              Nenhuma rifa ativa no momento.
            </p>
            <p className="mt-2 font-body text-sm text-apex-text-muted/60">
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
        <section className="relative mx-auto w-full max-w-none px-4 pt-12 pb-14 sm:px-6 md:pt-14 md:pb-16 lg:px-10 lg:pt-16 lg:pb-18 xl:px-12 2xl:px-14 min-[1800px]:px-16 min-[2400px]:px-20">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between md:mb-10">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-white md:text-3xl">
                Mais sorteios
              </h2>
              <p className="mt-2 max-w-xl font-body text-sm text-apex-text-muted/80">
                Explore outras oportunidades — novos jogos chegam em breve.
              </p>
            </div>
            <Link
              href="/rifas"
              className="mt-4 inline-flex w-fit items-center gap-2 font-body text-sm font-semibold text-apex-accent transition-colors hover:text-white sm:mt-0"
            >
              Ver catálogo completo
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>

          {/* Marquee em 100vw: mais cards visíveis em ultrawide; largura do card inalterada. */}
          <div className="relative w-full">
            <div className="group-marquee relative">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0A111F] to-transparent sm:w-14 md:w-20 lg:w-24 min-[2000px]:w-28"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0A111F] to-transparent sm:w-14 md:w-20 lg:w-24 min-[2000px]:w-28"
                aria-hidden
              />
              <div
                className="overflow-hidden pt-2 pb-8"
                role="region"
                aria-label="Mais sorteios em movimento contínuo"
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
