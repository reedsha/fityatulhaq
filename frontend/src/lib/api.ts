/**
 * HTTP client for the Express backend.
 *
 * Phase 1 keeps the access token in `localStorage` for simplicity.
 * TODO(security): replace with httpOnly cookie storage before production.
 */

const DEFAULT_API_BASE_URL = "http://localhost:4000/api/v1";

export const AUTH_TOKEN_KEY = "auth_token";
export const REFRESH_TOKEN_KEY = "auth_refresh_token";

/** Client-side error codes raised by this module. */
export const CLIENT_ERROR = {
  AUTHENTICATION_EXPIRED: "AUTHENTICATION_EXPIRED",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
  STORAGE_UNAVAILABLE: "STORAGE_UNAVAILABLE",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
} as const;

export interface ApiErrorEnvelope {
  code: string;
  message: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorEnvelope;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Error carrying the backend's machine-readable code and HTTP status. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

function stripTrailingSlashes(value: string): string {
  let result = value;

  while (result.endsWith("/")) {
    result = result.slice(0, -1);
  }

  return result;
}

/**
 * `NEXT_PUBLIC_BACKEND_API_URL` is the variable the browser can read;
 * `BACKEND_API_URL` stays as a server-side fallback for future route handlers.
 */
export const API_BASE_URL = stripTrailingSlashes(
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    process.env.BACKEND_API_URL ??
    DEFAULT_API_BASE_URL,
);

function readStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    // Blocked storage reads as "signed out" instead of crashing the page.
    return null;
  }
}

function writeStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorage(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Token helpers — SSR-safe: `localStorage` does not exist on the server. */
export function getAuthToken(): string | null {
  return readStorage(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return readStorage(REFRESH_TOKEN_KEY);
}

/** Returns false when the browser refuses to persist (private mode, blocked storage). */
export function setAuthTokens(tokens: AuthTokens): boolean {
  const accessStored = writeStorage(AUTH_TOKEN_KEY, tokens.accessToken);
  const refreshStored = writeStorage(REFRESH_TOKEN_KEY, tokens.refreshToken);

  return accessStored && refreshStored;
}

export function clearAuthTokens(): void {
  removeStorage(AUTH_TOKEN_KEY);
  removeStorage(REFRESH_TOKEN_KEY);
}

function defaultMessageForStatus(status: number): string {
  if (status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "We could not find what you were looking for.";
  }

  if (status >= 500) {
    return "The server ran into a problem. Please try again shortly.";
  }

  return "Something went wrong. Please try again.";
}

/**
 * Reads the standard envelope. Returns null for bodies that are not JSON — the
 * rate limiter and any proxy error answer with their own shape.
 */
async function readEnvelope(response: Response): Promise<ApiEnvelope<unknown> | null> {
  try {
    const body: unknown = await response.json();

    if (typeof body !== "object" || body === null) {
      return null;
    }

    return body as ApiEnvelope<unknown>;
  } catch {
    // Non-JSON body: nothing to extract, so the caller falls back to the status.
    return null;
  }
}

/**
 * Performs a request against the backend and unwraps the success envelope.
 *
 * - 401 clears the stored tokens and raises `AUTHENTICATION_EXPIRED`.
 * - Other 4xx/5xx responses raise `ApiError` carrying the backend's `error.code`.
 * - Transport failures raise `ApiError` with `UNEXPECTED_ERROR`.
 */
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getAuthToken();

  if (token !== null && token.length > 0) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiError(
      CLIENT_ERROR.UNEXPECTED_ERROR,
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  const envelope = await readEnvelope(response);

  if (response.status === 401) {
    clearAuthTokens();
    throw new ApiError(
      CLIENT_ERROR.AUTHENTICATION_EXPIRED,
      envelope?.error?.message ?? "Your session has expired. Please sign in again.",
      401,
    );
  }

  if (!response.ok) {
    const code =
      envelope?.error?.code ??
      (response.status === 429 ? CLIENT_ERROR.TOO_MANY_REQUESTS : CLIENT_ERROR.UNEXPECTED_ERROR);

    throw new ApiError(
      code,
      envelope?.error?.message ?? defaultMessageForStatus(response.status),
      response.status,
    );
  }

  // Every Phase 1 endpoint returns `data`; a data-less success resolves to null.
  return (envelope?.data ?? null) as T;
}
