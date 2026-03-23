"use client";

import { ApiError } from "@/lib/api/http";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const inputClass =
  "w-full rounded-lg border border-apex-surface bg-apex-bg px-3 py-2.5 text-apex-text placeholder:text-gray-500 focus:border-apex-accent focus:outline-none";

const passwordInputClass = `${inputClass} pr-10`;

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Abre direto na aba de cadastro */
  initialMode?: "login" | "signup";
};

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  const { login, signup } = useAuth();

  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setFullName("");
      setWhatsapp("");
      setError(null);
      setIsLoading(false);
      setShowPassword(false);
    } else {
      setIsLogin(initialMode === "login");
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail ?? "Credenciais inválidas.");
      } else {
        setError(
          err instanceof Error ? err.message : "Não foi possível entrar.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signup({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        whatsapp: whatsapp.trim(),
      });
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail ?? "Não foi possível criar a conta.");
      } else {
        setError(
          err instanceof Error ? err.message : "Não foi possível criar a conta.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-apex-primary/20 bg-apex-surface p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:text-apex-text"
          aria-label="Fechar"
        >
          <X className="size-5" aria-hidden />
        </button>

        <h2
          id="auth-modal-title"
          className="text-center text-2xl font-bold text-apex-text"
        >
          {isLogin ? "Entrar" : "Criar conta"}
        </h2>

        <form
          className="mt-6"
          onSubmit={isLogin ? handleLogin : handleSignup}
        >
          {isLogin ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
                  E-mail
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
                  Senha
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={passwordInputClass}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:text-apex-text disabled:pointer-events-none disabled:opacity-40"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" aria-hidden />
                    ) : (
                      <Eye className="size-5" aria-hidden />
                    )}
                  </button>
                </div>
              </label>
            </>
          ) : (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
                  Nome Completo
                </span>
                <input
                  type="text"
                  name="full_name"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="Seu nome"
                  disabled={isLoading}
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
                  WhatsApp (Essencial para premiação)
                </span>
                <input
                  type="tel"
                  name="whatsapp"
                  autoComplete="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={inputClass}
                  placeholder="+5511999999999"
                  disabled={isLoading}
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
                  E-mail
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
                  Senha
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={passwordInputClass}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:text-apex-text disabled:pointer-events-none disabled:opacity-40"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" aria-hidden />
                    ) : (
                      <Eye className="size-5" aria-hidden />
                    )}
                  </button>
                </div>
              </label>
            </>
          )}

          {error ? (
            <p className="mt-4 text-center text-sm text-red-400/90" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-lg bg-apex-primary py-3 font-bold text-white transition-colors hover:bg-apex-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "A processar…"
              : isLogin
                ? "Entrar na Arena"
                : "Criar Conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? (
            <>
              Não tem conta?{" "}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                  setShowPassword(false);
                }}
                className="cursor-pointer font-medium text-apex-accent hover:underline disabled:opacity-50"
              >
                Criar agora
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                  setShowPassword(false);
                }}
                className="cursor-pointer font-medium text-apex-accent hover:underline disabled:opacity-50"
              >
                Fazer login
              </button>
            </>
          )}
        </p>
      </div>
    </div>,
    document.body,
  );
}
