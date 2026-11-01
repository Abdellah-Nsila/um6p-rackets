# Frontend

The web interface of UM6P Rackets, built with Next.js (React) and TypeScript.

## Stack

- Next.js with server-side rendering
- Tailwind CSS and shadcn/ui (components configured in `components.json`)
- Forms: React Hook Form with Zod validation
- State and data: Zustand and TanStack Query
- ESLint and Prettier

## Folders

| Path | Content |
|---|---|
| `src/` | pages, components, hooks, stores and API calls |
| `public/` | static files |
| `CONVENTIONS.md` | coding conventions of the frontend |
| `Dockerfile` | production image of the app |

## Run it

The frontend is started with the rest of the project from the root of the repository:

```bash
make
```

Then open **https://localhost**. The scripts for local work are in `package.json`.

## Configuration

Two values are read at **build time** and baked into the app:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | taken from `FRONTEND_URL` in the root `.env` |
| `NEXT_PUBLIC_API_PREFIX` | `/api/v1` |

After changing one of them, rebuild the frontend:

```bash
docker compose -f ./docker-compose.yml build frontend
docker compose -f ./docker-compose.yml up -d frontend
```

## See also

- [API.md](../docs/API.md): the endpoints the frontend calls
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md): how the frontend fits in the system
- [DEV.md](../docs/DEV.md): developer guide for the whole project
