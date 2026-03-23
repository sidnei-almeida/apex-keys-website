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
  /** Chave PIX para recebimento (reembolsos, prêmios) — CPF, e-mail, telefone ou aleatória */
  pix_key?: string | null;
  is_admin: boolean;
  balance: string;
  created_at: string;
  /** URL da foto de perfil — a implementar no backend */
  avatar_url?: string | null;
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

/** RafflePublic + sold (quantidade vendida) — retorno de GET /raffles */
export type RaffleListOut = RafflePublic & { sold: number };

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

/** Bilhete do usuário com dados da rifa (GET /users/me/tickets) */
export type MyTicketOut = {
  ticket_id: string;
  raffle_id: string;
  ticket_number: number;
  raffle: RafflePublic;
  created_at: string;
};

export type SignupRequest = {
  full_name: string;
  email: string;
  password: string;
  whatsapp: string;
  /** Chave PIX (CPF, e-mail, telefone ou aleatória) para recebimentos */
  pix_key: string;
};

/** Atualização parcial do perfil do usuário */
export type UserProfileUpdate = {
  full_name?: string;
  whatsapp?: string;
  pix_key?: string;
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
