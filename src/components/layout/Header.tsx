"use client";

import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/layout/AuthModal";
import WalletDrawer from "@/components/layout/WalletDrawer";
import {
  ChevronDown,
  History,
  Menu,
  Settings,
  ShoppingBag,
  Ticket,
  User,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

const PROFILE_DROPDOWN_LINKS = [
  { href: "/conta", label: "Configuração", icon: Settings },
  { href: "#", label: "Minhas Rifas", icon: Ticket },
  { href: "#", label: "Minhas Transações", icon: ShoppingBag },
  { href: "#", label: "Histórico de Rifas", icon: History },
] as const;

const MOCK_BALANCE = "R$ 45,00";

/** Logo Apex Keys (lobo) — manter intacta, efeito bleeding */
const LOGO_BLEEDING = "/logos/apex logo no bakground.png";

function formatBalanceDisplay(balance: string): string {
  const t = balance.trim();
  if (!t) return MOCK_BALANCE;
  if (/^r\$/i.test(t) || /^R\$\s?/.test(t)) return t;
  return `R$ ${t}`;
}

const NAV_LINKS = [
  { href: "/", label: "HOME" },
  { href: "/rifas", label: "RIFAS" },
  { href: "/sobre", label: "SOBRE NÓS" },
  { href: "/faq", label: "FAQ" },
] as const;

/** Linha vertical sutil entre blocos */
const Divider = () => (
  <div className="h-8 w-px shrink-0 bg-white/[0.12]" aria-hidden />
);

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "signup">("login");
  const [logoError, setLogoError] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileDropdownOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileDropdownOpen]);

  const walletLabel = user
    ? formatBalanceDisplay(user.balance)
    : MOCK_BALANCE;

  const openWallet = () => {
    setMenuOpen(false);
    setIsAuthOpen(false);
    setIsWalletOpen(true);
  };

  const openAuth = (mode: "login" | "signup" = "login") => {
    setMenuOpen(false);
    setIsWalletOpen(false);
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-white/[0.04] bg-apex-bg/80 backdrop-blur-xl">
      <div className="relative mx-auto flex min-h-24 max-w-[1440px] items-center justify-between gap-0 px-4 py-3 sm:px-6 lg:min-h-28 lg:px-8">
        {/* 1. LOGO (esquerda) — bleeding */}
        <div className="flex min-w-0 shrink-0 items-center sm:w-36 lg:w-40">
          <Link
            href="/"
            className="absolute left-4 bottom-0 z-10 hidden translate-y-[25%] drop-shadow-[0_8px_24px_rgb(0,0,0,0.5)] sm:block lg:left-8"
            aria-label="Apex Keys - Início"
          >
            {!logoError ? (
              <img
                src={LOGO_BLEEDING}
                alt="Apex Keys"
                className="h-20 w-auto object-contain object-left sm:h-24 lg:h-28"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="flex h-24 items-center font-bold italic tracking-tight text-apex-text">
                APEX KEYS
              </span>
            )}
          </Link>
          <Link href="/" className="md:hidden">
            <span className="font-bold italic tracking-tight text-apex-text">
              APEX KEYS
            </span>
          </Link>
        </div>

        {/* Centro: divisor | nav | divisor — espaçamento simétrico */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex lg:gap-8">
          <Divider />
          <nav className="flex items-center gap-1" aria-label="Navegação principal">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative px-4 py-2.5 text-sm font-medium tracking-wide text-apex-text-muted/80 transition-colors duration-200 hover:text-apex-text after:absolute after:bottom-1.5 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-apex-accent after:transition-all after:duration-200 hover:after:w-[calc(100%-2rem)]"
              >
                {label}
              </Link>
            ))}
          </nav>
          <Divider />
        </div>

        {/* 3. AÇÕES (direita) — sem pills, hierarquia tipográfica */}
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-4 lg:gap-6">
          {/* Carteira — label sutil + valor em destaque */}
          <button
            type="button"
            onClick={openWallet}
            className="hidden cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left outline-none md:flex"
          >
            <Wallet className="size-5 shrink-0 text-apex-accent/90" aria-hidden />
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-medium uppercase tracking-wider text-apex-text-muted/70">
                Carteira
              </span>
              <span
                className="text-base font-bold tabular-nums text-apex-accent"
                style={{
                  textShadow: "0 0 20px rgba(0,229,255,0.25)",
                }}
              >
                {walletLabel}
              </span>
            </div>
          </button>

          {/* Perfil — Avatar + Dropdown */}
          {isAuthenticated ? (
            <div
              ref={profileDropdownRef}
              className="relative hidden md:block"
            >
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-apex-accent/50 focus:ring-offset-2 focus:ring-offset-apex-bg"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                aria-label="Menu do perfil"
              >
                <div className="relative shrink-0">
                  <div className="flex size-11 items-center justify-center overflow-hidden rounded-lg ring-2 ring-apex-accent/40 ring-offset-2 ring-offset-apex-bg lg:size-12">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-apex-surface/80">
                        <User className="size-5 text-apex-text-muted lg:size-6" aria-hidden />
                      </div>
                    )}
                  </div>
                  <span
                    className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-apex-bg bg-apex-accent"
                    aria-hidden
                  />
                </div>
                <ChevronDown
                  className={`size-4 text-apex-text-muted/60 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-lg border border-white/[0.08] bg-apex-surface/95 py-2 shadow-xl backdrop-blur-xl"
                  role="menu"
                >
                  {PROFILE_DROPDOWN_LINKS.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      role="menuitem"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-apex-text-muted/90 transition-colors hover:bg-white/[0.06] hover:text-apex-accent"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {label}
                    </Link>
                  ))}
                  {user?.is_admin && (
                    <>
                      <div className="my-1.5 border-t border-white/[0.06]" />
                      <Link
                        href="/admin"
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-apex-accent transition-colors hover:bg-white/[0.06]"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        QG / Admin
                      </Link>
                    </>
                  )}
                  <div className="my-1.5 border-t border-white/[0.06]" />
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-apex-text-muted/90 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              ref={profileDropdownRef}
              className="relative hidden md:block"
            >
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-apex-accent/50 focus:ring-offset-2 focus:ring-offset-apex-bg"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                aria-label="Entrar ou cadastrar"
              >
                <div className="flex size-11 items-center justify-center overflow-hidden rounded-lg ring-2 ring-apex-accent/30 ring-offset-2 ring-offset-apex-bg lg:size-12">
                  <div className="flex size-full items-center justify-center bg-apex-surface/50">
                    <User className="size-5 text-apex-text-muted lg:size-6" aria-hidden />
                  </div>
                </div>
                <ChevronDown
                  className={`size-4 text-apex-text-muted/60 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-white/[0.08] bg-apex-surface/95 py-2 shadow-xl backdrop-blur-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center px-4 py-2.5 text-left text-sm text-apex-text-muted/90 transition-colors hover:bg-white/[0.06] hover:text-apex-accent"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      openAuth("login");
                    }}
                  >
                    LOG IN
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center px-4 py-2.5 text-left text-sm font-medium text-apex-accent transition-colors hover:bg-white/[0.06]"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      openAuth("signup");
                    }}
                  >
                    CADASTRAR
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={openWallet}
            className="flex flex-col items-end border-none bg-transparent p-0 text-right outline-none"
            aria-label="Carteira"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-apex-text-muted/70">
              Carteira
            </span>
            <span
              className="text-sm font-bold tabular-nums text-apex-accent"
              style={{ textShadow: "0 0 12px rgba(0,229,255,0.2)" }}
            >
              {walletLabel}
            </span>
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-apex-text-muted transition hover:text-apex-text"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Menu mobile (drawer) */}
      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-[min(18rem,85vw)] flex-col border-l border-white/[0.06] bg-apex-bg/95 shadow-[-4px_0_40px_rgb(0,0,0,0.5)] backdrop-blur-xl md:hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
              <span className="text-sm font-semibold text-apex-text">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 text-apex-text-muted transition hover:bg-white/[0.06] hover:text-apex-text"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <nav className="flex flex-col gap-0.5 border-b border-white/[0.06] p-4">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-apex-text-muted transition-colors hover:bg-white/[0.04] hover:text-apex-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 p-4">
              {isAuthenticated ? (
                <>
                  <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
                    <div className="relative shrink-0">
                      <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg ring-2 ring-apex-accent/30 ring-offset-2 ring-offset-apex-bg">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-apex-surface/80">
                            <User className="size-5 text-apex-text-muted" aria-hidden />
                          </div>
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 size-2 rounded-full border-2 border-apex-bg bg-apex-accent" aria-hidden />
                    </div>
                    <span className="font-medium text-apex-text">Perfil</span>
                  </div>
                  {PROFILE_DROPDOWN_LINKS.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-apex-text-muted transition-colors hover:bg-white/[0.04] hover:text-apex-accent"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {label}
                    </Link>
                  ))}
                  {user?.is_admin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-apex-accent transition-colors hover:bg-white/[0.04]"
                      onClick={() => setMenuOpen(false)}
                    >
                      QG / Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-apex-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg ring-2 ring-apex-accent/30 ring-offset-2 ring-offset-apex-bg">
                      <div className="flex size-full items-center justify-center bg-apex-surface/50">
                        <User className="size-5 text-apex-text-muted" aria-hidden />
                      </div>
                    </div>
                    <span className="font-medium text-apex-text-muted">Entrar ou cadastrar</span>
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-3 text-left text-sm font-medium text-apex-text-muted transition-colors hover:bg-white/[0.04] hover:text-apex-accent"
                    onClick={() => openAuth("login")}
                  >
                    LOG IN
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-3 text-left text-sm font-medium text-apex-accent transition-colors hover:bg-white/[0.04]"
                    onClick={() => openAuth("signup")}
                  >
                    CADASTRAR
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      ) : null}

      <WalletDrawer isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authInitialMode}
      />
    </header>
  );
}
