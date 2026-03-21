"use client";

import { Menu, User, Wallet, X } from "lucide-react";
import { useState } from "react";
import AuthModal from "@/components/layout/AuthModal";
import WalletDrawer from "@/components/layout/WalletDrawer";

const MOCK_BALANCE = "R$ 45,00";

/** Wordmark (só texto), sem fundo — mascote fica para outras secções */
const LOGO_WORDMARK_NO_BG = "/logos/title no bakcground.png";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [wordmarkError, setWordmarkError] = useState(false);

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
    <header className="sticky top-0 z-50 border-b border-apex-surface bg-apex-bg/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <a href="/" className="flex min-w-0 shrink items-center">
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
        </a>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={openWallet}
            className="flex items-center gap-2 rounded-lg border border-apex-surface bg-apex-surface/40 px-3 py-2 text-sm text-apex-text transition hover:border-apex-primary/50 hover:bg-apex-surface/60"
          >
            <Wallet className="size-5 shrink-0 text-apex-accent" aria-hidden />
            <span className="font-medium">Carteira</span>
            <span className="font-semibold tabular-nums text-apex-accent">
              {MOCK_BALANCE}
            </span>
          </button>
          <button
            type="button"
            onClick={openAuth}
            className="flex items-center gap-2 rounded-lg border border-apex-surface bg-apex-surface/40 px-3 py-2 text-sm text-apex-text transition hover:border-apex-primary/50 hover:bg-apex-surface/60"
            aria-label="Perfil ou login"
          >
            <User className="size-5 shrink-0" aria-hidden />
            <span className="font-medium">Perfil</span>
          </button>
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
              {MOCK_BALANCE}
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
          <div className="fixed inset-y-0 right-0 z-50 flex w-[min(18rem,85vw)] flex-col border-l border-apex-surface bg-apex-bg shadow-xl md:hidden">
            <div className="flex items-center justify-between border-b border-apex-surface px-4 py-3">
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
              <button
                type="button"
                className="flex items-center gap-3 rounded-lg border border-apex-surface bg-apex-surface/30 px-3 py-3 text-left text-sm text-apex-text transition hover:bg-apex-surface/50"
                onClick={openAuth}
              >
                <User className="size-5 shrink-0" aria-hidden />
                <span className="font-medium">Perfil / Login</span>
              </button>
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
