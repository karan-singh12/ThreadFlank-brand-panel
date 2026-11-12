import { API_BASE_URL, API_TIMEOUT_MS } from "./config";

/** Success envelope produced by the backend's TransformInterceptor. */
export type ApiResponse<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: { requestId?: string; version?: string; pagination?: unknown };
  timestamp: string;
};

export type ApiFieldError = { field: string; message: string };

/** Error envelope produced by the backend's HttpExceptionFilter. */
type ApiErrorBody = {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  errors?: ApiFieldError[];
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: ApiFieldError[];

  constructor(status: number, message: string, fieldErrors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** Status 0 means the request never got a response (offline, DNS, CORS, timeout). */
  get isNetworkError() {
    return this.status === 0;
  }
}

function friendlyServerMessage(status: number) {
  if (status === 502 || status === 503 || status === 504) {
    return "Our servers are busy right now. Please try again in a moment.";
  }
  return "Something went wrong on our side. Please try again in a moment.";
}

/** Registered by the auth feature: swaps an expired access token for a new one, or returns null. */
let refreshToken: (() => Promise<string | null>) | null = null;
export function setTokenRefresher(fn: () => Promise<string | null>) {
  refreshToken = fn;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Internal: set once a request has been retried after a token refresh. */
  retried?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = "GET", body, token, signal, timeoutMs = API_TIMEOUT_MS } = options;

  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  // FormData sets its own multipart boundary header; everything else is JSON.
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal: combined,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    const timedOut = timeout.aborted;
    throw new ApiError(
      0,
      timedOut ? "The server took too long to respond. Please try again." : "Can't reach the server. Check your connection and try again."
    );
  }

  // An expired access token: get a fresh one once and replay the request.
  if (response.status === 401 && token && refreshToken && !options.retried) {
    const fresh = await refreshToken();
    if (fresh) return apiRequest<T>(path, { ...options, token: fresh, retried: true });
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || (payload && payload.success === false)) {
    const errorBody = payload as ApiErrorBody | null;
    // 5xx messages are server internals, not copy for users — log them for
    // debugging and show a friendly line instead.
    if (response.status >= 500) {
      console.error(`[api] ${method} ${path} → ${response.status}`, errorBody?.message);
      throw new ApiError(response.status, friendlyServerMessage(response.status));
    }
    throw new ApiError(
      response.status,
      errorBody?.message || response.statusText || "Something went wrong. Please try again.",
      errorBody?.errors ?? []
    );
  }

  return payload as ApiResponse<T>;
}
