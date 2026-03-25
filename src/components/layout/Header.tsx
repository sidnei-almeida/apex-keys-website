"use client";

import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/layout/AuthModal";
import WalletDrawer from "@/components/layout/WalletDrawer";
import {
  Bell,
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
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationRead,
} from "@/lib/api/services";
import UserAvatar from "@/components/user/UserAvatar";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { NotificationOut } from "@/types/api";

const PROFILE_DROPDOWN_LINKS = [
  { href: "/conta", label: "Configuração", icon: Settings },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/minhas-rifas", label: "Minhas Rifas", icon: Ticket },
  { href: "/minhas-transacoes", label: "Minhas Transações", icon: ShoppingBag },
  { href: "/historico-rifas", label: "Histórico de Rifas", icon: History },
] as const;

/** Logo Apex Keys (lobo) — manter intacta, efeito bleeding */
const LOGO_BLEEDING = "/logos/apex logo no bakground.png";

function formatHeaderWalletBalance(balance: string | undefined | null): string {
  if (balance == null || !String(balance).trim()) return "R$ 0,00";
  const n = parseFloat(String(balance).replace(",", "."));
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const NAV_LINKS = [
  { href: "/", label: "HOME" },
  { href: "/rifas", label: "RIFAS" },
  { href: "/sobre", label: "SOBRE NÓS" },
  { href: "/faq", label: "FAQ" },
] as const;

/** Linha vertical sutil entre blocos */
const Divider = () => (
  <div className="h-8 w-px shrink-0 bg-premium-border/50" aria-hidden />
);

function formatNotificationDate(createdAt: string): string {
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function Header() {
  const router = useRouter();
  const { user, logout, isAuthenticated, avatarUrlCacheBust } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "signup">("login");
  const [logoError, setLogoError] = useState(false);
  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const [list, countRes] = await Promise.all([
        getNotifications(token, { limit: 10 }),
        getUnreadNotificationsCount(token),
      ]);
      setNotifications(list);
      setUnreadCount(countRes.unread_count);
    } catch {
      // Ignorar erros de notificação
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      if (isAuthenticated) void loadNotifications();
      else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });
  }, [isAuthenticated, loadNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileDropdownOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
      if (
        notificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileDropdownOpen, notificationsOpen]);

  const handleNotificationClick = useCallback(
    async (n: NotificationOut) => {
      const token = getAccessToken();
      if (token && !n.read_at) {
        try {
          await markNotificationRead(token, n.id);
          setUnreadCount((c) => Math.max(0, c - 1));
          setNotifications((prev) =>
            prev.map((x) =>
              x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
            )
          );
        } catch {
          // Ignorar
        }
      }
      setNotificationsOpen(false);
      router.push("/minhas-transacoes");
    },
    [router]
  );

  const walletLabel = user
    ? formatHeaderWalletBalance(user.balance)
    : "R$ 0,00";

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
    <>
    <header className="sticky top-0 z-[100] overflow-visible border-b border-premium-border/20 bg-premium-bg/90 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className="relative mx-auto flex min-h-24 w-full max-w-none items-center justify-between gap-0 px-4 py-3 sm:px-6 lg:min-h-28 lg:px-8 xl:px-10 2xl:px-12">
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
              <span className="flex h-24 items-center font-heading text-lg font-bold italic tracking-tight text-premium-text">
                APEX KEYS
              </span>
            )}
          </Link>
          <Link href="/" className="md:hidden">
            <span className="font-heading text-base font-bold italic tracking-tight text-premium-text">
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
                className="relative px-4 py-2.5 font-body text-sm font-medium tracking-wide text-premium-muted/80 transition-colors duration-200 hover:text-premium-text after:absolute after:bottom-1.5 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-premium-accent after:transition-all after:duration-200 hover:after:w-[calc(100%-2rem)]"
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
            <Wallet className="size-5 shrink-0 text-premium-accent/90" aria-hidden />
            <div className="flex flex-col items-end">
              <span className="font-body text-[11px] font-medium uppercase tracking-wider text-premium-muted/70">
                Carteira
              </span>
              <span
                className="font-mono text-base font-bold tabular-nums text-premium-accent"
                style={{
                  textShadow: "0 0 20px rgba(0,229,255,0.25)",
                }}
              >
                {walletLabel}
              </span>
            </div>
          </button>

          {/* Notificações — sino + dropdown (apenas logado) */}
          {isAuthenticated && (
            <div ref={notificationsRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setNotificationsOpen((o) => !o)}
                className="relative rounded-lg p-2 text-premium-muted transition-colors hover:text-premium-accent"
                aria-label="Notificações"
                aria-expanded={notificationsOpen}
              >
                <Bell className="size-5" aria-hidden />
                {unreadCount > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-premium-accent font-mono text-[10px] font-bold text-black"
                    aria-hidden
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[360px] overflow-y-auto rounded-lg border border-premium-border/50 bg-premium-surface py-2 shadow-xl backdrop-blur-xl"
                  role="menu"
                >
                  <div className="px-4 py-2 border-b border-white/[0.06]">
                    <h3 className="font-heading text-sm font-semibold text-premium-text">Notificações</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 font-body text-sm text-premium-muted/70">
                      Nenhuma notificação
                    </p>
                  ) : (
                    <ul className="py-1">
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.06] ${
                              !n.read_at ? "bg-premium-accent/10" : ""
                            }`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <span className="font-body text-sm font-medium text-premium-text">
                              {n.title}
                            </span>
                            <span className="line-clamp-2 font-body text-xs text-premium-muted/80">
                              {n.body}
                            </span>
                            <span className="mt-1 font-mono text-[10px] text-premium-muted/60">
                              {formatNotificationDate(n.created_at)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {notifications.length > 0 && (
                    <Link
                      href="/notificacoes"
                      className="block border-t border-premium-border/30 px-4 py-2.5 text-center font-body text-xs font-medium text-premium-accent hover:bg-white/[0.04]"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      Ver todas
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Perfil — Avatar + Dropdown */}
          {isAuthenticated ? (
            <div
              ref={profileDropdownRef}
              className="relative hidden md:block"
            >
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-premium-accent/50 focus:ring-offset-2 focus:ring-offset-premium-bg"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                aria-label="Menu do perfil"
              >
                <div className="relative shrink-0">
                  <div className="flex size-11 items-center justify-center overflow-hidden rounded-lg ring-2 ring-premium-border ring-offset-2 ring-offset-premium-bg lg:size-12">
                    <UserAvatar
                      avatarUrl={user?.avatar_url}
                      urlCacheBust={avatarUrlCacheBust}
                      className="size-full"
                      placeholderIconClassName="size-5 text-premium-muted lg:size-6"
                    />
                  </div>
                  <span
                    className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-premium-bg bg-premium-accent"
                    aria-hidden
                  />
                </div>
                <ChevronDown
                  className={`size-4 text-premium-muted/60 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-lg border border-premium-border/50 bg-premium-surface py-2 shadow-xl backdrop-blur-xl"
                  role="menu"
                >
                  {PROFILE_DROPDOWN_LINKS.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      role="menuitem"
                      className="flex items-center gap-3 px-4 py-2.5 font-body text-sm text-premium-muted/90 transition-colors hover:bg-white/[0.06] hover:text-premium-accent"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {label}
                    </Link>
                  ))}
                  {user?.is_admin && (
                    <>
                      <div className="my-1.5 border-t border-premium-border/30" />
                      <Link
                        href="/admin"
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 font-body text-sm font-medium text-premium-accent transition-colors hover:bg-white/[0.06]"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        QG / Admin
                      </Link>
                    </>
                  )}
                  <div className="my-1.5 border-t border-premium-border/30" />
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-body text-sm text-premium-muted/90 transition-colors hover:bg-red-500/10 hover:text-red-400"
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
                className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-premium-accent/50 focus:ring-offset-2 focus:ring-offset-premium-bg"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                aria-label="Entrar ou cadastrar"
              >
                <div className="flex size-11 items-center justify-center overflow-hidden rounded-lg ring-2 ring-premium-border ring-offset-2 ring-offset-premium-bg lg:size-12">
                  <div className="flex size-full items-center justify-center bg-premium-bg">
                    <User className="size-5 text-premium-muted lg:size-6" aria-hidden />
                  </div>
                </div>
                <ChevronDown
                  className={`size-4 text-premium-muted/60 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-premium-border/50 bg-premium-surface py-2 shadow-xl backdrop-blur-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center px-4 py-2.5 text-left font-body text-sm text-premium-muted/90 transition-colors hover:bg-white/[0.06] hover:text-premium-accent"
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
                    className="flex w-full items-center px-4 py-2.5 text-left font-body text-sm font-medium text-premium-accent transition-colors hover:bg-white/[0.06]"
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
            <span className="font-body text-[10px] font-medium uppercase tracking-wider text-premium-muted/70">
              Carteira
            </span>
            <span
              className="font-mono text-sm font-bold tabular-nums text-premium-accent"
              style={{ textShadow: "0 0 12px rgba(0,229,255,0.2)" }}
            >
              {walletLabel}
            </span>
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-premium-muted transition hover:text-premium-text"
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
          <div className="fixed inset-y-0 right-0 z-50 flex w-[min(18rem,85vw)] flex-col border-l border-premium-border/30 bg-premium-bg/95 shadow-[-4px_0_40px_rgb(0,0,0,0.5)] backdrop-blur-xl md:hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
              <span className="font-heading text-sm font-semibold text-premium-text">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 text-premium-muted transition hover:bg-white/[0.06] hover:text-premium-text"
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
                  className="rounded-lg px-4 py-3 font-body text-sm font-medium text-premium-muted transition-colors hover:bg-white/[0.04] hover:text-premium-accent"
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
                      <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg ring-2 ring-premium-border ring-offset-2 ring-offset-premium-bg">
                        <UserAvatar
                          avatarUrl={user?.avatar_url}
                          urlCacheBust={avatarUrlCacheBust}
                          className="size-full"
                          placeholderIconClassName="size-5 text-premium-muted"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 size-2 rounded-full border-2 border-premium-bg bg-premium-accent" aria-hidden />
                    </div>
                    <span className="font-body font-medium text-premium-text">Perfil</span>
                  </div>
                  {PROFILE_DROPDOWN_LINKS.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium text-premium-muted transition-colors hover:bg-white/[0.04] hover:text-premium-accent"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {label}
                    </Link>
                  ))}
                  {user?.is_admin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-medium text-premium-accent transition-colors hover:bg-white/[0.04]"
                      onClick={() => setMenuOpen(false)}
                    >
                      QG / Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-left font-body text-sm font-medium text-premium-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
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
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg ring-2 ring-premium-border ring-offset-2 ring-offset-premium-bg">
                      <div className="flex size-full items-center justify-center bg-premium-bg">
                        <User className="size-5 text-premium-muted" aria-hidden />
                      </div>
                    </div>
                    <span className="font-body font-medium text-premium-muted">Entrar ou cadastrar</span>
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-3 text-left font-body text-sm font-medium text-premium-muted transition-colors hover:bg-white/[0.04] hover:text-premium-accent"
                    onClick={() => openAuth("login")}
                  >
                    LOG IN
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-3 text-left font-body text-sm font-medium text-premium-accent transition-colors hover:bg-white/[0.04]"
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

    </header>
      <WalletDrawer
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        onRequestLogin={() => openAuth("login")}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authInitialMode}
      />
    </>
  );
}
