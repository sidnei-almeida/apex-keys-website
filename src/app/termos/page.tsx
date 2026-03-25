import type { Metadata } from "next";
import {
  LegalDocShell,
  LegalSectionTitle,
} from "@/components/legal/LegalDocShell";

export const metadata: Metadata = {
  title: "Termos de Serviço | Apex Keys",
  description:
    "Termos e condições de uso da plataforma Apex Keys — sorteios, pagamentos e entrega de chaves digitais.",
  robots: { index: true, follow: true },
};

export default function TermosPage() {
  return (
    <LegalDocShell title="Termos de Serviço">
      <p>
        Estes Termos de Serviço (&quot;Termos&quot;) regulam o acesso e a utilização
        do site, aplicativos e serviços da{" "}
        <strong className="text-apex-text/90">Apex Keys</strong>, doravante também
        designada por &quot;Plataforma&quot; ou referida na primeira pessoa do plural
        como &quot;nós&quot;, incluindo a
        participação em sorteios de cotas, aquisição de produtos digitais e utilização
        de funcionalidades associadas (por exemplo, carteira, reservas e pagamentos).
      </p>
      <p>
        Ao criar conta, efetuar compras ou utilizar a Plataforma, declara que leu,
        compreendeu e aceita integralmente estes Termos. Se não concordar, não deve
        utilizar os serviços.
      </p>

      <LegalSectionTitle firstSection>1. Aceitação e alterações</LegalSectionTitle>
      <p>
        A utilização da Plataforma implica aceitação destes Termos e das políticas
        referenciadas (incluindo a Política de Privacidade). Reservamo-nos o direito de
        atualizar os Termos; a data da última revisão será indicada no final desta
        página. Alterações relevantes podem ser comunicadas por meios razoáveis (por
        exemplo, aviso no site ou por e-mail). O uso continuado após a entrada em
        vigor das alterações constitui aceitação, salvo disposição legal em contrário.
      </p>

      <LegalSectionTitle>2. Natureza do serviço</LegalSectionTitle>
      <p>
        A Apex Keys opera como plataforma de comercialização e gestão de sorteios de
        cotas sobre produtos digitais (por exemplo, chaves de ativação para
        plataformas como a Steam) e serviços conexos. Os sorteios seguem regras
        próprias de cada campanha (número de cotas, preço, datas e condições de
        encerramento), sempre disponibilizadas na página do respetivo sorteio.
      </p>
      <p>
        Os jogos e marcas citados pertencem aos respetivos titulares. A Apex Keys não
        é afiliada oficialmente a Valve, Steam ou outros detentores de IP, salvo
        menção expressa em contrário.
      </p>

      <LegalSectionTitle>3. Elegibilidade e conta</LegalSectionTitle>
      <ul className="list-disc space-y-2 pl-6 marker:text-apex-text-muted/80">
        <li>
          Deve ter capacidade legal para celebrar contratos no seu país de residência
          e, quando aplicável, idade mínima legal para participar em atividades de
          comércio eletrónico.
        </li>
        <li>
          É responsável pela veracidade dos dados de registo (nome, e-mail, contacto,
          chave PIX quando solicitada) e pela confidencialidade das credenciais da
          conta.
        </li>
        <li>
          A conta é pessoal e intransmissível. Detectada utilização fraudulenta,
          fraude de pagamento ou violação destes Termos, podemos suspender ou encerrar
          a conta e recusar prestação do serviço.
        </li>
      </ul>

      <LegalSectionTitle>4. Regras de participação nos sorteios</LegalSectionTitle>
      <ul className="list-disc space-y-2 pl-6 marker:text-apex-text-muted/80">
        <li>
          Cada sorteio rege-se pelas informações apresentadas na Plataforma (preço da
          cota, quantidade total, estado do sorteio e condições de participação).
        </li>
        <li>
          A aquisição de uma ou mais cotas não garante prémio; o resultado depende do
          sorteio e das regras da campanha, divulgadas com transparência.
        </li>
        <li>
          Reservamo-nos o direito de cancelar ou suspender sorteios em caso de erro
          manifesto, fraude, força maior ou ordem legal, com os devidos reembolsos ou
          créditos quando aplicável e conforme a lei.
        </li>
      </ul>

      <LegalSectionTitle>5. Pagamentos (incluindo PIX)</LegalSectionTitle>
      <p>
        Os pagamentos podem ser processados através de meios disponibilizados na
        Plataforma (por exemplo, PIX, carteira interna ou outros gateways indicados no
        checkout). Ao iniciar um pagamento, autoriza a cobrança do valor indicado,
        incluindo impostos ou taxas quando aplicáveis e expressas antes da conclusão
        da compra.
      </p>
      <ul className="list-disc space-y-2 pl-6 marker:text-apex-text-muted/80">
        <li>
          Transações PIX estão sujeitas aos prazos e confirmações da rede e dos
          parceiros de pagamento; até à confirmação, a reserva de cotas pode estar
          sujeita a expiração conforme as regras exibidas no fluxo de compra.
        </li>
        <li>
          Deve utilizar apenas métodos de pagamento de que seja titular legítimo.
          Operações suspeitas podem ser bloqueadas e reportadas conforme a lei.
        </li>
      </ul>

      <LegalSectionTitle>6. Entrega de chaves e ativos digitais</LegalSectionTitle>
      <p>
        Após confirmação do pagamento e conclusão do sorteio (quando aplicável), a
        entrega de chaves ou códigos digitais será feita pelos meios indicados na
        Plataforma (por exemplo, área do utilizador, e-mail registado ou instruções
        na página do prémio).
      </p>
      <ul className="list-disc space-y-2 pl-6 marker:text-apex-text-muted/80">
        <li>
          A ativação do produto nas plataformas terceiras (como Steam) está sujeita aos
          termos desses serviços e à região da chave; é sua responsabilidade verificar
          compatibilidade antes da compra quando tal informação estiver disponível.
        </li>
        <li>
          Chaves reveladas ou entregues são consideradas consumíveis digitais; guarde
          cópias seguras e não partilhe códigos com terceiros.
        </li>
      </ul>

      <LegalSectionTitle>7. Política de reembolso e arrependimento</LegalSectionTitle>
      <p>
        Produtos digitais com entrega imediata ou após sorteio podem estar excluídos
        do direito de arrependimento nos termos do Código de Defesa do Consumidor
        brasileiro (art. 49, § 2º, inciso II — bens digitais de entrega imediata),
        quando aplicável e após início da prestação com seu consentimento expresso.
      </p>
      <p>
        Em caso de falha técnica comprovada atribuível à Plataforma, cobrança
        indevida, sorteio cancelado conforme as regras da campanha ou obrigação legal,
        analisaremos pedido de reembolso ou crédito em carteira, mediante comprovação e
        prazos razoáveis de análise.
      </p>
      <p>
        Não há reembolso por arrependimento após resgate ou utilização da chave,
        salvo direito legal imperativo em contrário.
      </p>

      <LegalSectionTitle>8. Conduta e uso proibido</LegalSectionTitle>
      <p>É proibido utilizar a Plataforma para:</p>
      <ul className="list-disc space-y-2 pl-6 marker:text-apex-text-muted/80">
        <li>Violar leis, direitos de terceiros ou estes Termos;</li>
        <li>
          Burlar sistemas de segurança, automatizar abusivamente compras ou criar
          contas falsas;
        </li>
        <li>Lavagem de dinheiro, fraude de cartão/PIX ou qualquer ilícito financeiro.</li>
      </ul>

      <LegalSectionTitle>9. Limitação de responsabilidade</LegalSectionTitle>
      <p>
        Na medida máxima permitida pela lei aplicável, a Plataforma é prestada
        &quot;no estado em que se encontra&quot;. Não garantimos funcionamento
        ininterrupto ou isento de erros. Não nos responsabilizamos por danos
        indiretos, lucros cessantes ou perdas decorrentes de uso de serviços de
        terceiros (operadoras de pagamento, Steam, etc.), sem prejuízo de direitos
        irrenunciáveis do consumidor.
      </p>

      <LegalSectionTitle>10. Propriedade intelectual</LegalSectionTitle>
      <p>
        Conteúdos da Apex Keys (marca, layout, textos e elementos gráficos próprios)
        são protegidos por lei. É vedada cópia ou uso comercial não autorizado.
      </p>

      <LegalSectionTitle>11. Lei aplicável e foro</LegalSectionTitle>
      <p>
        Estes Termos regem-se pelas leis da República Federativa do Brasil. Fica
        eleito o foro da comarca de domicílio do consumidor para questões em que a
        legislação consumerista assim exija; nos demais casos, competirá o foro da
        sede da Apex Keys, salvo norma legal imperativa em contrário.
      </p>

      <LegalSectionTitle>12. Contato</LegalSectionTitle>
      <p>
        Para questões sobre estes Termos, utilize os canais oficiais indicados no
        site (suporte ou e-mail de contacto), quando disponíveis.
      </p>

      <p className="pt-4 text-sm text-apex-text-muted/70">
        Última atualização: março de 2026.
      </p>
    </LegalDocShell>
  );
}
