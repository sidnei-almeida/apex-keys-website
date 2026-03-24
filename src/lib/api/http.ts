import type { ApiErrorBody } from "@/types/api";
import { apiUrl } from "./config";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  get detail(): string | undefined {
    if (
      this.body &&
      typeof this.body === "object" &&
      "detail" in this.body &&
      typeof (this.body as ApiErrorBody).detail === "string"
    ) {
      return (this.body as ApiErrorBody).detail;
    }
    return undefined;
  }
}

export type ApiRequestOptions = RequestInit & {
  /** JWT access_token (sem prefixo Bearer) */
  token?: string | null;
  /** Quando false, não faz parse JSON (ex.: 204) */
  parseJson?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, parseJson = true, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  const body = rest.body;
  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(apiUrl(path), {
    ...rest,
    headers,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text && parseJson) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "detail" in data &&
      typeof (data as ApiErrorBody).detail === "string"
        ? (data as ApiErrorBody).detail
        : res.statusText;
    throw new ApiError(res.status, data, message);
  }

  return (parseJson ? data : (undefined as T)) as T;
}

export function getJson<T>(path: string, token?: string | null): Promise<T> {
  return apiRequest<T>(path, { method: "GET", token });
}

export function postJson<T, B extends object = object>(
  path: string,
  body: B,
  token?: string | null,
): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
}

export function putJson<T, B extends object = object>(
  path: string,
  body: B,
  token?: string | null,
): Promise<T> {
  return apiRequest<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
    token,
  });
}

export function patchJson<T, B extends object = object>(
  path: string,
  body: B,
  token?: string | null,
): Promise<T> {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    token,
  });
}

/** DELETE sem corpo; respostas 204 / vazias sem parse JSON. */
export function deleteRequest<T = void>(
  path: string,
  token?: string | null,
): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE", token, parseJson: false });
}
