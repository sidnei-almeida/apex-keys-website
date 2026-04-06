"use client";

import imageCompression from "browser-image-compression";
import { Camera, Check, Loader2, User } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { resolveUserAvatarUrl } from "@/lib/resolve-user-avatar-url";
import { useUploadThing } from "@/lib/uploadthing";

type Phase = "idle" | "compressing" | "uploading" | "saved" | "error";

type ProfileUploaderProps = {
  label?: string;
  disabled?: boolean;
  initialUrl?: string | null | undefined;
  urlCacheBust?: number;
  onUploaded?: (url: string) => Promise<void> | void;
};

const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export default function ProfileUploader({
  label = "Foto de perfil",
  disabled = false,
  initialUrl,
  urlCacheBust = 0,
  onUploaded,
}: ProfileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const resolvedInitial = resolveUserAvatarUrl(initialUrl, urlCacheBust);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    resolvedInitial?.trim() ? resolvedInitial : null,
  );

  const { startUpload, isUploading } = useUploadThing("avatar", {
    onClientUploadComplete: async (res) => {
      const url = res?.[0]?.url;
      if (!url) {
        setPhase("error");
        setError("Upload concluído, mas a URL não foi retornada.");
        return;
      }
      try {
        await onUploaded?.(url);
        setPhase("saved");
      } catch (e) {
        setPhase("error");
        setError(e instanceof Error ? e.message : "Falha ao salvar no backend.");
      }
    },
    onUploadError: (e) => {
      setPhase("error");
      setError(e?.message || "Falha ao enviar a imagem.");
    },
  });

  const statusText = useMemo(() => {
    if (phase === "compressing") return "Comprimindo…";
    if (phase === "uploading" || isUploading) return "Enviando…";
    if (phase === "saved") return "Salvo";
    if (phase === "error") return "Erro";
    return "";
  }, [phase, isUploading]);

  async function handlePick(file: File) {
    setError(null);
    setPhase("compressing");
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 500,
        fileType: "image/webp",
        useWebWorker: true,
      });

      const localPreview = URL.createObjectURL(compressed);
      setPreviewUrl(localPreview);

      setPhase("uploading");
      const res = await startUpload([compressed]);
      if (!res?.[0]?.url) {
        setPhase("error");
        setError("Não foi possível obter a URL do upload.");
      }
    } catch (e) {
      setPhase("error");
      setError(
        e instanceof Error ? e.message : "Falha ao comprimir/enviar a imagem.",
      );
    }
  }

  const busy = disabled || phase === "compressing" || phase === "uploading" || isUploading;

  return (
    <div className="mb-4">
      <span className="text-sm font-medium text-premium-text">{label}</span>

      <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPT}
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = "";
            if (!f) return;
            void handlePick(f);
          }}
        />

        <div className="relative shrink-0">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl ring-2 ring-premium-border ring-offset-2 ring-offset-premium-bg sm:size-24">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-premium-surface">
                <User className="size-10 text-premium-muted" aria-hidden />
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-lg border border-premium-border bg-premium-surface text-premium-text transition-colors hover:border-premium-accent hover:text-premium-accent disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Alterar foto de perfil"
            title="A imagem é comprimida no navegador e enviada em WebP."
          >
            {phase === "saved" ? (
              <Check className="size-4 text-emerald-300" aria-hidden />
            ) : phase === "compressing" || phase === "uploading" || isUploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="size-4" aria-hidden />
            )}
          </button>
        </div>

        <div className="text-sm text-premium-muted">
          <p className="font-medium text-premium-text">Foto de perfil</p>
          <p className="mt-0.5 text-xs text-premium-muted/85">
            WebP no browser (até ~2 MB, máx. 500px) → UploadThing → salva URL.
          </p>
          {statusText ? (
            <p className="mt-1 text-xs text-premium-muted/85">{statusText}</p>
          ) : null}
          {error ? (
            <p className="mt-1 text-xs text-red-300/90">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

