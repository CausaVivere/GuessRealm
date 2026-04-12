# GuessRealm

GuessRealm is a real-time multiplayer anime character guessing game.

Play now: https://guessrealm.fun

Repository: https://github.com/CausaVivere/Guessverse

## What You Do In The Game

1. Create a room or join with a room code.
2. The host selects a character set.
3. Each player gets a secret character.
4. Players take turns asking yes/no questions in chat.
5. On your turn, eliminate candidates from your board and make a guess when ready.
6. Wrong guess means elimination (sudden death).
7. A round ends with a winner, then returns to lobby for the next round.

Game constraints (server-side):

- Max players per room: 8
- Turn timer: 45 seconds
- Max game duration: 30 minutes
- Max turns: 100

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- Real-time multiplayer: PartyKit + PartySocket (WebSocket rooms)
- API layer: tRPC
- Auth: Clerk
- Database: PostgreSQL + Prisma
- Data sources: Jikan API (anime), IGDB API (games)

## Quick Start (Local)

### Prerequisites

- Bun
- Node.js 20+
- Docker Desktop or Podman (optional, only if you want to use the provided DB script)
- A PostgreSQL database (local container or managed)
- Clerk keys and API credentials (see environment section)

### 1) Install Dependencies

```bash
bun install
```

### 2) Create Your Env File

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Then fill in required values in .env.

### 3) Start PostgreSQL

Option A (recommended for local): use the included script.

Windows (via WSL):

```bash
wsl
./start-database.sh
```

Linux/macOS:

```bash
./start-database.sh
```

Option B: use your own PostgreSQL instance and set DATABASE_URL accordingly.

### 4) Apply Database Schema

```bash
bun run db:push
```

### 5) Start App + Real-time Server

Run these in separate terminals:

```bash
bun run dev
```

```bash
bun run dev:party
```

App URL: http://localhost:3000

PartyKit default local host: localhost:1999

## Environment Variables

The environment schema is defined in src/env.js.

| Variable                          | Required | Scope  | Purpose                                                   |
| --------------------------------- | -------- | ------ | --------------------------------------------------------- |
| DATABASE_URL                      | Yes      | Server | PostgreSQL connection string                              |
| NODE_ENV                          | No       | Server | Runtime mode (defaults to development)                    |
| CLERK_SECRET_KEY                  | Yes      | Server | Clerk server key                                          |
| IGDB_CLIENT                       | Yes      | Server | IGDB client id                                            |
| IGDB_SECRET                       | Yes      | Server | IGDB secret                                               |
| INTERNAL_SECRET                   | Yes      | Server | Shared secret for internal PartyKit -> Next.js routes     |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Yes      | Client | Clerk publishable key                                     |
| NEXT_PUBLIC_PARTYKIT_HOST         | No       | Client | PartyKit host (defaults to localhost:1999 in development) |
| NEXT_PUBLIC_APP_URL               | Yes      | Client | App base URL (use https://guessrealm.fun in production)   |

Optional helper:

- SKIP_ENV_VALIDATION=true can be used for builds where you intentionally skip env checks.

## Useful Scripts

| Command              | What it does                               |
| -------------------- | ------------------------------------------ |
| bun run dev          | Start Next.js development server           |
| bun run dev:party    | Start PartyKit development server          |
| bun run build        | Build production app                       |
| bun run start        | Start production app                       |
| bun run preview      | Build and start locally in production mode |
| bun run db:push      | Push Prisma schema to database             |
| bun run db:migrate   | Run deploy migrations                      |
| bun run db:generate  | Run prisma migrate dev                     |
| bun run db:studio    | Open Prisma Studio                         |
| bun run check        | Lint + typecheck                           |
| bun run lint         | Run lint                                   |
| bun run typecheck    | Run TypeScript checks                      |
| bun run deploy:party | Deploy PartyKit server                     |

## Architecture At A Glance

- Next.js app handles UI, page routing, public API routes, and tRPC endpoints.
- PartyKit server in party/index.ts manages room state, turns, timers, elimination, and winner/draw logic.
- PartyKit calls internal Next.js routes secured by INTERNAL_SECRET:
  - /api/internal/set/[id]
  - /api/internal/analytics/online-snapshot
- Prisma models persist sets, cached anime/character data, and analytics aggregates in PostgreSQL.

## Admin And Analytics

Protected routes (Clerk sign-in required):

- /admin: Anime set builder
- /admin/games: Game set tooling
- /admin/dashboard: Analytics dashboard

### Privacy Model

This project uses privacy-minimal, aggregate-only analytics:

- /api/analytics/visit increments daily visit totals only.
- /api/internal/analytics/online-snapshot stores per-room player counts by minute.
- No cookie banner flow, no per-user analytics profile, no location metadata collection.

## Deployment Notes

1. Deploy Next.js app to your preferred host.
2. Deploy PartyKit server:

```bash
bun run deploy:party
```

3. Set production env values:

- NEXT_PUBLIC_APP_URL=https://guessrealm.fun
- NEXT_PUBLIC_PARTYKIT_HOST=<your deployed PartyKit host>
- INTERNAL_SECRET must match in both Next.js and PartyKit environments

4. Run production database migrations:

```bash
bun run db:migrate
```

## Project Layout

- src/app: Next.js routes and route handlers
- src/server: tRPC routers and DB access
- party: PartyKit multiplayer server
- prisma: Prisma schema
- generated/prisma: Generated Prisma client
- src/components and src/styles: UI system and global styles

## Notes

- Remote image domains are configured in next.config.js for MyAnimeList and IGDB assets.
