"use client";

import { ApiError } from "@/lib/api/http";
import { getLastEmail, setLastEmail } from "@/lib/auth/token-storage";
import { useAuth } from "@/contexts/AuthContext";
import { uploadAvatar } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import { Camera, Eye, EyeOff, User, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Limite do ficheiro enviado; o servidor reduz e grava WebP otimizado (≤ 50KB). */
const AVATAR_MAX_BYTES = 20 * 1024 * 1024;
const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

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
  const { login, signup, applyUserUpdate } = useAuth();

  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) return null;
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setFullName("");
      setWhatsapp("");
      setPixKey("");
      setAvatarFile(null);
      setError(null);
      setIsLoading(false);
      setShowPassword(false);
    } else {
      setIsLogin(initialMode === "login");
      const last = getLastEmail();
      if (last) setEmail(last);
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
      setLastEmail(email.trim());
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
        pix_key: pixKey.trim(),
      });
      if (avatarFile) {
        const token = getAccessToken();
        if (token) {
          const updated = await uploadAvatar(token, avatarFile);
          applyUserUpdate(updated);
        }
      }
      setLastEmail(email.trim());
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

  const inputClass =
    "w-full rounded-lg border border-premium-border bg-premium-bg px-3 py-2.5 text-premium-text placeholder:text-premium-muted/60 focus:border-premium-accent focus:outline-none";
  const passwordInputClass = `${inputClass} pr-10`;
  const labelClass = "mb-1.5 block text-sm font-medium text-premium-text";
  const iconBtnClass =
    "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-premium-muted transition-colors hover:text-premium-text disabled:pointer-events-none disabled:opacity-40";

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
        className="relative w-full max-w-md rounded-2xl border border-premium-border bg-premium-surface p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-premium-muted transition-colors hover:text-premium-text"
          aria-label="Fechar"
        >
          <X className="size-5" aria-hidden />
        </button>

        <h2
          id="auth-modal-title"
          className="text-center text-2xl font-bold text-premium-text"
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
                <span className={labelClass}>
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
                <span className={labelClass}>
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
                    className={iconBtnClass}
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
              {/* Foto de perfil (opcional) — mesmo padrão do /conta */}
              <div className="mb-4">
                <span className={labelClass}>Foto de perfil (opcional)</span>
                <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept={AVATAR_ACCEPT}
                    className="sr-only"
                    aria-hidden
                    tabIndex={-1}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      e.target.value = "";
                      if (!f) return;
                      setError(null);
                      if (f.size > AVATAR_MAX_BYTES) {
                        setError("A imagem deve ter no máximo 20 MB.");
                        return;
                      }
                      setAvatarFile(f);
                    }}
                  />
                  <div className="relative shrink-0">
                    <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl ring-2 ring-premium-border ring-offset-2 ring-offset-premium-bg sm:size-24">
                      {avatarPreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarPreviewUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-premium-surface">
                          <User className="size-10 text-premium-muted sm:size-10" aria-hidden />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-lg border border-premium-border bg-premium-surface text-premium-text transition-colors hover:border-premium-accent hover:text-premium-accent disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Alterar foto de perfil"
                      title="JPG, PNG ou WebP — até 20 MB; guardamos em WebP otimizado"
                    >
                      <Camera className="size-4" aria-hidden />
                    </button>
                  </div>
                  <div className="text-sm text-premium-muted">
                    <p className="font-medium text-premium-text">Foto de perfil</p>
                    <p className="mt-0.5 text-xs text-premium-muted/85">
                      Toque no ícone da câmara. A imagem é otimizada (≤ 50KB) antes de enviar.
                    </p>
                  </div>
                </div>
              </div>

              <label className="block">
                <span className={labelClass}>
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
                <span className={labelClass}>
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
                <span className={labelClass}>
                  Chave PIX
                </span>
                <input
                  type="text"
                  name="pix_key"
                  required
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className={inputClass}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-premium-muted/75">
                  Para receber reembolsos e prêmios
                </p>
              </label>

              <label className="mt-4 block">
                <span className={labelClass}>
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
                <span className={labelClass}>
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
                    className={iconBtnClass}
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
            <p
              className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-center text-sm text-red-300/90"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-lg bg-premium-accent py-3 font-bold text-black transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "A processar…"
              : isLogin
                ? "Entrar na Arena"
                : "Criar Conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-premium-muted">
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
                className="cursor-pointer font-medium text-premium-text underline-offset-2 hover:underline disabled:opacity-50"
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
                className="cursor-pointer font-medium text-premium-text underline-offset-2 hover:underline disabled:opacity-50"
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
