import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Heart,
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

const surfacePanel =
  "rounded-2xl border border-premium-border bg-premium-surface shadow-[0_8px_32px_rgba(0,0,0,0.35)]";

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
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-premium-accent/[0.06] via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-muted">
            Institucional
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-premium-text sm:text-4xl md:text-5xl">
            Sobre nós
          </h1>
          <p className="mt-6 text-base leading-relaxed text-premium-muted sm:text-lg">
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
          <div className={`${surfacePanel} p-8 sm:p-10 lg:p-12`}>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-premium-border bg-premium-bg text-premium-accent">
                <Sparkles className="size-6" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="sobre-missao-heading"
                  className="text-xl font-bold tracking-tight text-premium-text sm:text-2xl"
                >
                  Nossa proposta
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-premium-muted sm:text-base">
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
                      className="flex gap-3 text-sm text-premium-muted"
                    >
                      <BadgeCheck
                        className="mt-0.5 size-5 shrink-0 text-premium-accent"
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
              className="text-2xl font-bold tracking-tight text-premium-text sm:text-3xl"
            >
              O que nos guia
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-premium-muted sm:text-base">
              Três eixos que estruturam como pensamos produto e relacionamento —
              edite à vontade conforme a identidade da Apex Keys evoluir.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className={`${surfacePanel} flex flex-col p-6 sm:p-8`}
              >
                <div className="flex size-11 items-center justify-center rounded-lg border border-premium-border bg-premium-bg text-premium-accent">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-bold text-premium-text">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-premium-muted">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="mt-14 sm:mt-16"
          aria-labelledby="sobre-gratidao-heading"
        >
          <div className={`${surfacePanel} p-8 sm:p-10`}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-950/20 text-amber-200/90">
                <Heart className="size-6" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="sobre-gratidao-heading"
                  className="text-xl font-bold tracking-tight text-premium-text sm:text-2xl"
                >
                  Gratidão à comunidade
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-premium-muted sm:text-base">
                  Agradecemos de coração a quem compra rifas, recomenda a Apex Keys,
                  interage nas redes ou apoia o projeto de qualquer outra forma.
                  Cada participação ajuda a manter sorteios transparentes e a
                  comunidade gamer mais forte —{" "}
                  <span className="text-premium-text/90">
                    sem vocês, isto não existia.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mt-14 sm:mt-16"
          aria-labelledby="sobre-cta-heading"
        >
          <div
            className={`${surfacePanel} flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center sm:p-10`}
          >
            <div className="min-w-0">
              <h2
                id="sobre-cta-heading"
                className="text-lg font-bold text-premium-text sm:text-xl"
              >
                Quer ver os sorteios disponíveis?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-premium-muted">
                Explore o catálogo, leia as regras de cada rifa e participe quando
                fizer sentido para você.
              </p>
            </div>
            <Link
              href="/rifas"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-premium-accent px-6 py-3.5 text-sm font-bold text-black transition-opacity hover:opacity-95 active:opacity-90"
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
