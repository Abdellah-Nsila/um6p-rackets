import { ACCESS_COOKIE, ACCESS_TTL_SECONDS, COOKIE_PATH, LOGGED_IN_COOKIE, REFRESH_COOKIE, REFRESH_TTL_SECONDS } from "@app/common";
import { AuthTokens } from "@app/contracts";
import { CookieOptions, Response } from "express";

const base = (maxAgeSec: number, path: string, httpOnly: boolean = true): CookieOptions => ({
  httpOnly: httpOnly,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path,
  maxAge: maxAgeSec * 1000,
});

export function setCookie(res: Response, name: string, value: string, maxAgeSec: number, path: string) {
  res.cookie(name, value, base(maxAgeSec, path));
}

export function clearCookie(res: Response, name: string, path: string) {
  res.clearCookie(name, { path });
}

export function setAuthCookies(res: Response, t: AuthTokens) {
  res.cookie(ACCESS_COOKIE, t.access_token, base(ACCESS_TTL_SECONDS, '/'));
  res.cookie(REFRESH_COOKIE, t.refresh_token, base(REFRESH_TTL_SECONDS, COOKIE_PATH));
  res.cookie(LOGGED_IN_COOKIE, 'true', base(REFRESH_TTL_SECONDS, '/', false));
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });   // path must match
  res.clearCookie(LOGGED_IN_COOKIE, { path: '/' });
}