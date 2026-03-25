import Link from "next/link";
import {
  Lock,
  Mail,
  MessageCircle,
  Instagram,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  MastercardMark,
  PixMark,
  VisaMark,
} from "@/components/layout/FooterPaymentTrust";

const FOOTER_LOGO = "/logos/title no bakcground.png";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/rifas", label: "Rifas Ativas" },
  { href: "/faq", label: "FAQ" },
] as const;

const SUPPORT_LINKS = [{ href: "#", label: "Contato" }] as const;

/** Coluna própria — separado de Suporte; cada documento com o seu link. */
const LEGAL_LINKS = [
  { href: "/termos", label: "Termos de Serviço" },
  { href: "/privacidade", label: "Política de Privacidade" },
] as const;

const SOCIAL_LINKS = [
  { href: "#", label: "WhatsApp", icon: MessageCircle },
  { href: "#", label: "Instagram", icon: Instagram },
  { href: "#", label: "E-mail", icon: Mail },
  { href: "#", label: "Telegram", icon: Send },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div className="flex min-h-0 flex-col items-start gap-3">
      <p className="mb-0 w-full border-b border-premium-border/30 pb-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-premium-text">
        {title}
      </p>
      <ul className="flex w-full flex-col gap-2">
        {links.map(({ href, label }) => (
          <li key={label} className="w-full">
            <Link
              href={href}
              className="font-body text-sm text-premium-muted transition-colors duration-300 ease-in-out hover:text-premium-text"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FOOTER_CONTAINER = "mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-premium-border/20 bg-premium-bg">
      {/* Pagamento seguro — credibilidade */}
      <div className="border-b border-premium-border/20 bg-premium-bg">
        <div
          className={`${FOOTER_CONTAINER} flex flex-col gap-5 py-5 md:flex-row md:items-center md:justify-between md:py-6`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-premium-accent">
              Pagamento seguro
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-premium-muted">
              Transações com criptografia e parceiros reconhecidos. O site utiliza
              conexão HTTPS (SSL) para proteger os seus dados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-5">
            <div className="flex items-center gap-2 rounded-lg border border-premium-border bg-premium-surface px-3 py-2">
              <Lock className="size-4 shrink-0 text-premium-muted" aria-hidden />
              <span className="text-xs font-semibold text-premium-text">
                SSL / HTTPS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <VisaMark className="h-8 w-12 opacity-90" />
              <MastercardMark className="h-8 w-12 opacity-90" />
              <PixMark className="h-8 w-12 opacity-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer — grid limpo, espaçamento tipo SaaS */}
      <div className={`${FOOTER_CONTAINER} py-10 md:py-12`}>
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12 md:gap-x-8 md:gap-y-8 lg:gap-x-10">
          {/* 1. Marca + Segurança */}
          <div className="flex flex-col items-start gap-y-5 md:col-span-4">
            <Link href="/" className="inline-block max-w-[9.5rem] sm:max-w-[10.5rem]">
              <img
                src={FOOTER_LOGO}
                alt="Apex Keys"
                className="h-9 w-auto max-w-full object-contain object-left opacity-90 sm:h-10 lg:h-11"
              />
            </Link>
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="size-5 shrink-0 text-premium-accent"
                  aria-hidden
                />
                <span className="text-sm font-semibold text-premium-text">
                  Transação Segura
                </span>
              </div>
              <p className="text-xs text-premium-muted">
                Pagamentos seguros e rastreáveis
              </p>
            </div>
          </div>

          {/* 2. Links Úteis */}
          <div className="flex flex-col items-stretch md:col-span-2">
            <FooterColumn title="Links Úteis" links={QUICK_LINKS} />
          </div>

          {/* 3. Suporte (só contacto) */}
          <div className="flex flex-col items-stretch md:col-span-2">
            <FooterColumn title="Suporte" links={SUPPORT_LINKS} />
          </div>

          {/* 4. Legal — Termos e Privacidade fora de Suporte */}
          <div className="flex flex-col items-stretch md:col-span-2">
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
          </div>

          {/* 5. Redes Sociais */}
          <div className="flex flex-col items-start md:col-span-2">
            <p className="mb-0 w-full border-b border-premium-border/30 pb-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-premium-text">
              Redes Sociais
            </p>
            <div className="mt-3 flex flex-row flex-wrap gap-4">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-premium-muted transition-all duration-200 hover:-translate-y-0.5 hover:text-premium-text"
                >
                  <Icon className="size-6" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer — mesmo container para alinhamento vertical com a logo */}
      <div className="border-t border-premium-border/20 bg-premium-bg">
        <div
          className={`${FOOTER_CONTAINER} flex flex-col items-start justify-between gap-3 pt-6 pb-4 sm:flex-row sm:items-center`}
        >
          <p className="font-body text-xs text-premium-muted">
            © 2026 Apex Keys. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
