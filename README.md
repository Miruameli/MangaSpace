# MangaSpace

A free, open-source comic & manga reader web app built with Next.js.

## Features

- 📚 Library browse with search, genre, and status filters
- 📖 Reader with page/chapter navigation, keyboard controls, fit modes
- 🔖 Bookmarks and reading progress (localStorage + optional Supabase sync)
- 🌙 Dark mode
- 🌐 Real manga data via MangaDex (free, no account) with mock fallback
- 🛡️ Security headers (CSP, X-Frame-Options, etc.)
- 💸 100% free — no accounts required for core usage

## Getting Started

```bash
npm install
cp .env.example .env.local
# edit .env.local as needed
npm run dev
```

Open http://localhost:3000.

## Environment Variables

See `.env.example`. Key ones:
- `NEXT_PUBLIC_DATA_SOURCE` — `mangadex` (default) or `mock`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — optional, for cloud sync

## Database (Supabase, optional free tier)

1. Create a free project at supabase.com.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. Put the project URL and anon key in `.env.local`.

Core features work without Supabase (localStorage only).

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Vitest + jsdom for tests
- localStorage / IndexedDB-ready storage + optional Supabase sync

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run test` — unit tests
- `npm run lint` — eslint

## Data Source

Default data source is MangaDex (free public API). Set `NEXT_PUBLIC_DATA_SOURCE=mock` to use bundled mock data. The data layer is swappable via `src/lib/data`.