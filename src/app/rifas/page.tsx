"use client";

import { RaffleGridCard } from "@/components/raffle/RaffleCard";
import { getRaffles } from "@/lib/api/services";
import { partitionRafflesForListing } from "@/lib/raffle-catalog";
import type { RaffleListOut } from "@/types/api";
import { Box, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const GRID =
  "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export default function RifasPage() {
  const [raffles, setRaffles] = useState<RaffleListOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRaffles()
      .then(setRaffles)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar rifas"),
      )
      .finally(() => setLoading(false));
  }, []);

  const { open, concluded } = useMemo(
    () => partitionRafflesForListing(raffles),
    [raffles],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold text-premium-text">Rifas</h1>
      <p className="mb-2 max-w-2xl text-premium-muted">
        Rifas com cotas disponíveis aparecem primeiro. As que já venderam todas as cotas
        ficam no final, com visual em preto e branco — ainda pode abrir detalhes ou
        resultado do sorteio.
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
        <>
          {open.length > 0 ? (
            <section className="mt-10" aria-labelledby="rifas-ativas-heading">
              <div className="mb-6">
                <h2
                  id="rifas-ativas-heading"
                  className="text-xl font-semibold tracking-tight text-premium-text"
                >
                  Rifas ativas
                </h2>
                <p className="mt-1 text-sm text-premium-muted/90">
                  Ainda há números disponíveis ou a campanha não esgotou as cotas.
                </p>
              </div>
              <div className={GRID}>
                {open.map((raffle) => (
                  <RaffleGridCard key={raffle.id} raffle={raffle} />
                ))}
              </div>
            </section>
          ) : null}

          {concluded.length > 0 ? (
            <section
              className={
                open.length > 0
                  ? "mt-14 border-t border-zinc-800/70 pt-12"
                  : "mt-10"
              }
              aria-labelledby="rifas-concluidas-heading"
            >
              <div className="mb-6">
                <h2
                  id="rifas-concluidas-heading"
                  className="text-xl font-semibold tracking-tight text-zinc-300"
                >
                  Rifas concluídas
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Todas as cotas foram vendidas — visual discreto para não competir com
                  rifas abertas.
                </p>
              </div>
              <div className={GRID}>
                {concluded.map((raffle) => (
                  <RaffleGridCard key={raffle.id} raffle={raffle} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
