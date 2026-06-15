# Pocket Masters Carrom Championship 2026

A full-stack tournament website for a 24-team, 4-group carrom championship — live
standings, fixtures, an interactive knockout bracket, team profiles, statistics,
news, and a working admin control room. Built with Next.js 16 (App Router) +
React 19 + Tailwind CSS v4.

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
```

For a production run:

```bash
npm run build
npm start
```

## How it works

Unlike a typical demo, tournament data is **shared server-side**, so anything an
admin changes is instantly visible to every visitor (the front-end polls for
live updates every few seconds).

- **Data store** — `src/lib/serverStore.ts` holds the canonical state in memory
  and persists it to `.data/tournament.json` (created on first run, git-ignored).
  Delete that file to reseed from scratch.
- **API** — Route Handlers under `src/app/api`:
  - `GET /api/state` — public tournament state (the admin passcode is never sent
    to the browser).
  - `POST /api/admin` — all authenticated mutations (`{ action, payload }`),
    gated by an `x-admin-passcode` header.
- **Client** — `src/context/TournamentContext.tsx` reads `/api/state`, polls for
  updates, and routes every admin action through the API.

## Admin control room

Visit **/admin** and log in.

- **Default passcode:** `PocketMasters2026` (change it from the admin panel — it
  is validated server-side and never exposed to clients).

From the dashboard an admin can:

- Enter/update scores and set match status (Upcoming / Live / Completed).
- Edit team names and logos.
- Toggle the draw-points rule.
- Publish and delete news announcements.
- Export a JSON backup and import one back.
- Reset the tournament to its default fixtures.

### Tournament logic

- **League:** round-robin within each group; 2 points per win, configurable
  points for a draw. Tie-breakers: Points → Board Difference → Wins → Name.
- **Knockout:** the top 2 of each group advance. Quarter-final slots lock to real
  teams only once a group's league stage is fully played; semi-final and final
  slots lock as the feeding matches complete. The bracket page also lets visitors
  predict outcomes interactively.

## Deploying to Vercel

Import the repo into Vercel and deploy — no configuration needed. The site
builds and renders out of the box.

> **Persistence on serverless:** Vercel's filesystem is read-only except for a
> temporary, per-instance `/tmp`. The app detects this and stores data there, so
> it never crashes — but tournament edits only live for the lifetime of a warm
> serverless instance and reset on cold starts. For **durable, shared**
> persistence across visitors, set the `DATA_DIR` env var to a mounted writable
> volume, or swap `src/lib/serverStore.ts` for an external store (Vercel KV /
> Postgres, Upstash Redis, or the included `supabase_schema.sql`). For a single
> long-running Node host (`npm run build && npm start`), the default `.data/`
> file store is fully durable with no extra setup.

## Tech notes

This project targets Next.js 16. `npm run dev` uses the webpack dev server
(`next dev --webpack`); `next build`/`next start` use Turbopack. The data store
location can be overridden with the `DATA_DIR` environment variable.
