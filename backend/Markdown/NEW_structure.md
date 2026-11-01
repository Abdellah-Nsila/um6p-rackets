# ft_transcendence Architecture Evolution: REST vs. API Gateway & RabbitMQ

This document breaks down the architectural shift from a distributed HTTP model to a centralized API Gateway utilizing RabbitMQ. It is structured to serve as a direct reference for your tldraw diagrams, highlighting the exact bottlenecks of the old system and the specific industry-standard solutions of the new one.

## 1. The Old Design: Distributed Express HTTP Servers

In the initial architecture, the monorepo contained three standalone Express servers (`auth-service`, `club-service`, `notification-service`). Each service exposed its own HTTP REST endpoints to the frontend and to each other.

**The Bottlenecks & Critical Issues:**

* **The Auth Verification Bottleneck:** When the Next.js frontend sends a request to the `club-service` (e.g., to fetch match history), the `club-service` does not natively know if the user's JWT is valid. It must pause its execution, establish a new HTTP connection, and send a validation request to the `auth-service`. This creates severe latency, cascading network delays, and turns the `auth-service` into a massive bottleneck.
* **HTTP Protocol Overhead:** REST is "heavy." Every internal communication hop requires performing DNS lookups, establishing three-way TCP handshakes, parsing HTTP headers, and serializing/deserializing JSON strings.
* **Massive Security Surface Area:** Because every microservice is a full Express server, they all listen on public-facing or internal network ports. A malicious actor could theoretically bypass the frontend or gateway and send crafted HTTP requests directly to the `club-service`, forcing it to handle bad data or unauthorized attempts.

## 2. The New Design: API Gateway + RabbitMQ Message Broker

This approach introduces a single entry point (the API Gateway) and replaces fragile, synchronous HTTP/TCP connections with a robust, asynchronous message broker (RabbitMQ).

**Why RabbitMQ over Raw TCP?**
While raw TCP sockets are fast, they are notoriously difficult to manage at scale. TCP does not inherently handle application-level packet loss, complex retries, or message queuing. RabbitMQ is an industry-standard message broker that sits between your microservices. If the `notification-service` temporarily crashes, RabbitMQ safely holds the incoming messages in a queue and delivers them the moment the service reboots, ensuring zero data loss and built-in retry mechanisms.

**The Strategic Advantages:**

* **Single Source of Authentication:** The API Gateway is the only service that touches a JWT. It intercepts the HTTP request, validates the cookie, extracts the `user_id`, and completely strips the HTTP context.
* **Implicit Internal Trust:** By the time a message reaches the `club-service` via RabbitMQ, it arrives as a sanitized payload (e.g., `{ cmd: 'create_match', user_id: 42 }`). The `club-service` completely trusts this payload because it is mathematically impossible for the frontend to reach RabbitMQ directly.
* **Total Network Isolation:** The internal microservices no longer import Express. They do not have HTTP listeners. They only connect to the RabbitMQ broker, rendering them entirely immune to external REST API attacks (like CSRF or injection via headers).

## 3. Architecture Comparison Matrix

| Feature | Distributed REST (Old) | API Gateway + RabbitMQ (New) |
| --- | --- | --- |
| **Frontend Communication** | Talks to multiple ports/services directly. | Talks exclusively to Gateway (Port 3000). |
| **Auth Validation** | Duplicated across all microservices. | Centralized exclusively in the Gateway. |
| **Internal Transport** | HTTP/1.1 (Heavy, synchronous, high latency). | AMQP via RabbitMQ (Lightweight, async, fast). |
| **Error Handling** | Cascading timeouts if one service fails. | Broker queues messages until services recover. |
| **Security Posture** | High risk; all services exposed to HTTP exploits. | Hardened; internal services hidden from the web. |

When you draw this out in tldraw, you can visually represent the API Gateway as a shield or checkpoint that strips away the heavy HTTP layer, turning external web traffic into lightweight, trusted messages that flow seamlessly through the RabbitMQ exchange.

How would you like to structure the specific RabbitMQ queues and routing keys for routing messages between the Gateway and the `club-service`?