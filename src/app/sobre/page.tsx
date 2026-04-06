import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  Heart,
  Scale,
  Shield,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre nós",
  description:
    "Conheça a Apex Keys: plataforma de sorteios de jogos e chaves digitais com transparência total, pagamentos via PIX e carteira própria.",
};

const surfacePanel =
  "rounded-2xl border border-premium-border bg-premium-surface shadow-[0_8px_32px_rgba(0,0,0,0.35)]";

const pillars = [
  {
    icon: Scale,
    title: "Transparência",
    body:
      "Regras claras, números visíveis em tempo real e comunicação direta em cada etapa do sorteio. Aqui você sabe exatamente o que está comprando, quem mais participou e quando o resultado acontece — sem letras miúdas.",
  },
  {
    icon: Shield,
    title: "Segurança",
    body:
      "Pagamentos exclusivamente via PIX e pela nossa carteira interna. Sem armazenar dados de cartão, sem intermediários desnecessários. Cada transação fica registrada no seu histórico e pode ser consultada a qualquer momento.",
  },
  {
    icon: Target,
    title: "Experiência",
    body:
      "Interface pensada para quem joga: escolha seus números, acompanhe o progresso da rifa e receba a chave diretamente na conta. Menos cliques, mais clareza — e suporte humano quando você precisar.",
  },
] as const;

const differentials = [
  {
    icon: Eye,
    title: "Rifas 100 % visíveis",
    body:
      "A grelha de números de cada rifa é pública. Qualquer visitante pode ver quais cotas foram vendidas, quais estão reservadas e quantas ainda restam — antes mesmo de criar conta.",
  },
  {
    icon: Wallet,
    title: "Carteira própria",
    body:
      "Seu saldo fica em uma carteira interna segura. Deposite via PIX a qualquer hora, use para participar de múltiplas rifas sem precisar pagar uma por uma e acompanhe todo o extrato no painel.",
  },
  {
    icon: Zap,
    title: "PIX instantâneo",
    body:
      "Pagamos e recebemos via PIX. Depósitos caem em segundos; sem esperar compensação de boleto, sem taxa de cartão. Quando você ganhar, o resgate da chave digital é imediato.",
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
        {/* Hero */}
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-muted">
            Institucional
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-premium-text sm:text-4xl md:text-5xl">
            Sobre a Apex Keys
          </h1>
          <p className="mt-6 text-base leading-relaxed text-premium-muted sm:text-lg">
            Somos uma plataforma de sorteios de jogos e chaves digitais feita para a
            comunidade gamer brasileira. Cada rifa tem regras claras, pagamentos via PIX e
            carteira própria, números visíveis em tempo real e entrega direta na sua conta
            — porque acreditamos que transparência não é diferencial, é obrigação.
          </p>
        </header>

        {/* Proposta */}
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
                  Por que a Apex Keys existe
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-premium-muted sm:text-base">
                  O mercado de rifas digitais cresce rápido — mas nem sempre com a
                  seriedade que os jogadores merecem. Criamos a Apex Keys para mudar isso:
                  uma plataforma onde você entra sabendo o preço de cada cota, o total de
                  participantes, a forma de sorteio e os critérios de entrega. Nada fica
                  escondido em rodapés e nenhuma regra muda depois que você pagou.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-premium-muted sm:text-base">
                  Nossa carteira interna e o PIX como único meio de pagamento são escolhas
                  deliberadas: queremos que cada centavo seja rastreável, que o seu
                  histórico esteja sempre disponível e que o fluxo de depósito → participação
                  → resultado → entrega seja o mais direto possível.
                </p>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    "Números em tempo real para todos os visitantes",
                    "Histórico completo de transações na conta",
                    "Entrega de chaves digitais direto na plataforma",
                    "Sorteio comunicado com antecedência e documentado",
                    "Suporte humano para dúvidas e imprevistos",
                    "Plataforma em evolução constante com a comunidade",
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

        {/* Pilares */}
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
              Três princípios que atravessam todas as nossas decisões de produto e
              relacionamento com a comunidade.
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

        {/* Diferenciais */}
        <section
          className="mt-14 sm:mt-16"
          aria-labelledby="sobre-diferenciais-heading"
        >
          <div className="mb-8 text-center sm:mb-10">
            <h2
              id="sobre-diferenciais-heading"
              className="text-2xl font-bold tracking-tight text-premium-text sm:text-3xl"
            >
              Como funciona na prática
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-premium-muted sm:text-base">
              Recursos que tornam a experiência mais simples, rápida e auditável do início
              ao fim.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {differentials.map(({ icon: Icon, title, body }) => (
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

        {/* Compromisso de transparência */}
        <section
          className="mt-14 sm:mt-16"
          aria-labelledby="sobre-transparencia-heading"
        >
          <div className={`${surfacePanel} overflow-hidden p-8 sm:p-10 lg:p-12`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-premium-border bg-premium-bg text-premium-accent">
                <Eye className="size-6" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="sobre-transparencia-heading"
                  className="text-xl font-bold tracking-tight text-premium-text sm:text-2xl"
                >
                  Nosso compromisso com a transparência
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-premium-muted sm:text-base">
                  Transparência para nós não é campanha de marketing — é arquitetura.
                  Por isso a grelha de cada rifa é pública, o progresso de vendas é visível
                  a qualquer pessoa e o método de sorteio é descrito antes da compra.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-premium-muted sm:text-base">
                  Do lado financeiro, optamos por PIX como único meio de pagamento externo:
                  cada operação gera um identificador rastreável e fica registrada no
                  histórico da sua conta. Nossa carteira interna não cobra taxas de depósito
                  e o saldo nunca some sem motivo — se houver qualquer inconsistência,
                  você tem o extrato para confrontar.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-premium-muted sm:text-base">
                  Quando uma rifa for encerrada, o resultado é comunicado por todos os
                  canais oficiais com o número sorteado, a identidade do ganhador (com a
                  devida concordância) e o comprovante de entrega da chave digital.
                  Acreditamos que confiar deve custar zero esforço para quem participa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gratidão */}
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
                  A Apex Keys existe porque jogadores reais apostaram sua confiança aqui
                  antes de qualquer prova de conceito consolidada. Cada rifa comprada,
                  cada indicação para um amigo, cada feedback enviado — tudo isso molda o
                  que a plataforma é hoje e o que ela vai se tornar.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-premium-muted sm:text-base">
                  Não somos perfeitos e às vezes vamos errar. Mas o compromisso é sempre
                  o mesmo: comunicar abertamente, corrigir rapidamente e tratar cada pessoa
                  da comunidade com o respeito que merece.{" "}
                  <span className="text-premium-text/90">
                    Obrigado por construir isso com a gente.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
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
                Pronto para participar?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-premium-muted">
                Explore o catálogo, leia as regras de cada rifa e entre no sorteio que
                mais fizer sentido para você — com PIX rápido ou saldo na carteira.
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
