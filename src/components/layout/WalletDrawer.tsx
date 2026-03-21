"use client";

import { X } from "lucide-react";
import { useState } from "react";

const MOCK_BALANCE = "R$ 45,00";

const HISTORY_MOCK = [
  { id: "1", text: "+ R$ 20,00 - Depósito Pix", tone: "success" as const },
  { id: "2", text: "- R$ 3,00 - Cota #42 Dead Space", tone: "expense" as const },
  { id: "3", text: "+ R$ 50,00 - Depósito Pix", tone: "success" as const },
];

type WalletDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function WalletDrawer({ isOpen, onClose }: WalletDrawerProps) {
  const [customAmount, setCustomAmount] = useState("");

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar carteira"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-drawer-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-apex-surface bg-apex-bg shadow-2xl transition-transform duration-300 ease-out"
      >
        <div className="flex h-full min-h-0 flex-col p-6">
          <div className="flex shrink-0 items-start justify-between gap-4">
            <h2
              id="wallet-drawer-title"
              className="text-xl font-bold text-apex-text"
            >
              Minha Carteira
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:text-apex-text"
              aria-label="Fechar"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="mt-6 shrink-0 rounded-xl border border-apex-primary/20 bg-apex-surface p-6 text-center">
            <p className="text-sm font-medium text-apex-text/80">
              Saldo Disponível
            </p>
            <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-apex-accent">
              {MOCK_BALANCE}
            </p>
          </div>

          <div className="mt-8 shrink-0">
            <h3 className="text-sm font-semibold text-apex-text">
              Depositar via Pix
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["R$ 10", "R$ 20", "R$ 50"] as const).map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-lg border border-apex-primary bg-transparent py-2.5 text-sm font-medium text-apex-text transition-colors hover:border-apex-accent hover:text-apex-accent"
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Outro valor (ex: 15,00)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="mt-3 w-full rounded-lg border border-apex-surface bg-apex-bg px-3 py-2.5 text-apex-text placeholder:text-gray-500 focus:border-apex-accent focus:outline-none focus:ring-1 focus:ring-apex-accent"
            />
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-apex-accent py-3 text-center font-bold text-apex-bg transition-opacity hover:opacity-90"
            >
              Gerar QR Code Pix
            </button>
          </div>

          <div className="mt-8 flex min-h-0 flex-1 flex-col border-t border-apex-surface pt-6">
            <h3 className="shrink-0 text-sm font-semibold text-apex-text">
              Histórico recente
            </h3>
            <ul className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
              {HISTORY_MOCK.map((item) => (
                <li
                  key={item.id}
                  className={
                    item.tone === "success"
                      ? "text-apex-success"
                      : "text-red-400"
                  }
                >
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
