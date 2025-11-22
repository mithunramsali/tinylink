# TinyLink

A small URL-shortener web app (bit.ly style) built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL**. It is designed to match the assignment spec exactly so that automated tests can run against it.

## Tech Stack

- Next.js 14 (App Router, `app/` directory)
- React 18 + TypeScript
- Tailwind CSS
- PostgreSQL (tested with Neon, should work with any Postgres)

## Features

- Create short links with optional custom codes
- Codes are globally unique and must match `[A-Za-z0-9]{6,8}`
- Redirect via `/:code` with `302` and click tracking
- Dashboard at `/` to list, search, and delete links
- Stats page at `/code/:code` for a single link
- Health check at `/healthz`

## Required Routes (per spec)

- `GET /healthz` → health JSON `{ "ok": true, "version": "1.0", ... }`
- `GET /` → Dashboard (list, add, delete)
- `GET /code/:code` → Stats page for a single code
- `GET /:code` → Redirect handler

## Required APIs (per spec)

Implemented using Next.js route handlers in `app/api/`:

- `POST /api/links`
  - Body: `{ url: string, code?: string }`
  - Validates `url` as http/https
  - If `code` is provided, must match `[A-Za-z0-9]{6,8}`
  - If `code` already exists → returns **409** with JSON `{ error: "Code already exists." }`
  - If `code` is omitted, a random 6-char alphanumeric code is generated
  - On success returns **201** with `{ code, url, shortUrl }`

- `GET /api/links`
  - Returns list of all links ordered by `created_at DESC`
  - Shape: `[{ code, url, total_clicks, last_clicked, created_at }, ...]`

- `GET /api/links/:code`
  - Returns details for a single code
  - `404` with `{ error: "Not found" }` if missing

- `DELETE /api/links/:code`
  - Deletes the link
  - `404` if it does not exist
  - `200` with `{ ok: true }` on success

## Database

You need a Postgres database with a `links` table:

```sql
CREATE TABLE IF NOT EXISTS links (
  code TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  last_clicked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Optional indexes

```sql
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links (created_at DESC);
```

## Environment Variables

Copy `.env.example` to `.env.local` (for local dev) or `.env` (for production) and fill in:

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME
BASE_URL=http://localhost:3000
```

- `DATABASE_URL` – your Postgres connection string (e.g. Neon)
- `BASE_URL` – base URL used in API responses when returning `shortUrl`

## Running Locally

```bash
cd tinylink
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## Deployment Notes

- This project is suitable for **Vercel + Neon** (or similar) deployment.
- Set `DATABASE_URL` and `BASE_URL` in your hosting provider's env vars.
- No special build step beyond `next build` is required.

## How Requirements Are Met

- **Dashboard `/`**
  - Shows table with short code, target URL, total clicks, last clicked, and actions.
  - Allows adding new links (with optional custom code) and deleting existing ones.
  - Has loading, empty, error, and success states.
  - Long URLs are truncated in the table with full value in `title` attribute.

- **Stats `/code/:code`**
  - Shows `shortUrl`, `url`, `total_clicks`, `last_clicked`, `created_at`.
  - If code is missing, shows a friendly "Link not found" state.

- **Redirect `/:code`**
  - On hit, increments `total_clicks` and updates `last_clicked` using a single `UPDATE ... RETURNING` query.
  - If code exists, returns `302` redirect to the original URL.
  - If not, returns `404`.

- **Healthcheck `/healthz`**
  - Returns `200` with `{ ok: true, version: "1.0", uptime, timestamp }`.

- **API Behavior**
  - Paths and methods match the spec exactly.
  - Duplicate codes return `409` from `POST /api/links`.
  - Codes are validated with regex and URL is validated using `new URL()`.

You can now wire this repo to GitHub, deploy to Vercel (or Render/Railway), and record a walkthrough video as required by the assignment.
