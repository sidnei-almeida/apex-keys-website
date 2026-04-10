/**
 * Chamadas tipadas à API — usar a partir de Server Components, Route Handlers
 * ou Client Components (CORS deve permitir a origem do Next).
 *
 * @see FRONTEND_API.md
 */
import type {
  AdminDrawRandomOut,
  AdminRaffleCreate,
  AdminRaffleOut,
  AdminReservationsListOut,
  AdminUserPatch,
  AdminWheelSegmentsOut,
  AdminWalletAdjust,
  AdminWalletAdjustResponse,
  HallOfFameEntryOut,
  RecentPurchasePulseOut,
  IgdbGameInfoResponse,
  IgdbGameUrlRequest,
  MyTicketOut,
  NotificationOut,
  PixIntentResponse,
  PublicLiveDrawOut,
  RaffleCancelResponse,
  RaffleDetailOut,
  RankingCategoryApi,
  RankingMeOut,
  RankingPodiumEntryOut,
  RaffleListOut,
  RaffleStatusApi,
  ReservationStatusOut,
  ReserveRaffleTicketsResponse,
  SignupRequest,
  TicketPurchaseRequest,
  TicketPurchaseResponse,
  TokenResponse,
  TransactionOut,
  UserProfileUpdate,
  UserPublic,
  WalletBalanceResponse,
} from "@/types/api";
import { logWalletPixIntentError, logWalletPixIntentOk } from "@/lib/client-log";
import {
  ApiError,
  apiRequest,
  deleteRequest,
  getJson,
  patchJson,
  postJson,
  putJson,
} from "./http";

export async function getHealth(): Promise<{ status: string }> {
  return getJson("/health");
}

export async function signup(body: SignupRequest): Promise<UserPublic> {
  return postJson<UserPublic, SignupRequest>("/auth/signup", body);
}

export async function login(
  email: string,
  password: string,
): Promise<TokenResponse> {
  return postJson<TokenResponse, { email: string; password: string }>(
    "/auth/login",
    { email, password },
  );
}

export async function getMe(token: string): Promise<UserPublic> {
  return getJson<UserPublic>("/auth/me", token);
}

export async function updateProfile(
  token: string,
  body: UserProfileUpdate,
): Promise<UserPublic> {
  return patchJson<UserPublic, UserProfileUpdate>("/users/me", body, token);
}

/** Atualiza a URL do avatar (após upload externo, ex.: UploadThing). */
export async function updateAvatarUrl(
  token: string,
  avatarUrl: string,
): Promise<UserPublic> {
  return patchJson<UserPublic, { avatar_url: string }>(
    "/users/me/avatar",
    { avatar_url: avatarUrl },
    token,
  );
}

/** Multipart legado — mantido temporariamente para compatibilidade. */
export async function uploadAvatar(
  token: string,
  file: File,
): Promise<UserPublic> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<UserPublic>("/users/me/avatar", {
    method: "POST",
    body,
    token,
  });
}

export async function deactivateAccount(token: string): Promise<UserPublic> {
  return apiRequest<UserPublic>("/users/me/deactivate", {
    method: "POST",
    token,
  });
}

export async function reactivateAccount(token: string): Promise<UserPublic> {
  return apiRequest<UserPublic>("/users/me/reactivate", {
    method: "POST",
    token,
  });
}

export async function getWalletBalance(token: string): Promise<WalletBalanceResponse> {
  return getJson<WalletBalanceResponse>("/wallet/balance", token);
}

export async function getWalletTransactions(
  token: string,
): Promise<TransactionOut[]> {
  return getJson<TransactionOut[]>("/wallet/transactions", token);
}

export async function getMyTickets(
  token: string,
  status?: "active" | "sold_out" | "finished" | "canceled",
): Promise<MyTicketOut[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return getJson<MyTicketOut[]>(`/users/me/tickets${q}`, token);
}

export async function getNotifications(
  token: string,
  params?: { unread_only?: boolean; limit?: number; offset?: number },
): Promise<NotificationOut[]> {
  const search = new URLSearchParams();
  if (params?.unread_only) search.set("unread_only", "true");
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.offset != null) search.set("offset", String(params.offset));
  const q = search.toString() ? `?${search}` : "";
  return getJson<NotificationOut[]>(`/users/me/notifications${q}`, token);
}

export async function getUnreadNotificationsCount(
  token: string,
): Promise<{ unread_count: number }> {
  return getJson<{ unread_count: number }>(
    "/users/me/notifications/unread-count",
    token,
  );
}

export async function markNotificationRead(
  token: string,
  notificationId: string,
): Promise<NotificationOut> {
  return patchJson<NotificationOut, Record<string, never>>(
    `/users/me/notifications/${encodeURIComponent(notificationId)}/read`,
    {},
    token,
  );
}

export async function markAllNotificationsRead(
  token: string,
): Promise<{ message: string }> {
  return postJson<{ message: string }, Record<string, never>>(
    "/users/me/notifications/read-all",
    {},
    token,
  );
}

export type MockPixIntentBody = {
  amount: string | number;
  gateway_reference: string;
};

export type AbandonPixDepositBody = {
  gateway_reference: string;
};

/** Marca depósito Pix pendente como cancelado (ex.: usuário clicou «Parar de aguardar»). */
export async function postAbandonWalletPixDeposit(
  token: string,
  body: AbandonPixDepositBody,
): Promise<{ message: string; status: string }> {
  return postJson<{ message: string; status: string }, AbandonPixDepositBody>(
    "/wallet/abandon-pix-deposit",
    body,
    token,
  );
}

export async function postMockPixIntent(
  token: string,
  body: MockPixIntentBody,
): Promise<PixIntentResponse> {
  const refPrefix =
    body.gateway_reference.length > 12
      ? `${body.gateway_reference.slice(0, 8)}…`
      : body.gateway_reference;
  try {
    const res = await postJson<PixIntentResponse, MockPixIntentBody>(
      "/wallet/mock-pix-intent",
      body,
      token,
    );
    logWalletPixIntentOk({
      provider: res.provider,
      gatewayRefPrefix: refPrefix,
      paymentId: res.mercado_pago?.payment_id ?? null,
      amount: body.amount,
    });
    return res;
  } catch (e) {
    if (e instanceof ApiError) {
      const snippet =
        e.body && typeof e.body === "object"
          ? JSON.stringify(e.body).slice(0, 400)
          : String(e.body ?? "").slice(0, 400);
      logWalletPixIntentError({
        status: e.status,
        detail: e.detail,
        gatewayRefPrefix: refPrefix,
        bodySnippet: snippet,
      });
    } else {
      logWalletPixIntentError({
        status: 0,
        detail: e instanceof Error ? e.message : String(e),
        gatewayRefPrefix: refPrefix,
      });
    }
    throw e;
  }
}

export async function getRaffles(params?: {
  status?: RaffleStatusApi;
}): Promise<RaffleListOut[]> {
  const q = params?.status
    ? `?status=${encodeURIComponent(params.status)}`
    : "";
  return getJson<RaffleListOut[]>(`/raffles${q}`);
}

export async function getRaffleById(id: string): Promise<RaffleDetailOut> {
  return getJson<RaffleDetailOut>(`/raffles/${encodeURIComponent(id)}`);
}

/** Público: countdown + segmentos da roleta; dispara sorteio automático quando chega a hora. */
export async function getPublicLiveDraw(raffleId: string): Promise<PublicLiveDrawOut> {
  return getJson<PublicLiveDrawOut>(`/raffles/${encodeURIComponent(raffleId)}/live-draw`);
}

export async function getHallOfFame(): Promise<HallOfFameEntryOut[]> {
  return getJson<HallOfFameEntryOut[]>("/raffles/hall-of-fame");
}

/** Posição do utilizador no ranking por categoria (`token` omitido = convidado). */
export async function getRankingMe(
  category: RankingCategoryApi,
  token?: string | null,
): Promise<RankingMeOut> {
  const q = new URLSearchParams({ category });
  return getJson<RankingMeOut>(`/rankings/me?${q.toString()}`, token ?? undefined);
}

/** Top do pódio por categoria (público). */
export async function getRankingTop(
  category: RankingCategoryApi,
  limit = 5,
): Promise<RankingPodiumEntryOut[]> {
  const q = new URLSearchParams({
    category,
    limit: String(limit),
  });
  return getJson<RankingPodiumEntryOut[]>(`/rankings/top?${q.toString()}`);
}

export async function getRecentPurchasePulses(): Promise<
  RecentPurchasePulseOut[]
> {
  return getJson<RecentPurchasePulseOut[]>("/recent-purchase-pulses");
}

export async function buyTicket(
  token: string,
  body: TicketPurchaseRequest,
): Promise<TicketPurchaseResponse> {
  return postJson<TicketPurchaseResponse, TicketPurchaseRequest>(
    "/buy-ticket",
    body,
    token,
  );
}

export async function reserveRaffleTickets(
  token: string,
  body: { raffle_id: string; ticket_numbers: number[] },
): Promise<ReserveRaffleTicketsResponse> {
  return postJson<ReserveRaffleTicketsResponse, typeof body>(
    "/checkout/reserve-tickets",
    body,
    token,
  );
}

export async function completeReservationWallet(
  token: string,
  payment_hold_id: string,
): Promise<{ ok: boolean; new_balance: string }> {
  return postJson<
    { ok: boolean; new_balance: string },
    { payment_hold_id: string }
  >("/checkout/complete-reservation-wallet", { payment_hold_id }, token);
}

export type ReservationPixIntentResponse = PixIntentResponse & {
  transaction_id?: string;
  payment_hold_id?: string;
  amount?: string;
};

export async function postReservationPixIntent(
  token: string,
  body: { payment_hold_id: string; gateway_reference: string },
): Promise<ReservationPixIntentResponse> {
  return postJson<ReservationPixIntentResponse, typeof body>(
    "/checkout/reservation-pix-intent",
    body,
    token,
  );
}

export async function getReservationStatus(
  token: string,
  holdId: string,
): Promise<ReservationStatusOut> {
  return getJson<ReservationStatusOut>(
    `/checkout/reservation/${encodeURIComponent(holdId)}/status`,
    token,
  );
}

/** Libertação imediata dos números (cancelar compra / desistência). */
export async function releaseReservation(
  token: string,
  holdId: string,
): Promise<{ released: number }> {
  return postJson<{ released: number }, Record<string, never>>(
    `/checkout/reservation/${encodeURIComponent(holdId)}/release`,
    {},
    token,
  );
}

export async function adminListReservations(
  token: string,
): Promise<AdminReservationsListOut> {
  return getJson<AdminReservationsListOut>(
    "/api/v1/admin/reservations",
    token,
  );
}

export async function adminDeleteRaffleTransactionRecord(
  token: string,
  transactionId: string,
): Promise<void> {
  await deleteRequest(
    `/api/v1/admin/transactions/${encodeURIComponent(transactionId)}`,
    token,
  );
}

export async function adminConfirmReservation(
  token: string,
  holdId: string,
): Promise<{ ok: boolean }> {
  return postJson<{ ok: boolean }, Record<string, never>>(
    `/api/v1/admin/reservations/${encodeURIComponent(holdId)}/confirm`,
    {},
    token,
  );
}

export async function adminCancelReservation(
  token: string,
  holdId: string,
): Promise<{ released_tickets: number }> {
  return postJson<{ released_tickets: number }, Record<string, never>>(
    `/api/v1/admin/reservations/${encodeURIComponent(holdId)}/cancel`,
    {},
    token,
  );
}

export async function adminCreateRaffle(
  token: string,
  body: AdminRaffleCreate,
): Promise<AdminRaffleOut> {
  return postJson<AdminRaffleOut, AdminRaffleCreate>(
    "/api/v1/admin/raffles",
    body,
    token,
  );
}

export async function adminGetRaffle(
  token: string,
  raffleId: string,
): Promise<AdminRaffleOut> {
  return getJson<AdminRaffleOut>(
    `/api/v1/admin/raffles/${encodeURIComponent(raffleId)}`,
    token,
  );
}

export type RaffleUpdateBody = {
  title?: string;
  image_url?: string | null;
  video_id?: string | null;
  total_price?: number;
  total_tickets?: number;
  featured_tier?: "featured" | "carousel" | "none";
  steam_redemption_code?: string | null;
};

export async function adminUpdateRaffle(
  token: string,
  raffleId: string,
  body: RaffleUpdateBody,
): Promise<AdminRaffleOut> {
  return putJson<AdminRaffleOut, RaffleUpdateBody>(
    `/api/v1/admin/raffles/${encodeURIComponent(raffleId)}`,
    body,
    token,
  );
}

export async function adminPatchFeaturedTier(
  token: string,
  raffleId: string,
  featured_tier: "featured" | "carousel" | "none",
): Promise<AdminRaffleOut> {
  return patchJson<AdminRaffleOut, { featured_tier: typeof featured_tier }>(
    `/api/v1/admin/raffles/${encodeURIComponent(raffleId)}/featured-tier`,
    { featured_tier },
    token,
  );
}

export async function adminCancelRaffle(
  token: string,
  raffleId: string,
): Promise<RaffleCancelResponse> {
  return postJson<RaffleCancelResponse, Record<string, never>>(
    `/api/v1/admin/raffles/${raffleId}/cancel`,
    {},
    token,
  );
}

export async function adminDeleteRaffle(
  token: string,
  raffleId: string,
): Promise<void> {
  await deleteRequest(`/api/v1/admin/raffles/${raffleId}`, token);
}

export async function adminGetWheelSegments(
  token: string,
  raffleId: string,
): Promise<AdminWheelSegmentsOut> {
  return getJson<AdminWheelSegmentsOut>(
    `/api/v1/admin/raffles/${encodeURIComponent(raffleId)}/wheel-segments`,
    token,
  );
}

export async function adminDrawRandom(
  token: string,
  raffleId: string,
): Promise<AdminDrawRandomOut> {
  return postJson<AdminDrawRandomOut, Record<string, never>>(
    `/api/v1/admin/raffles/${encodeURIComponent(raffleId)}/draw-random`,
    {},
    token,
  );
}

export async function adminListUsers(token: string): Promise<UserPublic[]> {
  return getJson<UserPublic[]>("/api/v1/admin/users", token);
}

export async function adminPatchUser(
  token: string,
  userId: string,
  body: AdminUserPatch,
): Promise<UserPublic> {
  return patchJson<UserPublic, AdminUserPatch>(
    `/api/v1/admin/users/${encodeURIComponent(userId)}`,
    body,
    token,
  );
}

export async function adminAdjustBalance(
  token: string,
  userId: string,
  body: AdminWalletAdjust,
): Promise<AdminWalletAdjustResponse> {
  return postJson<AdminWalletAdjustResponse, AdminWalletAdjust>(
    `/api/v1/admin/users/${userId}/adjust-balance`,
    body,
    token,
  );
}

export async function postIgdbGame(
  body: IgdbGameUrlRequest,
): Promise<IgdbGameInfoResponse> {
  return postJson<IgdbGameInfoResponse, IgdbGameUrlRequest>(
    "/igdb/game",
    body,
  );
}
