"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getWalletTransactions } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { TransactionOut } from "@/types/api";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Loader2, Receipt } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function formatBRL(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n)
    ? "R$ 0,00"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

const TYPE_LABEL: Record<string, string> = {
  pix_deposit: "Depósito PIX",
  purchase: "Compra de bilhete",
  refund: "Estorno",
  admin_adjustment: "Ajuste manual",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluída",
  failed: "Falhou",
};

function TransactionRow({ t }: { t: TransactionOut }) {
  const amountNum = parseFloat(String(t.amount));
  const isCredit =
    t.type === "pix_deposit" ||
    t.type === "refund" ||
    (t.type === "admin_adjustment" && amountNum > 0);
  const displayAmount = t.type === "purchase" ? -Math.abs(amountNum) : amountNum;

  return (
    <div
      className="flex items-start justify-between gap-4 border-b border-white/[0.06] py-4 last:border-0"
      role="row"
    >
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
            isCredit ? "bg-apex-success/20 text-apex-success" : "bg-apex-surface text-apex-text-muted"
          }`}
        >
          {isCredit ? (
            <ArrowDownLeft className="size-5" aria-hidden />
          ) : (
            <ArrowUpRight className="size-5" aria-hidden />
          )}
        </div>
        <div>
          <p className="font-medium text-apex-text">{TYPE_LABEL[t.type] ?? t.type}</p>
          <p className="text-xs text-apex-text-muted/80">
            {STATUS_LABEL[t.status] ?? t.status} · {formatDate(t.created_at)}
          </p>
          {t.description && (
            <p className="mt-0.5 max-w-md truncate text-xs text-apex-text-muted/60" title={t.description}>
              {t.description}
            </p>
          )}
        </div>
      </div>
      <span
        className={`shrink-0 font-semibold tabular-nums ${
          isCredit ? "text-apex-success" : "text-apex-text-muted"
        }`}
      >
        {displayAmount >= 0 ? "+" : ""}{formatBRL(displayAmount)}
      </span>
    </div>
  );
}

export default function MinhasTransacoesPage() {
  const { isReady, isAuthenticated } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionOut[]>([]);
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
    getWalletTransactions(token)
      .then(setTransactions)
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
        Minhas Transações
      </h1>
      <p className="mt-1 text-sm text-apex-text-muted/80">
        Histórico completo de movimentações na sua carteira
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

      {!loading && !error && transactions.length === 0 && (
        <div className="mt-12 rounded-xl border border-white/[0.08] bg-apex-surface/50 p-12 text-center">
          <Receipt className="mx-auto size-14 text-apex-text-muted/40" aria-hidden />
          <p className="mt-4 text-apex-text-muted/80">Nenhuma transação ainda.</p>
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.08] bg-apex-surface/50">
          <div className="divide-y divide-white/[0.06] px-4 sm:px-6">
            {transactions.map((t) => (
              <TransactionRow key={t.id} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
