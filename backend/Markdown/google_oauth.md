## Google OAuth 2.0 (SSO Upsert Flow)

The system implements a seamless **SSO Upsert (Update/Insert)** flow. Users do not need to choose between "Sign Up" and "Sign In"; a single Google login button intelligently routes them based on their database footprint. This flow is secured using PKCE (Proof Key for Code Exchange) combined with a stateless JWT vault.

```text
+-----------+             +-------------+             +--------------+            +------------+
|           |             |             |             |              |            |            |
|  Client   |             | API Gateway |             | Auth Service |            | PostgreSQL |
| (Browser) |             |  (NestJS)   |             |  (RabbitMQ)  |            |  (Prisma)  |
+-----------+             +-------------+             +--------------+            +------------+

=================================== 1. THE AUTHORIZATION ===================================
      |                          |
      | GET /google/login        |
      |------------------------->| Generate PKCE (Challenge & Verifier)
      |                          | Generate State & Nonce
      |                          | Sign JWT Vault (10m TTL, purpose: 'google-oauth')
      | <--- 302 to Google ------| Set-Cookie: OAUTH_COOKIE=<JWT Vault>
      |                          |

================================== 2. THE CRYPTOGRAPHIC EXCHANGE ===========================
      |                          |
      | GET /google/callback     |
      | ?code=...&state=...      |
      | + OAUTH_COOKIE           |
      |------------------------->| Verify JWT Vault Signature
      |                          | Assert URL State === Vault State (CSRF check)
      |                          | Exchange Code + Vault Verifier with Google
      |                          | Assert Google Nonce === Vault Nonce (Replay check)
      |                          | RPC: AUTH_PATTERNS.OAUTH_LOGIN
      |                          |-------------------------->|

======================================= 3. SSO UPSERT ======================================
      |                          |                           |                          |
      |                          |                           | BEGIN TRANSACTION        |
      |                          |                           | 1. Find by Google ID     |
      |                          |                           | 2. Find by Email (Link)  |
      |                          |                           | 3. Create New Account    |
      |                          |                           | COMMIT TRANSACTION       |
      |                          |                           |------------------------->|
      |                          | <--- { User, JWT, RT } ---|                          |
      | <--- 302 to Frontend ----|                           |                          |
      |      (JWT & RT Cookies)  |                           |                          |

```

### The Upsert Logic & Race Condition Mitigation

The Auth Service processes the verified Google profile through a strict transactional hierarchy. To prevent Time-of-Check to Time-of-Use (TOCTOU) race conditions (such as a user double-clicking the login button causing unique constraint violations), the entire block is wrapped in a 3-attempt retry loop:

1. **Identity Match (Sign-In):** If the Google `subject` ID already exists in the `Identity` table, the user is logged in instantly.
2. **Email Match (Account Linking):** If the Google ID is unknown, but the verified Google email matches an existing manual account, a new `Identity` row is created and linked to the existing user. This safely merges their authentication methods.
3. **New User (Sign-Up):** If neither exists, the system strips special characters from their email prefix to generate a unique `login` (appending a random hex string if a collision occurs) and inserts a brand new account alongside their Google Identity.

### Security Mechanisms in the OAuth Flow

#### 1. The JWT Vault (Stateless PKCE & CSRF Protection)

Traditional OAuth flows require a stateful database or Redis cache to store the `state`, `nonce`, and `codeVerifier` while the user is interacting with the Google consent screen. Our system relies on a **Stateless JWT Vault**.
These secrets are cryptographically signed into a JWT and sent to the browser as a temporary, 10-minute `HttpOnly` cookie. When Google redirects the user back to the Gateway, the Gateway verifies the cookie's signature. This guarantees the cryptographic secrets are completely tamper-proof and mathematically ties the callback to the exact browser that initiated the request, neutralizing CSRF and Confused Deputy attacks.

#### 2. The "Impossible Password" Defense

Because the PostgreSQL database schema enforces a strict `NOT NULL` constraint on the `password_hash` column, accounts created via Google must have a value inserted.
Instead of generating a valid Argon2 hash, the Auth Service generates 32 bytes of random hex (`randomBytes(32).toString('hex')`). If a Google-registered user attempts to bypass SSO by using the manual email/password login form, the underlying Argon2 verification function will instantly throw a format error (as it strictly expects an `$argon2id$` prefix). This error is safely caught and returns `false`, mathematically locking the user out of manual password guessing and enforcing the OAuth flow.