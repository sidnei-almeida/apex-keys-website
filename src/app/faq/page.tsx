import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description:
    "Tudo sobre como participar, pagar via PIX, usar a carteira Apex Keys, acompanhar sorteios e receber prêmios.",
};

const surfacePanel =
  "rounded-2xl border border-premium-border bg-premium-surface shadow-[0_8px_32px_rgba(0,0,0,0.35)]";

type FaqItem = { q: string; a: string };

const sections: { id: string; title: string; intro: string; items: FaqItem[] }[] =
  [
    {
      id: "participacao",
      title: "Participação e compra de cotas",
      intro:
        "Entenda como entrar em uma rifa, escolher seus números e confirmar a participação.",
      items: [
        {
          q: "Como participo de uma rifa?",
          a: "Acesse o catálogo em /rifas, abra a rifa que te interessar e veja a grelha de números disponíveis. Selecione as cotas que quiser, escolha entre pagar via PIX ou usar o saldo da sua carteira Apex Keys e confirme. Após a aprovação do pagamento, seus números ficam registrados e aparecem na grelha com destaque.",
        },
        {
          q: "Preciso criar uma conta para participar?",
          a: "Sim. O cadastro é necessário para vincular os números ao seu perfil, garantir o recebimento do prêmio e manter o histórico das suas participações. O processo leva menos de um minuto: nome, e-mail e senha.",
        },
        {
          q: "Posso comprar mais de uma cota na mesma rifa?",
          a: "Sim, enquanto houver números disponíveis você pode selecionar quantas cotas quiser em uma única transação. Cada número é único por rifa — dois participantes nunca têm o mesmo número no mesmo sorteio.",
        },
        {
          q: "Como sei que meus números foram confirmados?",
          a: "Após o pagamento aprovado, os números aparecem na grelha da rifa com o seu avatar — qualquer pessoa pode ver que aquele número está reservado para você. Você também os encontra em \"Minhas Rifas\" e em \"Histórico de Rifas\" na sua conta.",
        },
      ],
    },
    {
      id: "pagamentos",
      title: "Pagamentos, PIX e carteira",
      intro:
        "A Apex Keys opera exclusivamente com PIX e carteira interna. Sem cartão de crédito, sem boleto e sem taxas escondidas.",
      items: [
        {
          q: "Quais formas de pagamento são aceitas?",
          a: "No momento aceitamos PIX e saldo da carteira Apex Keys. Não trabalhamos com cartão de crédito, débito ou boleto bancário. Essa escolha garante rastreabilidade total e liquidação imediata — você vê a confirmação em segundos.",
        },
        {
          q: "O que é a carteira Apex Keys?",
          a: "É um saldo em conta dentro da plataforma. Você deposita via PIX, o valor entra na carteira e pode ser usado para participar de rifas sem precisar gerar um novo QR Code a cada compra. Seu extrato completo fica em \"Minhas Transações\" e todo movimento fica registrado com data, valor e tipo de operação.",
        },
        {
          q: "Como deposito na carteira?",
          a: "Acesse \"Carteira\" no menu ou painel da conta, informe o valor e escaneie o QR Code PIX gerado. O crédito cai em segundos. Não há valor mínimo de depósito e não cobramos nenhuma taxa sobre ele.",
        },
        {
          q: "Meu pagamento é seguro?",
          a: "Sim. Usamos PIX como única entrada de recursos externos. Nenhum dado de cartão é armazenado ou processado pela plataforma. Todas as transações são registradas com identificador único e ficam no seu histórico — se quiser auditar qualquer operação, os dados estão lá.",
        },
        {
          q: "Posso pedir reembolso se desistir?",
          a: "Cotas já confirmadas em uma rifa em andamento não são reembolsadas, salvo em casos de cancelamento da própria rifa por iniciativa da Apex Keys. Se isso acontecer, o valor proporcional é devolvido automaticamente ao saldo da sua carteira. Dúvidas específicas: entre em contato com o suporte.",
        },
      ],
    },
    {
      id: "sorteios",
      title: "Sorteios, prêmios e entrega",
      intro:
        "Transparência do início ao resultado — aqui explicamos como as rifas são encerradas e como o prêmio chega até você.",
      items: [
        {
          q: "Como o sorteio é realizado?",
          a: "Quando todas as cotas de uma rifa são vendidas (ou o prazo encerra, conforme as regras da campanha), um número vencedor é sorteado de forma aleatória. O método e os critérios estão descritos na página de cada rifa antes da compra. O resultado é publicado nos canais oficiais da Apex Keys com o número sorteado e o identificador do ganhador.",
        },
        {
          q: "O que ganho se meu número for sorteado?",
          a: "Cada rifa indica claramente o prêmio na página de descrição — normalmente uma chave digital (Steam, PlayStation, Xbox, etc.) ou outro conteúdo digital informado. A chave é entregue diretamente na plataforma, na área de conta do ganhador, e ele é notificado por e-mail.",
        },
        {
          q: "Quando e como recebo o prêmio?",
          a: "Após a confirmação do resultado, a chave digital é disponibilizada na sua conta em até 24 horas. Você recebe um e-mail de notificação e pode acessar o código em \"Minhas Rifas\" na seção de prêmios. Caso haja qualquer atraso, o suporte acompanha o caso até a entrega.",
        },
        {
          q: "O que acontece se a rifa não atingir a meta de vendas?",
          a: "Se o prazo encerrar sem que todas as cotas sejam vendidas, a Apex Keys decide entre realizar o sorteio com as cotas disponíveis (se previsto nas regras da campanha) ou cancelar a rifa. Em caso de cancelamento, o valor integral pago por cada participante é devolvido ao saldo da carteira.",
        },
        {
          q: "Onde acompanho minhas rifas e o status do sorteio?",
          a: "Em \"Minhas Rifas\" você vê todas as rifas ativas em que participa, com seus números. Em \"Histórico de Rifas\" ficam os sorteios já encerrados. Você também pode entrar na página pública de qualquer rifa e ver a grelha de números atualizada em tempo real.",
        },
      ],
    },
    {
      id: "transparencia",
      title: "Transparência e confiança",
      intro:
        "Não pedimos que você confie cegamente — construímos a plataforma para que você possa verificar.",
      items: [
        {
          q: "Como sei que a Apex Keys não manipula os sorteios?",
          a: "A grelha de números de cada rifa é pública e exibe o estado de cada cota (disponível, reservada ou vendida) em tempo real — qualquer pessoa, mesmo sem conta, pode auditar. O método de sorteio é descrito antes da compra e o resultado é comunicado com o número vencedor, o timestamp e o comprovante de entrega ao ganhador.",
        },
        {
          q: "Posso ver quem comprou cada número?",
          a: "Por padrão, os números vendidos aparecem na grelha como \"vendido\" para visitantes. Usuários autenticados veem seus próprios números destacados com sua foto de perfil na grelha — uma camada visual de confirmação de posse que reforça a rastreabilidade.",
        },
        {
          q: "A Apex Keys tem acesso ao meu saldo depois que deposito?",
          a: "O saldo na carteira é seu e só é movimentado por ações que você autoriza: pagamento de cota, depósito ou estorno. Cada movimentação aparece no extrato com tipo, valor e data. Não existe cobrança automática, assinatura ou desconto não comunicado.",
        },
        {
          q: "O que acontece com meus dados pessoais?",
          a: "Coletamos apenas o necessário para operar (nome, e-mail, WhatsApp) e para comunicar resultados. Não vendemos nem compartilhamos dados com terceiros fora das finalidades descritas na nossa Política de Privacidade. Você pode solicitar a exclusão da conta a qualquer momento.",
        },
      ],
    },
    {
      id: "conta",
      title: "Conta e suporte",
      intro:
        "Dúvidas sobre cadastro, acesso e como falar com a gente quando algo não der certo.",
      items: [
        {
          q: "Esqueci minha senha ou não consigo entrar",
          a: "Na tela de login, clique em \"Esqueci minha senha\" e informe o e-mail cadastrado. Você receberá um link de redefinição em alguns minutos. Se não chegar, verifique a pasta de spam ou entre em contato com o suporte.",
        },
        {
          q: "Posso alterar meu e-mail ou dados cadastrais?",
          a: "Sim. Acesse \"Conta\" no menu de perfil e edite nome, WhatsApp, foto de perfil e chave PIX para reembolsos. Alterações de e-mail podem exigir confirmação por segurança.",
        },
        {
          q: "Como falo com o suporte?",
          a: "Utilize o canal de suporte oficial listado na página de contato. Nunca compartilhe senha, código PIX de pagamento ou dados sensíveis por canais não oficiais — a equipe da Apex Keys nunca pede isso.",
        },
        {
          q: "Encontrei um problema técnico no site",
          a: "Anote a data, o navegador que estava usando, o que tentou fazer e a mensagem de erro que apareceu (print ajuda muito). Envie essas informações pelo canal de suporte — quanto mais detalhes, mais rápido conseguimos reproduzir e corrigir.",
        },
        {
          q: "Posso excluir minha conta?",
          a: "Sim. Em \"Conta\" há a opção de desativar e agendar a exclusão definitiva. Seu saldo deve ser zerado antes da exclusão — qualquer valor remanescente pode ser solicitado via reembolso pelo suporte antes de confirmar.",
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
            Tudo que você precisa saber sobre participação, pagamentos via PIX, carteira,
            sorteios e como funciona a entrega dos prêmios.
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
                Ainda tem dúvidas?
              </h2>
              <p className="mt-1 text-sm text-premium-muted">
                Leia mais sobre a plataforma na página institucional ou veja as rifas
                disponíveis hoje.
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
