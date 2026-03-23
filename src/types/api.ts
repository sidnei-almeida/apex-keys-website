/** Alinhado a FRONTEND_API.md / OpenAPI */

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
};

export type UserPublic = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  is_admin: boolean;
  balance: string;
  created_at: string;
};

export type WalletBalanceResponse = {
  balance: string;
};

export type TransactionOut = {
  id: string;
  amount: string;
  type: "pix_deposit" | "purchase" | "refund" | "admin_adjustment";
  status: "pending" | "completed" | "failed";
  gateway_reference: string | null;
  description: string | null;
  created_at: string;
};

export type RaffleStatusApi = "active" | "sold_out" | "finished" | "canceled";

export type RafflePublic = {
  id: string;
  title: string;
  image_url: string | null;
  video_id: string | null;
  total_price: string;
  total_tickets: number;
  ticket_price: string;
  status: string;
  created_at: string;
  /** Metadados IGDB / copy — opcionais até o backend expor no OpenAPI */
  summary?: string | null;
  genres?: string[];
  series?: string[];
  game_modes?: string[];
  player_perspectives?: string[];
};

export type TicketPurchaseRequest = {
  raffle_id: string;
  ticket_number: number;
};

export type TicketPurchaseResponse = {
  ticket_id: string;
  raffle_id: string;
  ticket_number: number;
  amount_charged: string;
  new_balance: string;
};

export type SignupRequest = {
  full_name: string;
  email: string;
  password: string;
  whatsapp: string;
};

export type AdminRaffleCreate = {
  title: string;
  image_url: string | null;
  video_id: string | null;
  total_price: number;
  total_tickets: number;
  summary?: string | null;
  genres?: string[];
  series?: string[];
  game_modes?: string[];
  player_perspectives?: string[];
};

export type RaffleCancelResponse = {
  raffle_id: string;
  status: "canceled";
  refunds_issued: number;
};

export type AdminWalletAdjust = {
  amount: number;
  description?: string;
};

export type AdminWalletAdjustResponse = {
  user_id: string;
  previous_balance: string;
  new_balance: string;
  amount_adjusted: string;
};

export type IgdbGameUrlRequest = {
  url: string;
};

export type IgdbGameInfoResponse = {
  slug: string;
  name: string | null;
  title: string | null;
  summary: string | null;
  image_url: string | null;
  youtube_url: string | null;
  igdb_url: string;
  igdb_game_id: string | null;
  genres: string[];
  series: string[];
  game_modes: string[];
  player_perspectives: string[];
};

export type ApiErrorBody = {
  detail?: string;
  errors?: unknown[];
};
