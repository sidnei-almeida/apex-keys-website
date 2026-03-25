"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getWalletTransactions } from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { TransactionOut } from "@/types/api";
import {
  ArrowLeft,
  ArrowDownLeft,
  Loader2,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  Ticket,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  purchase: "Compra de bilhetes",
  raffle_payment: "Pagamento de rifa",
  refund: "Estorno",
  admin_adjustment: "Ajuste manual",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluída",
  failed: "Falhou",
  canceled: "Cancelada",
};

function isTransactionCredit(t: TransactionOut) {
  const amountNum = parseFloat(String(t.amount));
  return (
    t.type === "pix_deposit" ||
    t.type === "refund" ||
    (t.type === "admin_adjustment" && amountNum > 0)
  );
}

function displayAmountFor(t: TransactionOut) {
  const amountNum = parseFloat(String(t.amount));
  if (t.type === "purchase" || t.type === "raffle_payment") {
    return -Math.abs(amountNum);
  }
  return amountNum;
}

function localDateKey(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayGroupLabel(dateKey: string) {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const cmp = new Date(date);
  cmp.setHours(0, 0, 0, 0);
  if (cmp.getTime() === today.getTime()) return "Hoje";
  if (cmp.getTime() === yesterday.getTime()) return "Ontem";
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function groupTransactionsByDay(items: TransactionOut[]) {
  const map = new Map<string, TransactionOut[]>();
  for (const t of items) {
    const k = localDateKey(t.created_at);
    const list = map.get(k) ?? [];
    list.push(t);
    map.set(k, list);
  }
  const keys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
  return keys.map((key) => ({
    key,
    label: dayGroupLabel(key),
    items: map.get(key)!,
  }));
}

type TxnVisual = {
  Icon: typeof Wallet;
  ring: string;
  iconClass: string;
};

function getTransactionVisual(t: TransactionOut, isCredit: boolean): TxnVisual {
  if (isCredit) {
    if (t.type === "refund") {
      return {
        Icon: RotateCcw,
        ring: "bg-emerald-950/35 ring-1 ring-emerald-500/25",
        iconClass: "text-emerald-400",
      };
    }
    if (t.type === "pix_deposit") {
      return {
        Icon: Wallet,
        ring: "bg-emerald-950/35 ring-1 ring-emerald-500/25",
        iconClass: "text-emerald-400",
      };
    }
    return {
      Icon: ArrowDownLeft,
      ring: "bg-emerald-950/35 ring-1 ring-emerald-500/25",
      iconClass: "text-emerald-400",
    };
  }
  if (t.type === "purchase" || t.type === "raffle_payment") {
    return {
      Icon: Ticket,
      ring: "bg-premium-accent/12 ring-1 ring-premium-accent/35",
      iconClass: "text-premium-accent",
    };
  }
  return {
    Icon: SlidersHorizontal,
    ring: "bg-premium-bg ring-1 ring-premium-border",
    iconClass: "text-premium-muted",
  };
}

function statusBadgeClass(status: TransactionOut["status"]) {
  switch (status) {
    case "completed":
      return "border-emerald-800/50 bg-emerald-950/30 text-emerald-300/90";
    case "pending":
      return "border-amber-800/50 bg-amber-950/35 text-amber-200/90";
    case "failed":
    case "canceled":
      return "border-red-900/50 bg-red-950/35 text-red-300/85";
    default:
      return "border-premium-border bg-premium-bg text-premium-muted";
  }
}

function TransactionRow({ t }: { t: TransactionOut }) {
  const isCredit = isTransactionCredit(t);
  const displayAmount = displayAmountFor(t);
  const visual = getTransactionVisual(t, isCredit);
  const { Icon } = visual;

  return (
    <div
      className="flex items-start justify-between gap-4 rounded-xl border border-premium-border/70 bg-premium-bg/40 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-premium-muted/35 hover:bg-premium-bg/55"
      role="row"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${visual.ring}`}
        >
          <Icon className={`size-5 ${visual.iconClass}`} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-premium-text">
              {TYPE_LABEL[t.type] ?? t.type}
            </p>
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(t.status)}`}
            >
              {STATUS_LABEL[t.status] ?? t.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-premium-muted">{formatDate(t.created_at)}</p>
          {t.description && (
            <p
              className="mt-1 line-clamp-2 text-xs leading-snug text-premium-muted/85"
              title={t.description}
            >
              {t.description}
            </p>
          )}
        </div>
      </div>
      <span
        className={`shrink-0 text-right text-base font-bold tabular-nums tracking-tight ${
          isCredit ? "text-emerald-400" : "text-premium-text"
        }`}
      >
        {displayAmount >= 0 ? "+" : ""}
        {formatBRL(displayAmount)}
      </span>
    </div>
  );
}

type TxFilter = "all" | "credit" | "debit";

const FILTER_TABS: { id: TxFilter; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "credit", label: "Entradas" },
  { id: "debit", label: "Saídas" },
];

export default function MinhasTransacoesPage() {
  const { isReady, isAuthenticated } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TxFilter>("all");

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return sortedTransactions;
    if (filter === "credit") return sortedTransactions.filter((t) => isTransactionCredit(t));
    return sortedTransactions.filter((t) => !isTransactionCredit(t));
  }, [sortedTransactions, filter]);

  const grouped = useMemo(
    () => groupTransactionsByDay(filteredTransactions),
    [filteredTransactions],
  );

  const totalsHint = useMemo(() => {
    let credits = 0;
    let debits = 0;
    for (const t of sortedTransactions) {
      const v = displayAmountFor(t);
      if (v >= 0) credits += v;
      else debits += v;
    }
    return { credits, debits, count: sortedTransactions.length };
  }, [sortedTransactions]);

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
        <Loader2 className="size-8 animate-spin text-premium-muted" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[min(100%,120rem)] px-4 py-12 sm:px-6 lg:px-8 xl:px-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-premium-muted transition-colors hover:text-premium-text"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Voltar
      </Link>
      <header className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-premium-text md:text-4xl">
            Minhas Transações
          </h1>
          <p className="mt-2 max-w-xl text-sm text-premium-muted md:text-base">
            Histórico de movimentações na sua carteira, agrupado por data.
          </p>
        </div>
        {totalsHint.count > 0 && (
          <div className="flex flex-wrap gap-3 rounded-xl border border-premium-border bg-premium-surface/80 px-4 py-3 text-sm shadow-[0_8px_28px_rgba(0,0,0,0.25)]">
            <div className="min-w-[8rem]">
              <p className="text-[11px] font-medium uppercase tracking-wide text-premium-muted">
                Entradas
              </p>
              <p className="mt-0.5 font-semibold tabular-nums text-emerald-400">
                +{formatBRL(totalsHint.credits)}
              </p>
            </div>
            <div className="hidden h-10 w-px shrink-0 bg-premium-border sm:block" aria-hidden />
            <div className="min-w-[8rem]">
              <p className="text-[11px] font-medium uppercase tracking-wide text-premium-muted">
                Saídas
              </p>
              <p className="mt-0.5 font-semibold tabular-nums text-premium-text">
                {formatBRL(totalsHint.debits)}
              </p>
            </div>
          </div>
        )}
      </header>

      {loading && (
        <div className="mt-12 flex justify-center">
          <Loader2 className="size-8 animate-spin text-premium-muted" aria-hidden />
        </div>
      )}

      {error && (
        <p
          className="mt-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300/90"
          role="alert"
        >
          {error}
        </p>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="mt-12 rounded-xl border border-premium-border bg-premium-surface p-12 text-center">
          <Receipt className="mx-auto size-14 text-premium-muted/50" aria-hidden />
          <p className="mt-4 text-premium-muted">Nenhuma transação ainda.</p>
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="mt-10 space-y-6">
          <div
            className="inline-flex rounded-xl border border-premium-border bg-premium-bg/60 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            role="tablist"
            aria-label="Filtrar transações"
          >
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-premium-surface text-premium-text shadow-md ring-1 ring-premium-border"
                      : "text-premium-muted hover:text-premium-text"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="rounded-xl border border-premium-border bg-premium-surface/80 px-6 py-12 text-center">
              <p className="text-premium-muted">
                Nenhuma transação neste filtro.
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-3 text-sm font-medium text-premium-accent hover:underline"
              >
                Ver todas
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {grouped.map((section) => (
                <section key={section.key} aria-labelledby={`tx-group-${section.key}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <h2
                      id={`tx-group-${section.key}`}
                      className="font-heading text-lg font-semibold text-premium-text"
                    >
                      {section.label}
                    </h2>
                    <span className="h-px min-w-[2rem] flex-1 bg-gradient-to-r from-premium-border to-transparent" />
                    <span className="text-xs font-medium tabular-nums text-premium-muted">
                      {section.items.length}{" "}
                      {section.items.length === 1 ? "item" : "itens"}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {section.items.map((t) => (
                      <li key={t.id}>
                        <TransactionRow t={t} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
