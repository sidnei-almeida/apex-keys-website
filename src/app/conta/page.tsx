"use client";

import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/lib/api/services";
import { ApiError } from "@/lib/api/http";
import { getAccessToken } from "@/lib/auth/token-storage";
import { Camera, Loader2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-white/[0.08] bg-apex-bg px-3 py-2.5 text-apex-text placeholder:text-gray-500 focus:border-apex-accent focus:outline-none focus:ring-1 focus:ring-apex-accent/50";

export default function ContaPage() {
  const { user, isReady, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    if (user) {
      setFullName(user.full_name);
      setWhatsapp(user.whatsapp);
      setPixKey(user.pix_key ?? "");
    }
  }, [isReady, isAuthenticated, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const token = getAccessToken();
    if (!token) return;
    setIsLoading(true);
    try {
      await updateProfile(token, {
        full_name: fullName.trim(),
        whatsapp: whatsapp.trim(),
        pix_key: pixKey.trim() || undefined,
      });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail ?? "Não foi possível salvar.");
      } else {
        setError(
          err instanceof Error ? err.message : "Erro ao atualizar perfil.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-apex-accent" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-apex-text/95 sm:text-3xl">
        Configuração do Perfil
      </h1>
      <p className="mt-1 text-sm text-apex-text-muted/80">
        Atualize suas informações pessoais
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Avatar — placeholder para upload futuro */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl ring-2 ring-apex-accent/30 ring-offset-2 ring-offset-apex-bg sm:size-28">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-apex-surface/80">
                  <User className="size-12 text-apex-text-muted sm:size-14" aria-hidden />
                </div>
              )}
            </div>
            <button
              type="button"
              disabled
              className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-apex-surface/90 text-apex-text-muted/70 transition-colors hover:bg-apex-surface disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Alterar foto (em breve)"
              title="Upload de foto em breve"
            >
              <Camera className="size-4" aria-hidden />
            </button>
          </div>
          <div className="text-sm text-apex-text-muted/70">
            <p>Alteração de foto de perfil</p>
            <p className="mt-0.5 text-xs text-apex-text-muted/50">
              Disponível em breve
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
              Nome completo
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

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
              E-mail
            </span>
            <input
              type="email"
              value={user?.email ?? ""}
              readOnly
              className={`${inputClass} cursor-not-allowed bg-apex-surface/50 text-apex-text-muted/80`}
              aria-describedby="email-help"
            />
            <p id="email-help" className="mt-1 text-xs text-apex-text-muted/60">
              O e-mail não pode ser alterado
            </p>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
              WhatsApp
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
            <p className="mt-1 text-xs text-apex-text-muted/60">
              Essencial para comunicação em caso de premiação
            </p>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-apex-text/90">
              Chave PIX
            </span>
            <input
              type="text"
              name="pix_key"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className={inputClass}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-apex-text-muted/60">
              Para receber reembolsos e prêmios
            </p>
          </label>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg border border-apex-success/30 bg-apex-success/10 px-4 py-3 text-sm text-apex-success" role="status">
            Perfil atualizado com sucesso.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-apex-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-apex-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              "Salvar alterações"
            )}
          </button>
          <Link
            href="/"
            className="text-center text-sm font-medium text-apex-text-muted/80 transition-colors hover:text-apex-accent"
          >
            Voltar ao início
          </Link>
        </div>
      </form>
    </div>
  );
}
