import { ErrorBody } from "@/types/error";
import { getUrl, hasSessionHint } from "../utils";
import { ApiError } from "@/lib/api-error";
export { ApiError }; // keeps old imports working

const TIMEOUT_MS = 8000;

// Sent when the session cannot be renewed. AuthHydrator listens to it
// and marks the user as logged out in the cache.
export const SESSION_EXPIRED_EVENT = "auth:session-expired";


// A 401 on login, register, etc. means "wrong credentials", not "expired token".
// Only /auth/me can be a real expired token, so it is allowed to refresh.
const canRefresh = (path: string) => !path.startsWith("/auth/") || path === "/auth/me";

// Raw fetch on purpose: it must not go through api() (no refresh loop)
async function refreshTokens() {
  const res = await fetch(getUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new ApiError(res.status, "Session expired");
}

// Only one refresh at a time: every 401 request waits for the same promise
let refreshPromise: Promise<void> | null = null;

function refreshOnce() {
  refreshPromise ??= refreshTokens().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

// One network call: cookies, JSON header (only with a body), timeout
function send(path: string, init?: RequestInit) {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(getUrl(path), {
    credentials: "include",
    ...init,
    headers,
    // keep the caller's signal (TanStack cancel) and add our timeout
    signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
  });
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    let res = await send(path, init);
    
    // Expired access token or missing session
    if (res.status === 401 && canRefresh(path)) {
      if (hasSessionHint()) {
        // Tab thinks it's logged in. Try to refresh.
        try {
          await refreshOnce();
        } catch {
          window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
          throw new ApiError(401, "Session expired. Please log in again.");
        }
        res = await send(path, init); // Retry original request
      }
      // else {
      //   // Tab 1 just discovered Tab 2 logged out. 
      //   // Dispatch the event to wipe the React Query cache instantly.
      //   window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      //   throw new ApiError(401, "Session expired.");
      // }
    }

    if (!res.ok) {
      const body: ErrorBody | null = await res.json().catch(() => null);
      const message = Array.isArray(body?.message)
        ? body.message.join(", ")
        : (body?.message ?? `API error ${res.status}`);
      throw new ApiError(res.status, message);
    }

    // 204 or empty body: nothing to parse
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError(504, "Request timed out.");
    }
    throw err;
  }
}

// Shortcut for JSON POST requests
export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });