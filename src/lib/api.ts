import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  type StoredAuthSession,
} from "./authSession";

interface ApiFetchOptions extends Omit<RequestInit, "body" | "headers"> {
  json?: unknown;
  auth?: boolean;
  token?: string;
  headers?: HeadersInit;
}

export interface ApiError extends Error {
  status: number;
  payload?: unknown;
}

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBaseUrl =
  import.meta.env.DEV || typeof window === "undefined"
    ? "http://localhost:3000"
    : window.location.origin;
const API_BASE_URL = (configuredApiBaseUrl || defaultApiBaseUrl).replace(
  /\/+$/,
  "",
);

function buildHeaders(token?: string, headers?: HeadersInit, hasJson?: boolean) {
  const nextHeaders = new Headers(headers);

  if (hasJson) {
    nextHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    nextHeaders.set("Authorization", `Bearer ${token}`);
  }

  return nextHeaders;
}

function buildUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshSession(): Promise<string | null> {
  const session = loadAuthSession();
  if (!session?.refreshToken) {
    clearAuthSession();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(buildUrl("/api/auth/refresh"), {
        method: "POST",
        headers: buildHeaders(undefined, undefined, true),
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      }).catch(() => null);

      if (!response || !response.ok) {
        clearAuthSession();
        return null;
      }

      const payload = (await response.json()) as {
        token: string;
        refreshToken: string;
        user: StoredAuthSession["user"];
      };

      saveAuthSession({
        token: payload.token,
        refreshToken: payload.refreshToken,
        user: payload.user,
      });

      return payload.token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  { json, auth, token, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const attemptFetch = async (authToken?: string) => {
    try {
      return await fetch(buildUrl(path), {
        ...init,
        headers: buildHeaders(authToken, headers, json !== undefined),
        body: json === undefined ? undefined : JSON.stringify(json),
      });
    } catch {
      const error = new Error(
        "A backend API jelenleg nem elerheto. Ellenorizd, hogy a szerver fut-e.",
      ) as ApiError;
      error.status = 0;
      throw error;
    }
  };

  const session = auth ? loadAuthSession() : null;
  const initialToken = token ?? session?.token;
  let response = await attemptFetch(initialToken);

  const canRefresh =
    response.status === 401 &&
    (auth || Boolean(token)) &&
    !path.startsWith("/api/auth/login") &&
    !path.startsWith("/api/auth/register") &&
    !path.startsWith("/api/auth/refresh") &&
    !path.startsWith("/api/auth/password/reset");

  if (canRefresh) {
    const nextToken = await tryRefreshSession();
    if (nextToken) {
      response = await attemptFetch(nextToken);
    }
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(
      (payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string" &&
        payload.message) ||
        "A keres nem sikerult.",
    ) as ApiError;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload as T;
}
