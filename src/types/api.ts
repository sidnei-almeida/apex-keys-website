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
  /** Conta desativada e agendada para exclusão definitiva */
  deactivated_at?: string | null;
  delete_after?: string | null;
};

export type WalletBalanceResponse = {
  balance: string;
};

export type TransactionOut = {
  id: string;
  amount: string;
  type:
    | "pix_deposit"
    | "purchase"
    | "refund"
    | "admin_adjustment"
    | "raffle_payment";
  status: "pending" | "completed" | "failed" | "canceled";
  gateway_reference: string | null;
  description: string | null;
  payment_hold_id?: string | null;
  created_at: string;
};

/** Resposta de POST /wallet/mock-pix-intent (mock ou Mercado Pago real). */
export type MercadoPagoPixPayload = {
  payment_id: string;
  status: string | null;
  qr_code: string | null;
  qr_code_base64: string | null;
  ticket_url: string | null;
};

export type MockPixPayload = {
  gateway_reference: string;
  amount_brl: string;
  merchant_name: string;
  emv_payload: string;
  note: string;
};

export type PixIntentResponse = {
  message: string;
  provider: "mercadopago" | "mock";
  mercado_pago: MercadoPagoPixPayload | null;
  mock_pix: MockPixPayload | null;
  /** Fim da janela de 15 min para a reserva (rifa / checkout reserva). */
  expires_at?: string | null;
};

export type RaffleStatusApi = "active" | "sold_out" | "finished" | "canceled";

/** Posição na home: featured = hero no topo (várias rifas podem ter ouro; rotação na home), carousel = faixa abaixo, none = só em /rifas */
export type FeaturedTier = "featured" | "carousel" | "none";

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
  /** featured = hero, carousel = carrossel, none = só em /rifas */
  featured_tier?: FeaturedTier | null;
  /** Bilhete vencedor (rifas já sorteadas) */
  winning_ticket_number?: number | null;
  drawn_at?: string | null;
  /** UTC ISO: sorteio automático na roleta após esgotar (10 min após 100% pagos) */
  scheduled_live_draw_at?: string | null;
  /** Metadados IGDB / copy */
  summary?: string | null;
  genres?: string[];
  series?: string[];
  game_modes?: string[];
  player_perspectives?: string[];
  igdb_url?: string | null;
  igdb_game_id?: string | null;
};

/** GET/POST/PUT admin — inclui chave Steam (nunca expor em rotas só públicas). */
export type AdminRaffleOut = RafflePublic & {
  steam_redemption_code?: string | null;
};

/** RafflePublic + sold (quantidade vendida) — retorno de GET /raffles */
export type RaffleListOut = RafflePublic & { sold: number; held?: number };

/** RaffleListOut + sold_numbers — retorno de GET /raffles/{id} */
export type RaffleDetailOut = RaffleListOut & {
  sold_numbers: number[];
  /** Números reservados (aguardando pagamento) — bloqueados na grade */
  held_numbers?: number[];
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

/** GET /raffles/hall-of-fame — rifa em destaque no cartão */
export type HallOfFameSpotlightRaffle = {
  raffle_id: string;
  title: string;
  image_url: string | null;
  winning_ticket_number: number;
};

/** GET /raffles/hall-of-fame — uma posição no pódio (rank 1 = campeão) */
export type HallOfFameEntryOut = {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
  wins: number;
  spotlight: HallOfFameSpotlightRaffle;
};

/** GET /recent-purchase-pulses — prova social (compras reais agregadas por minuto) */
export type RecentPurchasePulseOut = {
  id: string;
  display_name: string;
  quantity: number;
  raffle_title: string;
  purchased_at: string;
};

export type NotificationOut = {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

/** Bilhete do usuário com dados da rifa (GET /users/me/tickets) */
export type MyTicketOut = {
  ticket_id: string;
  raffle_id: string;
  ticket_number: number;
  status?: "paid" | "pending_payment";
  raffle: RafflePublic;
  created_at: string;
};

/** POST /checkout/reserve-tickets */
export type ReserveRaffleTicketsResponse = {
  payment_hold_id: string;
  raffle_id: string;
  ticket_numbers: number[];
  total_amount: string;
};

/** GET /checkout/reservation/{hold_id}/status */
export type ReservationStatusOut = {
  payment_hold_id: string;
  state: "pending_payment" | "paid" | "released" | "unknown";
  raffle_id: string | null;
  ticket_numbers: number[];
  transaction_status: "pending" | "completed" | "failed" | "canceled" | null;
  gateway_reference: string | null;
};

/** GET /api/v1/admin/reservations — item em active ou archived */
export type AdminReservationRowOut = {
  row_kind: "active" | "archived";
  payment_hold_id: string | null;
  user_id: string;
  user_email: string;
  user_name: string;
  raffle_id: string | null;
  raffle_title: string;
  ticket_numbers: number[];
  total_amount: string;
  created_at: string;
  /** Só reservas ativas: fim da janela de 15 min */
  expires_at: string | null;
  /** pix = legado (MP); pix_mp = Mercado Pago; wallet = só carteira; pix_mp_wallet = misto (futuro). */
  payment_channel:
    | "pix"
    | "pix_mp"
    | "wallet"
    | "wallet_pending"
    | "none"
    | "pix_mp_wallet";
  transaction_id: string | null;
  transaction_status: "pending" | "completed" | "failed" | "canceled" | null;
  gateway_reference: string | null;
};

export type AdminReservationsListOut = {
  active: AdminReservationRowOut[];
  archived: AdminReservationRowOut[];
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
  featured_tier?: FeaturedTier | null;
  summary?: string | null;
  genres?: string[];
  series?: string[];
  game_modes?: string[];
  player_perspectives?: string[];
  igdb_url?: string | null;
  igdb_game_id?: string | null;
  /** Chave/código Steam para o vencedor (notificação após sorteio). */
  steam_redemption_code?: string | null;
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

export type AdminUserPatch = {
  full_name?: string;
  email?: string;
  whatsapp?: string;
  pix_key?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean;
};

export type AdminWalletAdjustResponse = {
  user_id: string;
  previous_balance: string;
  new_balance: string;
  amount_adjusted: string;
};

export type AdminWheelSegmentOut = {
  ticket_number: number;
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
};

export type AdminWheelSegmentsOut = {
  raffle_id: string;
  raffle_title: string;
  raffle_status: RaffleStatusApi;
  winning_ticket_number: number | null;
  segments: AdminWheelSegmentOut[];
};

export type AdminDrawRandomOut = {
  raffle: AdminRaffleOut;
  winner_ticket_number: number;
  winner_user_id: string;
  winner_full_name: string;
};

export type PublicWheelSegmentOut = {
  ticket_number: number;
  full_name: string;
};

export type PublicLiveDrawOut = {
  raffle_id: string;
  raffle_title: string;
  status: string;
  server_now: string;
  scheduled_live_draw_at: string | null;
  seconds_until_draw: number | null;
  winner_ticket_number: number | null;
  winner_full_name: string | null;
  segments: PublicWheelSegmentOut[];
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
