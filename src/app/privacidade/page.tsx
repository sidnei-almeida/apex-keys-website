import type { Metadata } from "next";
import {
  LegalDocShell,
  LegalSectionTitle,
} from "@/components/legal/LegalDocShell";

export const metadata: Metadata = {
  title: "Política de Privacidade | Apex Keys",
  description:
    "Como a Apex Keys trata os seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).",
  robots: { index: true, follow: true },
};

export default function PrivacidadePage() {
  return (
    <LegalDocShell title="Política de Privacidade">
      <p>
        A <strong className="text-premium-text">Apex Keys</strong>, doravante também
        designada por &quot;Plataforma&quot; ou referida na primeira pessoa do plural
        como &quot;nós&quot;, respeita a sua privacidade e trata dados pessoais em
        conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 —{" "}
        &quot;LGPD&quot;) e demais normas aplicáveis.
      </p>
      <p>
        Esta Política explica quais dados coletamos, para quê, com quem podemos
        partilhar, como protegemos e quais são os seus direitos enquanto titular.
      </p>

      <LegalSectionTitle firstSection>1. Controlador e encarregado</LegalSectionTitle>
      <p>
        O controlador dos dados pessoais tratados no âmbito desta Plataforma é a
        entidade responsável pela operação da Apex Keys. Para exercer direitos ou
        esclarecimentos, utilize os canais oficiais de contacto indicados no site
        (por exemplo, e-mail de privacidade ou suporte), quando publicados.
      </p>

      <LegalSectionTitle>2. Dados que podemos coletar</LegalSectionTitle>
      <p>Conforme a sua interação com os serviços, podemos tratar, entre outros:</p>
      <ul className="list-disc space-y-2 pl-6 marker:text-premium-muted">
        <li>
          <span className="text-premium-text">Dados de identificação e contacto:</span>{" "}
          nome, e-mail, telefone/WhatsApp, dados de conta e, quando necessário para
          pagamentos ou reembolsos, chave PIX ou informações solicitadas pelo gateway.
        </li>
        <li>
          <span className="text-premium-text">Dados transacionais:</span> histórico de
          compras, participação em sorteios, valores, identificadores de transação e
          estado de pagamento.
        </li>
        <li>
          <span className="text-premium-text">Dados técnicos e de utilização:</span>{" "}
          endereço IP, tipo de navegador, dispositivo, registos de acesso, cookies e
          tecnologias similares (quando utilizados), para segurança e melhoria do
          serviço.
        </li>
        <li>
          <span className="text-premium-text">Comunicações:</span> conteúdo de
          mensagens que nos envie através de formulários ou suporte.
        </li>
      </ul>

      <LegalSectionTitle>3. Finalidades e bases legais (LGPD)</LegalSectionTitle>
      <p>Tratamos dados pessoais para finalidades como:</p>
      <ul className="list-disc space-y-2 pl-6 marker:text-premium-muted">
        <li>
          Execução de contrato e gestão da conta: registo, autenticação, processamento
          de pedidos e participação em sorteios (base: execução de contrato).
        </li>
        <li>
          Pagamentos e prevenção à fraude: validação de transações, cumprimento de
          obrigações legais e regulatórias (bases: execução de contrato, obrigação
          legal e legítimo interesse, conforme o caso).
        </li>
        <li>
          Entrega de produtos digitais e suporte ao cliente (base: execução de
          contrato).
        </li>
        <li>
          Segurança da informação, auditoria e defesa em processos (bases: legítimo
          interesse e obrigação legal, quando aplicável).
        </li>
        <li>
          Comunicações sobre o serviço, alterações legais ou, quando permitido,
          marketing (bases: execução de contrato, legítimo interesse ou consentimento,
          conforme o canal e a legislação).
        </li>
      </ul>

      <LegalSectionTitle>4. Compartilhamento de dados</LegalSectionTitle>
      <p>
        Podemos partilhar dados com prestadores que nos auxiliam na operação (hospedagem,
        processamento de pagamentos, envio de e-mail, analytics), sempre sob contratos
        que exigem proteção adequada e uso limitado às finalidades indicadas.
      </p>
      <p>
        Também poderemos divulgar informações quando exigido por lei, ordem judicial
        ou autoridade competente, ou para proteger direitos, segurança e integridade da
        Plataforma e dos utilizadores.
      </p>
      <p>
        Não vendemos os seus dados pessoais a terceiros no sentido comercial tradicional
        de &quot;venda de listas&quot;.
      </p>

      <LegalSectionTitle>5. Transferência internacional</LegalSectionTitle>
      <p>
        Se utilizarmos serviços com servidores fora do Brasil, adotaremos garantias
        compatíveis com a LGPD, como cláusulas contratuais ou mecanismos reconhecidos
        pela autoridade nacional, quando aplicável.
      </p>

      <LegalSectionTitle>6. Retenção</LegalSectionTitle>
      <p>
        Conservamos dados pelo tempo necessário para cumprir as finalidades descritas,
        obrigações legais (por exemplo, fiscais e contabilísticas), resolução de litígios
        e exercício regular de direitos. Após o prazo, os dados serão eliminados ou
        anonimizados, salvo exceção legal.
      </p>

      <LegalSectionTitle>7. Segurança</LegalSectionTitle>
      <p>
        Adotamos medidas técnicas e organizacionais razoáveis para proteger dados
        contra acessos não autorizados, perda ou alteração indevida, incluindo uso de
        HTTPS, controlo de acessos e boas práticas de desenvolvimento. Nenhum sistema é
        100% seguro; recomendamos credenciais fortes e cautela com phishing.
      </p>

      <LegalSectionTitle>8. Cookies e tecnologias similares</LegalSectionTitle>
      <p>
        Podemos utilizar cookies ou tecnologias equivalentes para manter sessão,
        preferências, segurança e métricas agregadas de utilização. Pode gerir cookies
        através do seu navegador; desativar cookies essenciais pode afetar o
        funcionamento de partes do site.
      </p>

      <LegalSectionTitle>9. Direitos do titular (art. 18 da LGPD)</LegalSectionTitle>
      <p>
        Dependendo do caso e da legislação, pode solicitar, entre outros:
      </p>
      <ul className="list-disc space-y-2 pl-6 marker:text-premium-muted">
        <li>Confirmação da existência de tratamento e acesso aos dados;</li>
        <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>
          Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em
          desconformidade com a LGPD;
        </li>
        <li>Portabilidade dos dados a outro fornecedor, quando aplicável;</li>
        <li>
          Eliminação dos dados tratados com consentimento, quando não houver outra base
          legal;
        </li>
        <li>
          Informação sobre entidades com as quais compartilhamos dados e sobre a
          possibilidade de não fornecer consentimento e as consequências da negativa;
        </li>
        <li>Revogação do consentimento, quando o tratamento se basear nele.</li>
      </ul>
      <p>
        Pedidos podem ser feitos pelos canais oficiais de contacto. Poderemos solicitar
        confirmação de identidade antes de atender, para proteção contra acessos
        indevidos.
      </p>

      <LegalSectionTitle>10. Crianças e adolescentes</LegalSectionTitle>
      <p>
        Os serviços não se destinam a menores sem capacidade legal para contratar.
        Se tomarmos conhecimento de dados coletados indevidamente de menores, adotaremos
        medidas para eliminação, conforme a LGPD.
      </p>

      <LegalSectionTitle>11. Alterações desta Política</LegalSectionTitle>
      <p>
        Podemos atualizar esta Política para refletir mudanças legais ou nos serviços.
        A versão vigente estará sempre disponível nesta página, com data de
        atualização.
      </p>

      <LegalSectionTitle>12. Autoridade supervisora</LegalSectionTitle>
      <p>
        Sem prejuízo de reclamação junto à Apex Keys, pode apresentar reclamação à
        Autoridade Nacional de Proteção de Dados (ANPD), nos termos da legislação.
      </p>

      <p className="pt-4 text-sm text-premium-muted">
        Última atualização: março de 2026.
      </p>
    </LegalDocShell>
  );
}
