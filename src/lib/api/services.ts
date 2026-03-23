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
  RaffleCancelResponse,
  RafflePublic,
  RaffleStatusApi,
  SignupRequest,
  TicketPurchaseRequest,
  TicketPurchaseResponse,
  TokenResponse,
  TransactionOut,
  UserPublic,
  WalletBalanceResponse,
} from "@/types/api";
import { deleteRequest, getJson, postJson } from "./http";

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

export async function getWalletBalance(token: string): Promise<WalletBalanceResponse> {
  return getJson<WalletBalanceResponse>("/wallet/balance", token);
}

export async function getWalletTransactions(
  token: string,
): Promise<TransactionOut[]> {
  return getJson<TransactionOut[]>("/wallet/transactions", token);
}

export type MockPixIntentBody = {
  amount: string | number;
  gateway_reference: string;
};

export async function postMockPixIntent(
  token: string,
  body: MockPixIntentBody,
): Promise<unknown> {
  return postJson("/wallet/mock-pix-intent", body, token);
}

export async function getRaffles(params?: {
  status?: RaffleStatusApi;
}): Promise<RafflePublic[]> {
  const q = params?.status
    ? `?status=${encodeURIComponent(params.status)}`
    : "";
  return getJson<RafflePublic[]>(`/raffles${q}`);
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
  return postJson<RafflePublic, AdminRaffleCreate>("/admin/raffles", body, token);
}

export async function adminCancelRaffle(
  token: string,
  raffleId: string,
): Promise<RaffleCancelResponse> {
  return postJson<RaffleCancelResponse, Record<string, never>>(
    `/admin/raffles/${raffleId}/cancel`,
    {},
    token,
  );
}

export async function adminDeleteRaffle(
  token: string,
  raffleId: string,
): Promise<void> {
  await deleteRequest(`/admin/raffles/${raffleId}`, token);
}

export async function adminAdjustBalance(
  token: string,
  userId: string,
  body: AdminWalletAdjust,
): Promise<AdminWalletAdjustResponse> {
  return postJson<AdminWalletAdjustResponse, AdminWalletAdjust>(
    `/admin/users/${userId}/adjust-balance`,
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
