export const COOKIE_PATH = '/api/v1/auth';
export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
export const LOGGED_IN_COOKIE = 'logged_in';
export const ACCESS_TTL_SECONDS = 240 * 60;          // Time To Live => 15 minutes
export const REFRESH_TTL_SECONDS = 7 * 24 * 3600;   // Time To Live => 7 days

export const OAUTH_COOKIE_PATH = '/api/v1/auth/google';
export const OAUTH_COOKIE = 'oauth_state';
export const OAUTH_TTL_SECONDS = 10 * 60_000;            // Time To Live => 10 minutes
export const OAUTH_AUDIENCE = 'google-oauth';

export const REQUEST_LIMIT = 1000;  // Max number of requests per 10 minutes for rate limiting
export const REQUEST_TTL = 1 * 60 * 1000;     // Time To Live  => 1 minutes for rate limiting
