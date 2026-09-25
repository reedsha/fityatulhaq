/**
 * HTTP client for the Express backend.
 *
 * The session lives in httpOnly cookies owned by the server, so this module
 * never reads or writes a token: `credentials: "include"` on every request is
 * what makes the browser attach them. Cookies managed by server-side Set-Cookie
 * headers; `request()` always includes credentials.
 */

const DEFAULT_API_BASE_URL = "http://localhost:4000/api/v1";

/** Client-side error codes raised by this module. */
export const CLIENT_ERROR = {
  AUTHENTICATION_EXPIRED: "AUTHENTICATION_EXPIRED",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
} as const;

/** Backend codes that mean "the session is over" rather than "the input was wrong". */
const SESSION_ENDED_CODES = ["UNAUTHORIZED", "TOKEN_EXPIRED", "TOKEN_REVOKED"];

export interface ApiErrorEnvelope {
  code: string;
  message: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorEnvelope;
  pagination?: Pagination;
}

/**
 * What the auth endpoints return now that the session is cookie-based: the
 * refresh token only ever exists as an httpOnly cookie, and the access token is
 * echoed in the body for server-to-server callers.
 */
export interface AccessTokenResponse {
  accessToken: string;
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

function defaultMessageForStatus(status: number): string {
  if (status === 429) {
    return "พยายามหลายครั้งเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง";
  }

  if (status === 403) {
    return "คุณไม่มีสิทธิ์ดำเนินการนี้";
  }

  if (status === 404) {
    return "เราไม่พบสิ่งที่คุณกำลังมองหา";
  }

  if (status >= 500) {
    return "เซิร์ฟเวอร์เกิดปัญหา กรุณาลองอีกครั้งในไม่ช้า";
  }

  return "เกิดข้อผิดพลาดบางอย่าง กรุณาลองอีกครั้ง";
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

/** The header set shared by both transports. */
function requestHeaders(extra?: HeadersInit): Headers {
  return new Headers(extra);
}

/** Performs the call, normalising transport failures into an `ApiError`. */
async function send(fullUrl: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(fullUrl, options);
  } catch {
    throw new ApiError(
      CLIENT_ERROR.UNEXPECTED_ERROR,
      "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
      0,
    );
  }
}

/**
 * Applies the response contract shared by every call in this module:
 *
 * - 401 raises `ApiError` — its own code when the backend supplied a domain one
 *   (a wrong password stays `INVALID_CREDENTIALS`), otherwise
 *   `AUTHENTICATION_EXPIRED` for a session that simply ended.
 * - Other 4xx/5xx responses raise `ApiError` carrying the backend's `error.code`.
 *
 * Split out of `unwrap` so the paginated transport below enforces exactly the
 * same rules; two copies would eventually disagree about 401.
 */
function assertResponseOk(response: Response, envelope: ApiEnvelope<unknown> | null): void {
  if (response.status === 401) {
    const code = envelope?.error?.code;
    const message = envelope?.error?.message;

    // Cookies are the server's to clear: a 401 here means the access cookie is
    // gone or rejected, and the refresh cookie may still be perfectly good, so
    // nothing is torn down client-side.
    //
    // A domain 401 — a wrong password, a revoked token — carries its own code and
    // keeps it, so the form can point at the right field. A bare or generic 401
    // is a session that simply ended.
    if (typeof code === "string" && code.length > 0 && !SESSION_ENDED_CODES.includes(code)) {
      throw new ApiError(code, message ?? defaultMessageForStatus(401), 401);
    }

    throw new ApiError(
      CLIENT_ERROR.AUTHENTICATION_EXPIRED,
      "เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
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
}

/**
 * Unwraps the success envelope. A data-less success resolves to null.
 */
async function unwrap<T>(response: Response): Promise<T> {
  const envelope = await readEnvelope(response);

  assertResponseOk(response, envelope);

  return (envelope?.data ?? null) as T;
}

/**
 * Performs a JSON request against the backend and unwraps the success envelope.
 */
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = requestHeaders(options.headers);
  headers.set("Content-Type", "application/json");

  const response = await send(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  return unwrap<T>(response);
}

/**
 * Performs a multipart request and unwraps the success envelope.
 *
 * `Content-Type` is deliberately left unset: a `FormData` body needs the browser
 * to add a matching `boundary`, and setting the header by hand would make the
 * body unparseable on the server.
 */
export async function requestMultipart<T>(endpoint: string, formData: FormData): Promise<T> {
  const response = await send(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: requestHeaders(),
    body: formData,
    credentials: "include",
  });

  return unwrap<T>(response);
}

/** A list response: the rows plus where they sit in the whole set. */
export interface PaginatedResponse<T> {
  data: T;
  /**
   * Null when the endpoint answered without a pager block. Callers should treat
   * that as "these are all the rows", never as "page 1 of unknown" — inventing a
   * total would let the UI offer a next page that does not exist.
   */
  pagination: Pagination | null;
}

/**
 * Performs a JSON request against a paginated list endpoint.
 *
 * Separate from `request` only because the envelope's `pagination` block has to
 * survive: `request` resolves to `data` alone, which is the right shape for a
 * single resource and lossy for a page of them.
 */
export async function requestPaginated<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<PaginatedResponse<T>> {
  const headers = requestHeaders(options.headers);
  headers.set("Content-Type", "application/json");

  const response = await send(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const envelope = await readEnvelope(response);

  assertResponseOk(response, envelope);

  return {
    data: (envelope?.data ?? null) as T,
    pagination: envelope?.pagination ?? null,
  };
}
