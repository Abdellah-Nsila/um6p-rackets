# DEV

How to run the frontend (Next.js).

## Run locally (no Docker)

```bash
npm ci            # install dependencies
npm run dev       # dev server with hot reload -> http://localhost:3000
```

Production build locally:

```bash
npm run build
npm run start     # -> http://localhost:3000
```

## Run with Docker

Build the image:

```bash
docker build -t frontend:latest .
```

Run the container (host port 3015 -> container port 3000):

```bash
docker run -p 3015:3000 frontend:latest
```

Open: http://localhost:3015

Useful variants:

```bash
docker run -d -p 3015:3000 --name frontend frontend:latest   # run in background
docker logs -f frontend                                      # follow logs
docker stop frontend && docker rm frontend                   # stop and remove
```

## Requirements

The Dockerfile copies `.next/standalone`, so `next.config.ts` must have:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

Without it, the build succeeds but the container fails to start (`server.js` is missing).

## Notes

- Image uses a multi-stage build: `deps` -> `builder` -> production.
- The container runs as the non-root `node` user and listens on port `3000`.
- `ARG ENVIRONMENT` sets `NODE_ENV` (default `production`):
  `docker build --build-arg ENVIRONMENT=development -t frontend:dev .`