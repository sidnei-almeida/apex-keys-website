"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getMyTickets } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { MyTicketOut } from "@/types/api";
import { ArrowLeft, Gamepad2, Loader2, Ticket } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api/config";

function formatBRL(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n)
    ? "R$ 0,00"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function raffleImageUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${getApiBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Agrupa bilhetes por rifa */
function groupByRaffle(tickets: MyTicketOut[]): Map<string, MyTicketOut[]> {
  const map = new Map<string, MyTicketOut[]>();
  for (const t of tickets) {
    const key = t.raffle_id;
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }
  return map;
}

export default function MinhasRifasPage() {
  const { isReady, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<MyTicketOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    getMyTickets(token, "active")
      .then(setTickets)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [isReady, isAuthenticated, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-apex-accent" aria-hidden />
      </div>
    );
  }

  const grouped = groupByRaffle(tickets);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-apex-text-muted/80 transition-colors hover:text-apex-accent"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Voltar
      </Link>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-apex-text/95 sm:text-3xl">
        Minhas Rifas Ativas
      </h1>
      <p className="mt-1 text-sm text-apex-text-muted/80">
        Rifas em que você participa e ainda estão abertas
      </p>

      {loading && (
        <div className="mt-12 flex justify-center">
          <Loader2 className="size-8 animate-spin text-apex-accent" aria-hidden />
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && grouped.size === 0 && (
        <div className="mt-12 rounded-xl border border-white/[0.08] bg-apex-surface/50 p-12 text-center">
          <Ticket className="mx-auto size-14 text-apex-text-muted/40" aria-hidden />
          <p className="mt-4 text-apex-text-muted/80">Você ainda não participa de rifas ativas.</p>
          <Link
            href="/rifas"
            className="mt-4 inline-block text-sm font-medium text-apex-accent hover:underline"
          >
            Ver rifas disponíveis
          </Link>
        </div>
      )}

      {!loading && !error && grouped.size > 0 && (
        <div className="mt-8 space-y-6">
          {Array.from(grouped.entries()).map(([raffleId, list]) => {
            const first = list[0];
            const r = first.raffle;
            const imgUrl = raffleImageUrl(r.image_url);
            const hasPending = list.some(
              (t) => (t.status ?? "paid") === "pending_payment",
            );
            return (
              <Link
                key={raffleId}
                href={`/raffle/${raffleId}`}
                className="block overflow-hidden rounded-xl border border-white/[0.08] bg-apex-surface/50 transition-colors hover:border-apex-accent/30 hover:bg-apex-surface/70"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative aspect-video w-full shrink-0 sm:w-48 sm:aspect-square">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-apex-bg/80">
                        <Gamepad2 className="size-16 text-apex-accent/30" aria-hidden />
                      </div>
                    )}
                    <span className="absolute right-2 top-2 rounded bg-apex-accent/90 px-2 py-0.5 text-xs font-bold text-apex-bg">
                      {r.status === "active" ? "Ativa" : r.status}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
                    <div>
                      <h2 className="font-semibold text-apex-text">{r.title}</h2>
                      <p className="mt-1 text-sm text-apex-text-muted/80">
                        {list.length} bilhete{list.length > 1 ? "s" : ""}: nº{" "}
                        {list.map((t) => t.ticket_number).join(", ")}
                      </p>
                      {hasPending ? (
                        <p className="mt-1 text-xs text-amber-400/90">
                          Há número(s){" "}
                          <strong>aguardando pagamento</strong> — conclua o Pix ou
                          aguarde a confirmação.
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-medium text-apex-accent">
                      {formatBRL(r.ticket_price)} / cota
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
