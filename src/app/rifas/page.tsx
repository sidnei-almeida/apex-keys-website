"use client";

import { RaffleGridCard } from "@/components/raffle/RaffleCard";
import { getRaffles } from "@/lib/api/services";
import type { RaffleListOut } from "@/types/api";
import { Box, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function RifasPage() {
  const [raffles, setRaffles] = useState<RaffleListOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRaffles()
      .then(setRaffles)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar rifas")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold text-premium-text">Rifas</h1>
      <p className="mb-10 text-premium-muted">
        Todas as rifas — ativas, vendendo, esgotadas ou finalizadas. Clique para participar ou ver detalhes.
      </p>

      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="size-10 animate-spin text-premium-muted" aria-hidden />
        </div>
      )}

      {!loading && raffles.length === 0 && !error && (
        <div className="rounded-xl border border-premium-border bg-premium-surface p-16 text-center">
          <Box className="mx-auto size-16 text-premium-muted/50" aria-hidden />
          <p className="mt-4 text-premium-muted">Nenhuma rifa no momento.</p>
          <p className="mt-2 text-sm text-premium-muted/80">
            Volte em breve para conferir novos sorteios.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-8 text-center">
          <p className="text-red-300/90">{error}</p>
        </div>
      )}

      {!loading && raffles.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {raffles.map((raffle) => (
            <RaffleGridCard key={raffle.id} raffle={raffle} />
          ))}
        </div>
      )}
    </div>
  );
}
