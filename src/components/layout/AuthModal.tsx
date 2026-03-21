"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const inputClass =
  "w-full rounded-lg border border-apex-surface bg-apex-bg px-3 py-2.5 text-apex-text placeholder:text-gray-500 focus:border-apex-accent focus:outline-none";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) setIsLogin(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

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
          onSubmit={(e) => {
            e.preventDefault();
          }}
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
                  className={inputClass}
                  placeholder="seu@email.com"
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
                  Senha
                </span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  className={inputClass}
                  placeholder="••••••••"
                />
              </label>
              <button
                type="submit"
                className="mt-6 w-full rounded-lg bg-apex-primary py-3 font-bold text-white transition-colors hover:bg-apex-accent"
              >
                Entrar na Arena
              </button>
            </>
          ) : (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
                  Nome Completo
                </span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  className={inputClass}
                  placeholder="Seu nome"
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
                  className={inputClass}
                  placeholder="+5511999999999"
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
                  className={inputClass}
                  placeholder="seu@email.com"
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
                  Senha
                </span>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  className={inputClass}
                  placeholder="••••••••"
                />
              </label>
              <button
                type="submit"
                className="mt-6 w-full rounded-lg bg-apex-primary py-3 font-bold text-white transition-colors hover:bg-apex-accent"
              >
                Criar Conta
              </button>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? (
            <>
              Não tem conta?{" "}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="cursor-pointer font-medium text-apex-accent hover:underline"
              >
                Criar agora
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="cursor-pointer font-medium text-apex-accent hover:underline"
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
