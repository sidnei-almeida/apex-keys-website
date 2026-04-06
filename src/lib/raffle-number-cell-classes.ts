/**
 * Classes da grelha de números da rifa (/raffle/[id]) e do histórico de bilhetes.
 * Mantém o mesmo aspeto visual entre as duas áreas.
 */

/** Base comum aos botões da grelha na página da rifa. */
export const RAFFLE_NUMBER_GRID_CELL_BASE =
  "flex aspect-square min-h-[2.25rem] items-center justify-center rounded-md border text-sm font-medium transition-colors sm:min-h-0 sm:aspect-auto sm:py-2";

/** Número selecionado na rifa (clicável). */
export const RAFFLE_NUMBER_STYLE_SELECTED =
  "scale-[1.02] cursor-pointer border-premium-accent bg-premium-accent font-bold text-[#0A0A0A]";

/** Número disponível na grelha. */
export const RAFFLE_NUMBER_STYLE_AVAILABLE =
  "cursor-pointer border-premium-border bg-premium-cell text-premium-text hover:border-premium-muted/60 hover:bg-[#2a2a2a]";

/** Bilhete confirmado no histórico — mesmo preenchimento ouro da seleção na rifa (só leitura). */
export const HISTORICO_TICKET_BADGE_CLASS =
  "inline-flex h-9 min-w-[2.35rem] shrink-0 items-center justify-center rounded-md border border-premium-accent bg-premium-accent px-2 text-sm font-bold tabular-nums text-[#0A0A0A]";

/** Células do modal “Ver todos” no histórico. */
export const HISTORICO_MODAL_NUMBER_CELL_CLASS =
  "flex aspect-square min-h-[2.25rem] w-full min-w-0 items-center justify-center rounded-md border border-premium-accent bg-premium-accent text-sm font-bold text-[#0A0A0A] sm:min-h-0 sm:aspect-auto sm:py-2";
