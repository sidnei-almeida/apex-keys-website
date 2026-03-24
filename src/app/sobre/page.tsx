import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Scale,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre nós",
  description:
    "Conheça a Apex Keys: nossa missão, valores e compromisso com sorteios transparentes de chaves e jogos digitais.",
};

const glass =
  "rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150";

const pillars = [
  {
    icon: Scale,
    title: "Transparência",
    body:
      "Regras claras, números visíveis e comunicação direta em cada etapa do sorteio — para você saber exatamente em que está a participar.",
  },
  {
    icon: Shield,
    title: "Segurança",
    body:
      "Processos pensados para proteger dados e pagamentos, com foco em confiança entre quem organiza e quem joga com a gente.",
  },
  {
    icon: Target,
    title: "Experiência",
    body:
      "Interface objetiva, suporte quando precisar e entrega alinhada ao que prometemos: menos fricção, mais clareza.",
  },
] as const;

export default function SobrePage() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-apex-accent/[0.07] via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-apex-accent/90">
            Institucional
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Sobre nós
          </h1>
          <p className="mt-6 text-base leading-relaxed text-apex-text-muted/90 sm:text-lg">
            A Apex Keys é uma plataforma dedicada a sorteios de chaves e conteúdos
            digitais para a comunidade gamer. Unimos tecnologia, processos claros e
            atenção ao jogador — você pode ajustar este texto quando a narrativa da
            marca estiver fechada.
          </p>
        </header>

        <section
          className="mt-16 sm:mt-20"
          aria-labelledby="sobre-missao-heading"
        >
          <div className={`${glass} p-8 sm:p-10 lg:p-12`}>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-apex-accent/25 bg-apex-accent/10 text-apex-accent">
                <Sparkles className="size-6" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="sobre-missao-heading"
                  className="text-xl font-bold tracking-tight text-white sm:text-2xl"
                >
                  Nossa proposta
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-apex-text-muted/88 sm:text-base">
                  Queremos que participar de um sorteio seja simples e previsível:
                  informações acessíveis, fluxo de compra objetivo e critérios de
                  encerramento e entrega bem definidos. Este bloco é intencionalmente
                  genérico — substitua por missão, história da equipe ou números que
                  quiser destacar.
                </p>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    "Foco em comunicação honesta com a comunidade",
                    "Evolução contínua da plataforma com base em feedback",
                    "Compromisso com suporte e resolução de dúvidas",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm text-apex-text-muted/85"
                    >
                      <BadgeCheck
                        className="mt-0.5 size-5 shrink-0 text-apex-accent/80"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mt-14 sm:mt-16"
          aria-labelledby="sobre-valores-heading"
        >
          <div className="mb-8 text-center sm:mb-10">
            <h2
              id="sobre-valores-heading"
              className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              O que nos guia
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-apex-text-muted/80 sm:text-base">
              Três eixos que estruturam como pensamos produto e relacionamento —
              edite à vontade conforme a identidade da Apex Keys evoluir.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className={`${glass} flex flex-col p-6 sm:p-8`}
              >
                <div className="flex size-11 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] text-apex-accent">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-apex-text-muted/85">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="mt-14 sm:mt-16"
          aria-labelledby="sobre-cta-heading"
        >
          <div
            className={`${glass} flex flex-col items-start justify-between gap-6 border-apex-accent/20 bg-gradient-to-br from-apex-accent/[0.06] to-transparent p-8 sm:flex-row sm:items-center sm:p-10`}
          >
            <div className="min-w-0">
              <h2
                id="sobre-cta-heading"
                className="text-lg font-bold text-white sm:text-xl"
              >
                Quer ver os sorteios disponíveis?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-apex-text-muted/85">
                Explore o catálogo, leia as regras de cada rifa e participe quando
                fizer sentido para você.
              </p>
            </div>
            <Link
              href="/rifas"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-apex-accent to-cyan-400 px-6 py-3.5 text-sm font-bold text-[#031018] shadow-[0_0_24px_rgba(0,229,255,0.25)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Ver rifas
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
