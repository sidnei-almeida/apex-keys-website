import Link from "next/link";
import { Mail, MessageCircle, Instagram, Send, ShieldCheck } from "lucide-react";

const FOOTER_LOGO = "/logos/title no bakcground.png";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/rifas", label: "Rifas Ativas" },
  { href: "/faq", label: "FAQ" },
] as const;

const SUPPORT_LINKS = [
  { href: "#", label: "Contato" },
  { href: "#", label: "Termos de Uso" },
  { href: "#", label: "Política de Privacidade" },
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
    <div className="flex flex-col items-start gap-4">
      <p className="mb-1 border-b border-white/[0.08] pb-3 text-xs font-bold uppercase tracking-[0.12em] text-apex-text/95">
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {links.map(({ href, label }) => (
          <li key={label}>
            <Link
              href={href}
              className="text-sm text-apex-text-muted/80 transition-colors duration-200 hover:text-apex-accent"
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
    <footer className="relative z-10 mt-auto border-t border-white/[0.08] bg-apex-surface/90 backdrop-blur-sm">
      {/* Main Footer — Grid 4 colunas: [Logo+Segurança] | Links | Suporte | Redes */}
      <div className={`${FOOTER_CONTAINER} py-12`}>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-6 lg:gap-8">
          {/* 1. Marca + Segurança (fusão) */}
          <div className="flex flex-col items-start gap-y-6 md:col-span-5">
            <Link href="/" className="inline-block">
              <img
                src={FOOTER_LOGO}
                alt="Apex Keys"
                className="h-16 w-auto object-contain object-left opacity-90 lg:h-20"
              />
            </Link>
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="size-5 shrink-0 text-apex-accent/90"
                  aria-hidden
                />
                <span className="text-sm font-semibold text-apex-text/90">
                  Transação Segura
                </span>
              </div>
              <p className="text-xs text-apex-text-muted/60">
                Pagamentos seguros e rastreáveis
              </p>
            </div>
          </div>

          {/* 2. Links Úteis */}
          <div className="flex flex-col items-start md:col-span-3">
            <FooterColumn title="Links Úteis" links={QUICK_LINKS} />
          </div>

          {/* 3. Suporte */}
          <div className="flex flex-col items-start md:col-span-2">
            <FooterColumn title="Suporte" links={SUPPORT_LINKS} />
          </div>

          {/* 4. Redes Sociais */}
          <div className="flex flex-col items-start md:col-span-2">
            <p className="mb-1 border-b border-white/[0.08] pb-3 text-xs font-bold uppercase tracking-[0.12em] text-apex-text/95">
              Redes Sociais
            </p>
            <div className="mt-4 flex flex-row flex-wrap gap-4">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-apex-text-muted/60 transition-all duration-300 hover:-translate-y-0.5 hover:text-apex-accent"
                >
                  <Icon className="size-6" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer — mesmo container para alinhamento vertical com a logo */}
      <div className="border-t border-white/[0.05]">
        <div
          className={`${FOOTER_CONTAINER} flex flex-col items-start justify-between gap-4 py-4 sm:flex-row sm:items-center`}
        >
          <p className="text-xs text-apex-text-muted/60">
            © 2026 Apex Keys. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-xs text-apex-text-muted/60 transition-colors hover:text-apex-accent"
            >
              Termos de Serviço
            </Link>
            <Link
              href="#"
              className="text-xs text-apex-text-muted/60 transition-colors hover:text-apex-accent"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
