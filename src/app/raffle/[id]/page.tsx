"use client";

import { ArrowLeft, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

const SOLD_NUMBERS = new Set([13, 42, 99]);
const PRICE_PER_NUMBER = 3;
const RAFFLE_TITLE = "Dead Space Remake - Steam Key";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function RafflePage() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const selectedSet = useMemo(
    () => new Set(selectedNumbers),
    [selectedNumbers],
  );

  const toggleNumber = useCallback((num: number) => {
    if (SOLD_NUMBERS.has(num)) return;
    setSelectedNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      }
      return [...prev, num].sort((a, b) => a - b);
    });
  }, []);

  const totalPay = selectedNumbers.length * PRICE_PER_NUMBER;
  const canPay = selectedNumbers.length > 0;

  const numbers = useMemo(
    () => Array.from({ length: 100 }, (_, i) => i + 1),
    [],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-apex-accent"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Voltar
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-6">
          <div className="mx-auto w-full max-w-xs">
            <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-apex-surface shadow-[0_0_30px_rgba(0,212,255,0.15)]">
              <Gamepad2
                className="size-20 text-apex-accent/35 sm:size-24"
                strokeWidth={1.15}
                aria-hidden
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-apex-text sm:text-3xl">
              {RAFFLE_TITLE}
            </h1>
            <p className="mt-2 text-apex-success">
              {formatBRL(PRICE_PER_NUMBER)} / cota
            </p>
          </div>

          <div className="rounded-xl border border-apex-primary/30 bg-apex-surface p-6">
            <p className="text-apex-text">
              Você selecionou:{" "}
              <span className="font-bold text-apex-accent">
                {selectedNumbers.length}{" "}
                {selectedNumbers.length === 1 ? "número" : "números"}
              </span>
            </p>
            <p className="mt-2 text-lg font-semibold text-apex-text">
              Total:{" "}
              <span className="text-apex-accent">{formatBRL(totalPay)}</span>
            </p>
            <button
              type="button"
              disabled={!canPay}
              className="mt-4 w-full rounded-xl bg-apex-accent py-3 text-center font-bold text-apex-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pagar com Saldo
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-apex-surface p-6">
          <h2 className="text-xl font-bold text-apex-text">
            Escolha seus números
          </h2>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-apex-bg ring-1 ring-apex-primary/30"
                aria-hidden
              />
              Disponível (Cinza)
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-apex-accent"
                aria-hidden
              />
              Selecionado (Ciano)
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full bg-apex-bg opacity-50 ring-1 ring-apex-bg"
                aria-hidden
              />
              Vendido (Escuro/Bloqueado)
            </span>
          </div>

          <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {numbers.map((num) => {
              const sold = SOLD_NUMBERS.has(num);
              const selected = selectedSet.has(num);

              let className =
                "flex aspect-square min-h-[2.25rem] items-center justify-center rounded-lg border text-sm font-medium transition-all sm:min-h-0 sm:aspect-auto sm:py-2";

              if (sold) {
                className +=
                  " cursor-not-allowed border-apex-bg/50 bg-apex-bg opacity-50 line-through text-apex-text/40";
              } else if (selected) {
                className +=
                  " scale-105 cursor-pointer border-apex-accent bg-apex-accent font-bold text-apex-bg shadow-md";
              } else {
                className +=
                  " cursor-pointer border-apex-primary/20 bg-apex-bg text-apex-text hover:border-apex-accent hover:bg-apex-primary/50";
              }

              return (
                <button
                  key={num}
                  type="button"
                  disabled={sold}
                  onClick={() => toggleNumber(num)}
                  className={className}
                  aria-pressed={selected}
                  aria-label={
                    sold
                      ? `Número ${num}, vendido`
                      : selected
                        ? `Número ${num}, selecionado`
                        : `Número ${num}, disponível`
                  }
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
