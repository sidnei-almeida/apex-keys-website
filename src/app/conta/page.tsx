"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/http";
import UserAvatar from "@/components/user/UserAvatar";
import ProfileUploader from "@/components/user/ProfileUploader";
import { deactivateAccount, reactivateAccount, updateAvatarUrl, updateProfile } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import { Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-premium-border bg-premium-bg px-3 py-2.5 text-premium-text placeholder:text-premium-muted/60 focus:border-premium-accent focus:outline-none focus:ring-1 focus:ring-premium-accent/40";

export default function ContaPage() {
  const {
    user,
    isReady,
    isAuthenticated,
    refreshUser,
    applyUserUpdate,
    avatarUrlCacheBust,
  } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [dangerText, setDangerText] = useState("");
  const [dangerLoading, setDangerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  async function handleUploadedAvatarUrl(url: string) {
    setError(null);
    setSuccessMessage(null);
    const token = getAccessToken();
    if (!token) throw new Error("Sessão expirada. Faça login novamente.");
    try {
      const updated = await updateAvatarUrl(token, url);
      applyUserUpdate(updated);
      await refreshUser();
      setSuccessMessage("Foto de perfil atualizada.");
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(err.detail ?? "Não foi possível salvar a foto.");
      }
      throw err instanceof Error ? err : new Error("Erro ao salvar a foto.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
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
      setSuccessMessage("Perfil atualizado com sucesso.");
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
        <Loader2 className="size-8 animate-spin text-premium-muted" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-premium-text sm:text-3xl">
        Configuração do Perfil
      </h1>
      <p className="mt-1 text-sm text-premium-muted">
        Atualize suas informações pessoais
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <ProfileUploader
          label="Foto de perfil"
          disabled={isLoading}
          initialUrl={user?.avatar_url}
          urlCacheBust={avatarUrlCacheBust}
          onUploaded={handleUploadedAvatarUrl}
        />

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-premium-text">
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
            <span className="mb-1.5 block text-sm font-medium text-premium-text">
              E-mail
            </span>
            <input
              type="email"
              value={user?.email ?? ""}
              readOnly
              className={`${inputClass} cursor-not-allowed bg-premium-surface text-premium-muted`}
              aria-describedby="email-help"
            />
            <p id="email-help" className="mt-1 text-xs text-premium-muted/80">
              O e-mail não pode ser alterado
            </p>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-premium-text">
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
            <p className="mt-1 text-xs text-premium-muted/80">
              Essencial para comunicação em caso de premiação
            </p>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-premium-text">
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
            <p className="mt-1 text-xs text-premium-muted/80">
              Para receber reembolsos e prêmios
            </p>
          </label>
        </div>

        {error && (
          <p
            className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300/90"
            role="alert"
          >
            {error}
          </p>
        )}

        {successMessage ? (
          <p
            className="rounded-lg border border-emerald-900/45 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-200/90"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-premium-accent px-6 py-3 font-semibold text-black transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="text-center text-sm font-medium text-premium-muted transition-colors hover:text-premium-text"
          >
            Voltar ao início
          </Link>
        </div>
      </form>

      {/* Zona de perigo — desativar conta */}
      <section className="mt-12 rounded-2xl border border-red-900/35 bg-red-950/15 p-6 sm:p-7">
        <h2 className="text-lg font-bold tracking-tight text-premium-text">
          Zona de perigo
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-premium-muted">
          Ao desativar a conta, você terá até <span className="text-premium-text/90">30 dias</span> para voltar.
          Após esse prazo, a conta e os dados associados serão removidos permanentemente.
        </p>

        {user?.deactivated_at ? (
          <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-3">
            <p className="text-sm text-amber-100/85">
              Sua conta está desativada e agendada para exclusão.
            </p>
            <p className="mt-1 text-xs text-amber-100/65">
              Prazo: {user.delete_after ? new Date(user.delete_after).toLocaleDateString("pt-BR") : "—"}
            </p>
            <button
              type="button"
              disabled={dangerLoading || isLoading}
              onClick={async () => {
                setError(null);
                setSuccessMessage(null);
                const token = getAccessToken();
                if (!token) return;
                setDangerLoading(true);
                try {
                  const updated = await reactivateAccount(token);
                  applyUserUpdate(updated);
                  await refreshUser();
                  setSuccessMessage("Conta reativada com sucesso.");
                } catch (e) {
                  const msg =
                    e instanceof ApiError
                      ? (e.detail ?? "Não foi possível reativar a conta.")
                      : e instanceof Error
                        ? e.message
                        : "Não foi possível reativar a conta.";
                  setError(msg);
                } finally {
                  setDangerLoading(false);
                }
              }}
              className="mt-3 inline-flex items-center justify-center rounded-lg border border-amber-500/35 bg-transparent px-4 py-2.5 text-sm font-semibold text-amber-200/90 transition-colors hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {dangerLoading ? "A reativar…" : "Reativar conta"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDangerOpen(true)}
            className="mt-5 inline-flex items-center justify-center rounded-lg border border-red-500/45 bg-transparent px-4 py-2.5 text-sm font-semibold text-red-300/90 transition-colors hover:bg-red-500/10"
          >
            Desativar conta
          </button>
        )}
      </section>

      {dangerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="presentation"
          onClick={() => {
            if (dangerLoading) return;
            setDangerOpen(false);
            setDangerText("");
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-premium-border bg-premium-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-premium-text">
              Desativar conta
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-premium-muted">
              Para confirmar, digite <span className="font-mono text-premium-text">DESATIVAR</span>. Você terá 30 dias para reativar.
            </p>
            <input
              value={dangerText}
              onChange={(e) => setDangerText(e.target.value)}
              disabled={dangerLoading}
              className={`${inputClass} mt-4`}
              placeholder="DESATIVAR"
            />
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={dangerLoading}
                onClick={() => {
                  setDangerOpen(false);
                  setDangerText("");
                }}
                className="rounded-lg border border-premium-border bg-premium-bg px-4 py-2.5 text-sm font-semibold text-premium-muted transition-colors hover:border-premium-accent/40 hover:text-premium-text disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={dangerLoading || dangerText.trim().toUpperCase() !== "DESATIVAR"}
                onClick={async () => {
                  setError(null);
                  setSuccessMessage(null);
                  const token = getAccessToken();
                  if (!token) return;
                  setDangerLoading(true);
                  try {
                    const updated = await deactivateAccount(token);
                    applyUserUpdate(updated);
                    await refreshUser();
                    setSuccessMessage("Conta desativada. Você pode reativar em até 30 dias.");
                    setDangerOpen(false);
                    setDangerText("");
                  } catch (e) {
                    const msg =
                      e instanceof ApiError
                        ? (e.detail ?? "Não foi possível desativar a conta.")
                        : e instanceof Error
                          ? e.message
                          : "Não foi possível desativar a conta.";
                    setError(msg);
                  } finally {
                    setDangerLoading(false);
                  }
                }}
                className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {dangerLoading ? "A desativar…" : "Confirmar desativação"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
