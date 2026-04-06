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

import GoldenLionLogo from "@/app/Adobe Express - file.png";

const FOOTER_LOGO = GoldenLionLogo.src;

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
    <div className="flex min-h-0 w-full flex-col items-center gap-2 text-center md:items-start md:text-left">
      <p className="mb-0 w-full border-b border-zinc-800 pb-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-zinc-100">
        {title}
      </p>
      <ul className="flex w-full flex-col gap-1.5">
        {links.map(({ href, label }) => (
          <li key={label} className="w-full">
            <Link
              href={href}
              className="font-body text-sm text-zinc-400 transition-colors duration-200 ease-out hover:text-zinc-100"
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
    <footer className="relative z-10 mt-auto border-t border-zinc-800 bg-zinc-950">
      {/* Pagamento seguro — credibilidade */}
      <div className="border-b border-zinc-800">
        <div
          className={`${FOOTER_CONTAINER} flex flex-col gap-4 py-6 sm:gap-5 md:flex-row md:items-center md:justify-between md:py-7`}
        >
          <div className="text-center md:max-w-md md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-premium-accent">
              Pagamento seguro
            </p>
            <p className="mt-1.5 text-sm leading-snug text-zinc-400">
              Transações com criptografia e parceiros reconhecidos. O site utiliza
              conexão HTTPS (SSL) para proteger os seus dados.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end md:gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2">
              <Lock
                className="size-4 shrink-0 text-zinc-300"
                aria-hidden
              />
              <span className="text-xs font-semibold text-zinc-100">
                SSL / HTTPS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <VisaMark className="h-7 w-11 opacity-95 brightness-105 transition-[opacity,filter] duration-200 hover:opacity-100 hover:brightness-110" />
              <MastercardMark className="h-7 w-11 opacity-95 brightness-105 transition-[opacity,filter] duration-200 hover:opacity-100 hover:brightness-110" />
              <PixMark className="h-7 w-11 opacity-95 brightness-105 transition-[opacity,filter] duration-200 hover:opacity-100 hover:brightness-110" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer — grid limpo, espaçamento tipo SaaS */}
      <div className={`${FOOTER_CONTAINER} py-7 md:py-8`}>
        <div className="grid grid-cols-1 items-start gap-6 text-center md:grid-cols-12 md:gap-x-6 md:gap-y-5 md:text-left lg:gap-x-8">
          {/* 1. Marca + Segurança */}
          <div className="flex flex-col items-center gap-y-3 md:col-span-4 md:items-start">
            <div className="flex items-start gap-3">
              <Link
                href="/"
                aria-label="Apex Keys - Início"
                className="shrink-0 opacity-95 transition-opacity hover:opacity-100"
              >
                <div className="size-[42px] overflow-hidden">
                  <img
                    src={FOOTER_LOGO}
                    alt="Apex Keys"
                    className="size-full object-cover object-[50%_20%] [transform:scale(1.9)]"
                  />
                </div>
              </Link>

              <div className="flex min-h-[42px] flex-col justify-center gap-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className="size-5 shrink-0 text-premium-accent"
                    aria-hidden
                  />
                  <span className="text-sm font-semibold text-zinc-100">
                    Transação Segura
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Pagamentos seguros e rastreáveis
                </p>
              </div>
            </div>
          </div>

          {/* 2. Links Úteis */}
          <div className="flex flex-col items-stretch md:col-span-2">
            <FooterColumn title="Links Úteis" links={QUICK_LINKS} />
          </div>

          {/* 3. Suporte (só contato) */}
          <div className="flex flex-col items-stretch md:col-span-2">
            <FooterColumn title="Suporte" links={SUPPORT_LINKS} />
          </div>

          {/* 4. Legal — Termos e Privacidade fora de Suporte */}
          <div className="flex flex-col items-stretch md:col-span-2">
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
          </div>

          {/* 5. Redes Sociais */}
          <div className="flex flex-col items-center md:col-span-2 md:items-start">
            <p className="mb-0 w-full border-b border-zinc-800 pb-2 text-center font-body text-xs font-semibold uppercase tracking-[0.14em] text-zinc-100 md:text-left">
              Redes Sociais
            </p>
            <div className="mt-2.5 flex flex-row flex-wrap justify-center gap-3.5 md:justify-start md:gap-3">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-zinc-400 opacity-90 transition-all duration-200 hover:-translate-y-0.5 hover:text-zinc-100 hover:opacity-100"
                >
                  <Icon className="size-5" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer — copyright */}
      <div className="border-t border-zinc-800">
        <div
          className={`${FOOTER_CONTAINER} flex flex-col items-center justify-between gap-2 py-4 text-center sm:flex-row sm:items-center sm:text-left md:py-5`}
        >
          <p className="font-body text-xs text-zinc-500">
            © 2026 Apex Keys. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
