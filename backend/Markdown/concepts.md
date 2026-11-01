# 🛡️ Authentication & Security Architecture 

This project implements an enterprise-grade, microservices-based authentication system. Below are the core security concepts, cryptographic strategies, and architectural patterns implemented across the API Gateway and Auth Service.

## 🔐 Token & Session Strategy

* **Hybrid Token Architecture (JWT + Opaque)**
  The system uses stateless JSON Web Tokens (JWTs) for fast, database-free access verification at the API Gateway, paired with stateful, high-entropy (48-byte) opaque refresh tokens. This ensures high performance for continuous requests while maintaining strict server-side control over sessions.

* **Automatic Token Rotation with Theft Detection**
  Every time a refresh token is used, it is revoked and replaced with a new one. Tokens are grouped by a `family_id`. If a malicious actor steals a refresh token and uses it, the user's legitimate client will eventually attempt to use an older, invalidated token. The system detects this token reuse anomaly, assumes the session is compromised, and instantly revokes the entire token family, requiring the user to re-authenticate.

* **Cryptographic Token Hashing**
  Opaque refresh tokens and password reset tokens are never stored in plaintext. They are hashed using `SHA-256` before being saved in PostgreSQL. If the database is ever compromised, attackers cannot reverse the hashes to hijack active user sessions or reset passwords.

## 🛡️ Web Security Mechanisms

* **Cross-Site Scripting (XSS) Prevention**
  By storing both `access_token` and `refresh_token` exclusively in `HttpOnly` cookies, the tokens are completely invisible to JavaScript (`document.cookie`). This guarantees that even if a vulnerability allows malicious scripts to execute on the frontend, the attacker cannot exfiltrate the user's session tokens.

* **Cross-Site Request Forgery (CSRF) Mitigation**
  Tokens are delivered via cookies configured with the `SameSite=Strict` (or `Lax`) attribute. This instructs the browser to never attach the authentication cookies to cross-origin requests, effectively neutralizing CSRF attacks where malicious websites try to trick a logged-in user into executing unwanted actions.

* **Argon2 Password Hashing**
  Instead of older algorithms like `bcrypt` or `PBKDF2`, passwords are secured using `argon2` (the winner of the Password Hashing Competition). It is memory-hard, making it highly resistant to GPU-based brute-force and rainbow table attacks.

* **Side-Channel Timing Attack Mitigation**
  The system prevents attackers from enumerating registered email addresses by measuring server response times. This is achieved by returning a generic `"Invalid email or password"` message and enforcing aggressive, context-aware rate limiting that masks any minor CPU execution differences (or optionally by verifying a dummy Argon2 hash for missing users to normalize CPU time).

## 🏗️ Architectural Patterns

* **Defense in Depth (Multi-layered Rate Limiting)**
  Rate limiting is handled at two distinct layers. Nginx operates at the infrastructure edge (Layer 4/7), absorbing volumetric DDoS attacks based on IP addresses using C-level efficiency. The API Gateway (NestJS `@Throttle`) acts at the application level, parsing request payloads to aggressively throttle credential stuffing (e.g., limiting login attempts per email address or User ID).

* **API Gateway with RPC Decoupling**
  The Gateway never talks directly to the microservices via HTTP. Instead, it publishes RPC (Remote Procedure Call) events to RabbitMQ. This ensures loose coupling—if a microservice crashes or takes longer to run database migrations, the Gateway remains healthy, accepting client traffic and queuing requests until the backend recovers.

* **Asynchronous Event-Driven Notifications**
  The Auth Service is strictly decoupled from third-party SMTP or email providers. When a user requests a password reset, the Auth Service safely generates the tokens and simply fires a `SEND_PASSWORD_RESET_EMAIL` event to RabbitMQ. The Notification Service consumes this event and handles the slow network task of sending the email, keeping the Auth API's response times lightning fast.

* **Shared Domain Contracts (`@app/contracts`)**
  A monorepo strategy ensures that the API Gateway, Auth Service, and Club Service all rely on the exact same TypeScript definitions (e.g., `User`, `AuthTokens`, `snake_case` DTOs). This strict typing guarantees that inter-service payload mismatches are caught at compile-time rather than causing runtime crashes.

* **SSO Upsert Flow**
  (commonly referred to as Just-in-Time or JIT Provisioning) is an identity management process that automatically creates (inserts) or updates (updates) a user profile in a target application’s database the exact moment they log in via Single Sign-On.