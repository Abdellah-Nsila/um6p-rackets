# Enterprise Authentication Architecture

This document outlines the authentication architecture used in our microservices ecosystem. The system implements **Automatic Token Rotation with Theft Detection**, a production-grade security standard designed to protect user sessions against cross-site scripting (XSS), token theft, and database breaches.

## Overview

The authentication system utilizes a **Dual-Token Strategy** split between an API Gateway and an internal Authentication Microservice. 

1. **Access Token (JWT - 15 minutes):** A stateless, short-lived token. Think of this as a temporary hotel room keycard. Because the API Gateway verifies it mathematically (via signature) without querying the database, it is incredibly fast. However, because it cannot be manually revoked, it expires very quickly to minimize the window of attack if intercepted.
2. **Refresh Token (Opaque String - 7 days):** A long-lived, database-backed token. When the 15-minute JWT expires, the client silently sends the Refresh Token to the Auth Service to obtain a new JWT pair. This token provides a seamless user experience while maintaining a server-side "kill switch" for the session.

---

## The Authentication Lifecycle

The following diagram illustrates the flow of data between the Client, the API Gateway, the Auth Service, and the PostgreSQL database.

```text
+-----------+             +-------------+             +--------------+            +------------+
|           |             |             |             |              |            |            |
|  Client   |             | API Gateway |             | Auth Service |            | PostgreSQL |
| (Browser) |             |  (NestJS)   |             |  (RabbitMQ)  |            |  (Prisma)  |
+-----------+             +-------------+             +--------------+            +------------+

==================================== 1. LOGIN (Initial Auth) ===================================
      |                          |                           |                          |
      | POST /login (Creds)      |                           |                          |
      |------------------------->|                           |                          |
      |                          | RPC: AUTH_PATTERNS.LOGIN  |                          |
      |                          |-------------------------->|                          |
      |                          |                           | Fetch User & Verify Hash |
      |                          |                           |------------------------->|
      |                          |                           | Generate JWT (15m)       |
      |                          |                           | Generate Opaque RT (7d)  |
      |                          |                           | INSERT RT (family_id=A)  |
      |                          |                           |------------------------->|
      |                          | <--- { JWT, RT } ---------|                          |
      | <--- Set-Cookie ---------|                           |                          |
      |      (JWT & RT)          |                           |                          |

================================= 2. ACCESS (Stateless API Call) ===============================
      |                          |
      | GET /api/data            |
      | (JWT in Cookie)          |
      |------------------------->|
      |                          | Validate JWT Signature
      |                          | (Local 'JwtAuthGuard')
      |                          | (No Auth Service needed!)
      | <--- 200 OK Data --------|

============================== 3. REFRESH (Rotation & Theft Check) =============================
      |                          |                           |                          |
      | POST /refresh            |                           |                          |
      | (Old RT in Cookie)       |                           |                          |
      |------------------------->|                           |                          |
      |                          | RPC: AUTH_PATTERNS.REFRESH|                          |
      |                          |-------------------------->|                          |
      |                          |                           | SELECT RT WHERE hash     |
      |                          |                           |------------------------->|
      |                          |                           | Check if revoked/expired |
      |                          |                           | UPDATE old RT (revoked)  |
      |                          |                           | INSERT new RT (family A) |
      |                          |                           |------------------------->|
      |                          | <--- { New JWT, New RT } -|                          |
      | <--- Set-Cookie ---------|                           |                          |
      |      (New JWT & RT)      |                           |                          |

====================================== 4. LOGOUT (Revoke) ======================================
      |                          |                           |                          |
      | POST /logout             |                           |                          |
      | (RT in Cookie)           |                           |                          |
      |------------------------->|                           |                          |
      |                          | RPC: AUTH_PATTERNS.LOGOUT |                          |
      |                          |-------------------------->|                          |
      |                          |                           | UPDATE RT WHERE hash     |
      |                          |                           | SET is_revoked = true    |
      |                          |                           |------------------------->|
      |                          | <--- { success: true } ---|                          |
      | <--- Clear-Cookie -------|                           |                          |
      |                          |                           |                          |

```

---

## Security Mechanisms Explained

Our system assumes that networks are hostile and databases can be compromised. We enforce security through three core mechanisms:

### 1. Database Breach Protection (The "Lock and Key")

If an attacker exploits a SQL Injection vulnerability or steals a database backup, they still cannot access user accounts. This is achieved by separating the token into a physical "key" and a mathematical "lock".

* **The Key (Client):** When a user logs in, we generate 48 bytes of pure cryptographic randomness (`randomBytes(48)`). We send this plain string (e.g., `95_0wrkggtq...`) to the user's browser.
* **The Lock (Database):** We *never* store that string in the database. Instead, we run it through a one-way SHA-256 hash function (`createHash('sha256').update(plain).digest('hex')`) and store the resulting hash.

**The Attack Scenario:** If a hacker steals the database, they possess the SHA-256 hashes. If they try to send one of those hashes to our `/refresh` endpoint, our server will automatically hash their input *again*. The resulting "hash of a hash" will not match anything in our database, and the request is immediately rejected. The attacker is completely locked out.

### 2. Automatic Token Reuse Detection (The "Family ID")

Refresh tokens are meant to be used exactly once. When a token is used to get a new pair, it is marked as `is_revoked = true`, and a new token is issued under the same `family_id`.

**The Attack Scenario:** Imagine a hacker intercepts a user's network traffic and steals their active refresh token (**Token A**).

1. The legitimate user opens the app. The app sends **Token A** to the server.
2. The server accepts it, gives the user **Token B**, and marks **Token A** as revoked.
3. An hour later, the hacker tries to use their stolen copy of **Token A**.
4. The server sees that **Token A** is already revoked.

At this point, the server knows *someone* is malicious, but it cannot definitively tell who holds the active **Token B**. To ensure total security, the server instantly revokes **every token sharing that `family_id**`. This securely kills Token B, permanently locking out the hacker. The legitimate user is simply required to log in with their password again.

### 3. Cross-Site Scripting (XSS) Protection

Tokens are never stored in `localStorage` or `sessionStorage`. They are transmitted directly via `Set-Cookie` headers with the `HttpOnly` and `SameSite=lax` flags enabled.

Because `HttpOnly` is active, no JavaScript running in the browser can read the cookies. If a malicious third-party script is somehow injected into the frontend (XSS), it cannot extract the plain-text refresh token or the JWT to send back to the attacker.

```