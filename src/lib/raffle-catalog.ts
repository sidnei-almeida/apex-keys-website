import type { RaffleListOut, RaffleStatusApi } from "@/types/api";

/** Listagem `/rifas`: ainda há cotas vs concluída (API + vendas). */
export type RaffleListingStatus = "open" | "concluded";

/** JSON por vezes devolve strings; comparações lexicográficas quebram `sold >= total`. */
function toFiniteInt(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Cotas vendidas (pagas) na listagem — usar em vez de `raffle.sold` cru. */
export function raffleSoldCount(raffle: RaffleListOut): number {
  return toFiniteInt((raffle as { sold?: unknown }).sold);
}

export function raffleTotalTickets(raffle: RaffleListOut): number {
  return toFiniteInt(raffle.total_tickets);
}

/** Normaliza `status` da API (casing / espaços). */
export function getRaffleStatusKey(raffle: RaffleListOut): RaffleStatusApi | "unknown" {
  const s = String(raffle.status ?? "").toLowerCase().trim();
  if (s === "active" || s === "sold_out" || s === "finished" || s === "canceled") {
    return s;
  }
  return "unknown";
}

/** Todas as cotas vendidas (com meta válida), com números coerentes. */
export function raffleAllTicketsSold(raffle: RaffleListOut): boolean {
  const t = raffleTotalTickets(raffle);
  const s = raffleSoldCount(raffle);
  return t > 0 && s >= t;
}

/**
 * Rifa concluída na aba RIFAS (`/rifas`):
 * - `finished` ou `canceled` na API (fonte de verdade da BD), ou
 * - `sold >= total_tickets` (inclui `active`/`sold_out` com grelha cheia).
 */
export function isRaffleListingConcluded(raffle: RaffleListOut): boolean {
  const key = getRaffleStatusKey(raffle);
  if (key === "finished" || key === "canceled") return true;
  return raffleAllTicketsSold(raffle);
}

/**
 * Estado para ordenação e variantes de UI do `RaffleGridCard`.
 * @see sortRafflesForListing
 */
export function getRaffleStatus(raffle: RaffleListOut): RaffleListingStatus {
  return isRaffleListingConcluded(raffle) ? "concluded" : "open";
}

export function raffleHasRecordedDraw(raffle: RaffleListOut): boolean {
  return (
    raffle.winning_ticket_number != null ||
    Boolean(raffle.drawn_at && raffle.drawn_at.trim().length > 0)
  );
}

/**
 * Ordenação client-side (a API ordena por `featured_tier`, não por “aberta primeiro”).
 * Abertas primeiro; concluídas no fim; estável (data desc, depois `id`).
 */
export function sortRafflesForListing(list: RaffleListOut[]): RaffleListOut[] {
  return [...list].sort((a, b) => {
    const ca = getRaffleStatus(a) === "concluded" ? 1 : 0;
    const cb = getRaffleStatus(b) === "concluded" ? 1 : 0;
    if (ca !== cb) return ca - cb;
    const byDate = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (byDate !== 0) return byDate;
    return a.id.localeCompare(b.id);
  });
}

export function partitionRafflesForListing(list: RaffleListOut[]): {
  open: RaffleListOut[];
  concluded: RaffleListOut[];
} {
  const sorted = sortRafflesForListing(list);
  return {
    open: sorted.filter((r) => getRaffleStatus(r) === "open"),
    concluded: sorted.filter((r) => getRaffleStatus(r) === "concluded"),
  };
}

const BADGE_OPEN: Record<RaffleStatusApi, string> = {
  active: "Aberta",
  sold_out: "Esgotada",
  finished: "Finalizada",
  canceled: "Cancelada",
};

export function getRaffleListBadgeLabel(raffle: RaffleListOut): string {
  if (getRaffleStatus(raffle) === "concluded") {
    const s = getRaffleStatusKey(raffle);
    if (s === "finished") return "Finalizada";
    if (s === "canceled") return "Encerrada";
    return "Esgotada";
  }
  const s = getRaffleStatusKey(raffle);
  if (s === "unknown") return String(raffle.status ?? "—");
  return BADGE_OPEN[s];
}

export function isRaffleParticipationOpen(raffle: RaffleListOut): boolean {
  return getRaffleStatusKey(raffle) === "active" && !raffleAllTicketsSold(raffle);
}

export type RaffleCardCta = {
  href: string;
  label: string;
  prominent: boolean;
};

export function getRaffleCardCta(raffle: RaffleListOut): RaffleCardCta {
  const id = raffle.id;

  if (getRaffleStatus(raffle) === "concluded") {
    const s = getRaffleStatusKey(raffle);
    if (s === "canceled") {
      return { href: `/raffle/${id}`, label: "Ver detalhes", prominent: false };
    }
    const hasDraw = raffleHasRecordedDraw(raffle);
    if (hasDraw) {
      return { href: `/raffle/${id}/sorteio`, label: "Ver resultado", prominent: false };
    }
    return { href: `/raffle/${id}/sorteio`, label: "Ver sorteio", prominent: false };
  }

  const s = getRaffleStatusKey(raffle);
  if (s === "active" && !raffleAllTicketsSold(raffle)) {
    return { href: `/raffle/${id}`, label: "Participar", prominent: true };
  }

  return { href: `/raffle/${id}/sorteio`, label: "Ver sorteio", prominent: true };
}
