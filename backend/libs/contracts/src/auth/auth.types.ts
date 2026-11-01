export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export type User = {
  id: number; // bigserial PK
  login: string; // varchar(255) UNIQUE
  first_name: string; // varchar(255)
  last_name: string; // varchar(255)
  gender: boolean | null; // boolean
  department: string | null; // text
  phone_number: string | null; // varchar(50)
  email: string; // varchar(255) UNIQUE
  avatar: string | null; // text
  role: UserRole; // enum('USER', 'ADMIN')
  joined_at: string; // timestamptz
};

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResult extends AuthTokens {
  user: User;
}

export interface HealthResult {
  version: string;
  service: string;
  status: string;
  environment: string;
  timestamp: string;
}

export interface SuccessResult {
  success: boolean;
  message: string;
}

export interface JwtPayload {
  sub: string; // (*Subject*): Unique identifier for the user.
  login: string;
  role: UserRole;
  iat?: number; // (*Issued At*): Unix timestamp of when the token was created.
  exp?: number; // (*Expiration Time*): Unix timestamp when the token expires.
}

export interface RefreshPayload {
  refresh_token: string;
  iat?: number;
  exp?: number;
}

export interface LogoutPayload {
  refresh_token: string;
}
// ==================================== OAuth Payloads ====================================

export interface OAuthAuthorizationPayload {
  url: string;
  token: string;
}

export interface OAuthLoginPayload {
  provider: string; // e.g., "google", "facebook"
  subject: string; // Unique identifier for the user from the OAuth provider
  email: string;
  email_verified: boolean;
  first_name: string;
  last_name: string;
  picture: string;
}

export interface OAuthTx {
  purpose: string;
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
}

export interface GetUserPayload {
  user_id: string;
}

export interface GetUsersByIdsPayload {
  user_ids: string[];
}