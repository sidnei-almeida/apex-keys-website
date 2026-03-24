/**
 * Chamadas tipadas à API — usar a partir de Server Components, Route Handlers
 * ou Client Components (CORS deve permitir a origem do Next).
 *
 * @see FRONTEND_API.md
 */
import type {
  AdminRaffleCreate,
  AdminWalletAdjust,
  AdminWalletAdjustResponse,
  IgdbGameInfoResponse,
  IgdbGameUrlRequest,
  MyTicketOut,
  NotificationOut,
  PixIntentResponse,
  RaffleCancelResponse,
  RaffleDetailOut,
  RaffleListOut,
  RafflePublic,
  RaffleStatusApi,
  SignupRequest,
  TicketPurchaseRequest,
  TicketPurchaseResponse,
  TokenResponse,
  TransactionOut,
  UserProfileUpdate,
  UserPublic,
  WalletBalanceResponse,
} from "@/types/api";
import { deleteRequest, getJson, patchJson, postJson, putJson } from "./http";

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

export async function postMockPixIntent(
  token: string,
  body: MockPixIntentBody,
): Promise<PixIntentResponse> {
  return postJson<PixIntentResponse, MockPixIntentBody>(
    "/wallet/mock-pix-intent",
    body,
    token,
  );
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

export async function adminCreateRaffle(
  token: string,
  body: AdminRaffleCreate,
): Promise<RafflePublic> {
  return postJson<RafflePublic, AdminRaffleCreate>(
    "/api/v1/admin/raffles",
    body,
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
};

export async function adminUpdateRaffle(
  token: string,
  raffleId: string,
  body: RaffleUpdateBody,
): Promise<RafflePublic> {
  return putJson<RafflePublic, RaffleUpdateBody>(
    `/api/v1/admin/raffles/${encodeURIComponent(raffleId)}`,
    body,
    token,
  );
}

export async function adminPatchFeaturedTier(
  token: string,
  raffleId: string,
  featured_tier: "featured" | "carousel" | "none",
): Promise<RafflePublic> {
  return patchJson<RafflePublic, { featured_tier: typeof featured_tier }>(
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
