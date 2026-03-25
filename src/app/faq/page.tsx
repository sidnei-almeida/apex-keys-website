import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description:
    "Respostas sobre participação, pagamentos, sorteios e suporte na Apex Keys.",
};

const surfacePanel =
  "rounded-2xl border border-premium-border bg-premium-surface shadow-[0_8px_32px_rgba(0,0,0,0.35)]";

type FaqItem = { q: string; a: string };

const sections: { id: string; title: string; intro: string; items: FaqItem[] }[] =
  [
    {
      id: "participacao",
      title: "Participação e pagamentos",
      intro:
        "Informações gerais sobre como entrar nos sorteios e concluir a compra — ajuste os detalhes quando os fluxos da sua operação estiverem definidos.",
      items: [
        {
          q: "Como participo de uma rifa?",
          a: "Escolha o sorteio no catálogo, confira regras e disponibilidade de cotas, selecione a quantidade desejada e siga o fluxo de pagamento até a confirmação. Depois do pagamento aprovado, seus números passam a constar na rifa conforme as regras exibidas na página do sorteio.",
        },
        {
          q: "Quais formas de pagamento são aceitas?",
          a: "As opções disponíveis aparecem no momento do checkout (por exemplo, PIX ou outros meios que vocês integrarem). Esta resposta deve refletir exatamente o que a plataforma oferece hoje.",
        },
        {
          q: "Meu pagamento é seguro?",
          a: "Utilizamos processos e parceiros de pagamento alinhados às boas práticas do mercado. Nunca compartilhe senhas ou códigos por canais não oficiais — o suporte legítimo não pede esse tipo de dado.",
        },
        {
          q: "Posso pedir reembolso ou desistir depois de pagar?",
          a: "Políticas de cancelamento e reembolso dependem das regras de cada campanha e da legislação aplicável. Documente aqui o critério oficial da Apex Keys (prazos, exceções e canal de solicitação) para evitar ambiguidade.",
        },
      ],
    },
    {
      id: "sorteios",
      title: "Sorteios, prêmios e entrega",
      intro:
        "Transparência no encerramento e na entrega reforça confiança — personalize estes textos com o processo real da empresa.",
      items: [
        {
          q: "Como o sorteio é realizado?",
          a: "Descreva o método oficial (plataforma, critério de randomização, testemunhas, transmissão ao vivo, etc.). O importante é que o participante entenda que o resultado segue regras fixas e auditáveis.",
        },
        {
          q: "Quando e como recebo o prêmio se ganhar?",
          a: "Explique o prazo típico, o canal de contato (e-mail, área logada, suporte) e o formato da entrega (chave Steam, instruções de resgate, etc.). Inclua o que o ganhador precisa ter em mãos (conta, documento, se for o caso).",
        },
        {
          q: "O que acontece se a rifa não atingir a meta de vendas?",
          a: "Defina claramente se há extensão de prazo, cancelamento com devolução proporcional ou outro encerramento. Texto genérico evita promessas incorretas — substitua pela política vigente.",
        },
        {
          q: "Onde vejo meus números e o status do sorteio?",
          a: "Normalmente na área da conta (ex.: “Minhas rifas”) e na página pública do sorteio. Ajuste para apontar para as rotas reais do seu site.",
        },
      ],
    },
    {
      id: "conta",
      title: "Conta e suporte",
      intro:
        "Canais claros reduzem fricção — atualize com e-mail, horário de atendimento e links úteis.",
      items: [
        {
          q: "Preciso criar uma conta?",
          a: "Se a participação exige cadastro, explique o motivo (histórico, comunicação de resultado, segurança). Se houver participação sem login em algum fluxo, mencione também.",
        },
        {
          q: "Esqueci minha senha ou não consigo entrar",
          a: "Indique o uso da opção “Esqueci minha senha” na página de login e, se necessário, o contato com suporte com dados que ajudem a identificar a conta (sem pedir senha por mensagem).",
        },
        {
          q: "Como falo com o suporte?",
          a: "Substitua por: e-mail oficial, formulário, Discord, WhatsApp ou ticket — o que vocês usarem de fato. Evite endereços genéricos se ainda não existirem.",
        },
        {
          q: "Encontrei um problema técnico no site",
          a: "Peça para anotar data, navegador, print da tela e mensagem de erro e enviar pelo canal de suporte. Isso agiliza a análise pela equipe.",
        },
      ],
    },
  ];

function FaqDisclosure({ item }: { item: FaqItem }) {
  return (
    <details
      className={`group ${surfacePanel} overflow-hidden transition-[border-color] open:border-premium-accent/40`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <span className="text-left text-sm font-semibold leading-snug text-premium-text sm:text-base">
          {item.q}
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-premium-muted transition-transform duration-200 ease-out group-open:rotate-180 group-open:text-premium-accent"
          aria-hidden
        />
      </summary>
      <div className="border-t border-premium-border px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <p className="text-sm leading-relaxed text-premium-muted">
          {item.a}
        </p>
      </div>
    </details>
  );
}

export default function FaqPage() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-premium-accent/[0.06] via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-muted">
            Ajuda
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-premium-text sm:text-4xl md:text-5xl">
            Perguntas frequentes
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-premium-muted sm:text-lg">
            Respostas objetivas sobre participação, pagamentos e sorteios. Os textos
            abaixo são base profissional para você substituir pelas políticas e
            processos reais da Apex Keys.
          </p>
        </header>

        <div className="mt-14 space-y-14 sm:mt-16 sm:space-y-16">
          {sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`faq-${section.id}-heading`}
            >
              <div className="mb-6">
                <h2
                  id={`faq-${section.id}-heading`}
                  className="text-xl font-bold tracking-tight text-premium-text sm:text-2xl"
                >
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-premium-muted sm:text-base">
                  {section.intro}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:gap-4">
                {section.items.map((item) => (
                  <FaqDisclosure key={item.q} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside
          className={`${surfacePanel} mt-14 flex flex-col gap-5 border-premium-border p-6 sm:mt-16 sm:flex-row sm:items-center sm:justify-between sm:p-8`}
          aria-labelledby="faq-aside-heading"
        >
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-premium-border bg-premium-bg text-premium-accent">
              <HelpCircle className="size-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2
                id="faq-aside-heading"
                className="text-base font-bold text-premium-text sm:text-lg"
              >
                Não achou o que precisa?
              </h2>
              <p className="mt-1 text-sm text-premium-muted">
                Veja também a página institucional ou o catálogo de rifas. Inclua
                aqui o canal de suporte quando estiver definido.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row">
            <Link
              href="/sobre"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-premium-border bg-premium-bg px-5 py-3 text-sm font-semibold text-premium-text transition-colors hover:border-premium-accent hover:text-premium-accent"
            >
              <MessageCircle className="size-4" aria-hidden />
              Sobre nós
            </Link>
            <Link
              href="/rifas"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-premium-accent px-5 py-3 text-sm font-bold text-black transition-opacity hover:opacity-95 active:opacity-90"
            >
              Ver rifas
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
