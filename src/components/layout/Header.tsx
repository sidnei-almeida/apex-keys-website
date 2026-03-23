"use client";

import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/layout/AuthModal";
import WalletDrawer from "@/components/layout/WalletDrawer";
import { Menu, User, Wallet, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const MOCK_BALANCE = "R$ 45,00";

function formatBalanceDisplay(balance: string): string {
  const t = balance.trim();
  if (!t) return MOCK_BALANCE;
  if (/^r\$/i.test(t) || /^R\$\s?/.test(t)) return t;
  return `R$ ${t}`;
}

/** Wordmark (só texto), sem fundo — mascote fica para outras secções */
const LOGO_WORDMARK_NO_BG = "/logos/title no bakcground.png";

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [wordmarkError, setWordmarkError] = useState(false);

  const walletLabel = user
    ? formatBalanceDisplay(user.balance)
    : MOCK_BALANCE;

  const openWallet = () => {
    setMenuOpen(false);
    setIsAuthOpen(false);
    setIsWalletOpen(true);
  };

  const openAuth = () => {
    setMenuOpen(false);
    setIsWalletOpen(false);
    setIsAuthOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-apex-bg/92 shadow-[0_4px_20px_rgb(0,0,0,0.4)] backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink items-center">
          {!wordmarkError ? (
            <img
              src={LOGO_WORDMARK_NO_BG}
              alt="Apex Keys"
              className="h-12 w-auto max-h-14 object-contain object-left sm:h-[3.25rem] md:h-14"
              onError={() => setWordmarkError(true)}
            />
          ) : (
            <span className="font-bold italic tracking-tight text-apex-text">
              APEX KEYS
            </span>
          )}
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={openWallet}
            className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-apex-surface/50 px-3 py-2 text-sm text-apex-text-muted shadow-[0_2px_8px_rgb(0,0,0,0.2)] transition-all hover:border-apex-accent/30 hover:bg-apex-surface/70 hover:text-apex-text"
          >
            <Wallet className="size-5 shrink-0 text-apex-accent" aria-hidden />
            <span className="font-medium">Carteira</span>
            <span className="font-semibold tabular-nums text-apex-accent">
              {walletLabel}
            </span>
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href={user?.is_admin ? "/admin" : "/"}
                className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-apex-surface/50 px-3 py-2 text-sm text-apex-text-muted shadow-[0_2px_8px_rgb(0,0,0,0.2)] transition-all hover:border-apex-accent/30 hover:bg-apex-surface/70 hover:text-apex-text"
                aria-label={user?.is_admin ? "Ir ao QG" : "Ir ao painel"}
              >
                <User className="size-5 shrink-0" aria-hidden />
                <span className="font-medium">
                  {user?.is_admin ? "QG" : "Painel"}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="rounded-lg border border-white/[0.06] bg-transparent px-3 py-2 text-sm text-apex-text-muted transition hover:border-red-500/30 hover:text-red-400"
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuth}
              className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-apex-surface/50 px-3 py-2 text-sm text-apex-text-muted shadow-[0_2px_8px_rgb(0,0,0,0.2)] transition-all hover:border-apex-accent/30 hover:bg-apex-surface/70 hover:text-apex-text"
              aria-label="Perfil ou login"
            >
              <User className="size-5 shrink-0" aria-hidden />
              <span className="font-medium">Perfil</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={openWallet}
            className="flex items-center gap-1.5 rounded-lg border border-apex-surface bg-apex-surface/40 px-2.5 py-2"
            aria-label="Carteira"
          >
            <Wallet className="size-5 shrink-0 text-apex-accent" aria-hidden />
            <span className="text-sm font-semibold tabular-nums text-apex-accent">
              {walletLabel}
            </span>
          </button>
          <button
            type="button"
            className="rounded-lg border border-apex-surface bg-apex-surface/40 p-2 text-apex-text transition hover:bg-apex-surface/60"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-[min(18rem,85vw)] flex-col border-l border-white/[0.07] bg-apex-bg shadow-[−4px_0_40px_rgb(0,0,0,0.5)] md:hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <span className="text-sm font-semibold text-apex-text">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 text-apex-text transition hover:bg-apex-surface/60"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <nav className="flex flex-col gap-2 p-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href={user?.is_admin ? "/admin" : "/"}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-apex-surface/40 px-3 py-3 text-left text-sm text-apex-text-muted transition-all hover:border-apex-accent/25 hover:bg-apex-surface/60 hover:text-apex-text"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="size-5 shrink-0" aria-hidden />
                    <span className="font-medium">
                      {user?.is_admin ? "QG" : "Painel"}
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="rounded-lg border border-white/[0.06] px-3 py-3 text-left text-sm text-apex-text-muted transition hover:border-red-500/25 hover:text-red-400"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    Sair
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-apex-surface/40 px-3 py-3 text-left text-sm text-apex-text-muted transition-all hover:border-apex-accent/25 hover:bg-apex-surface/60 hover:text-apex-text"
                  onClick={openAuth}
                >
                  <User className="size-5 shrink-0" aria-hidden />
                  <span className="font-medium">Perfil / Login</span>
                </button>
              )}
            </nav>
          </div>
        </>
      ) : null}

      <WalletDrawer
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
  );
}
