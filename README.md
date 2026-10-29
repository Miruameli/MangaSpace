# MangaSpace

A free, open-source comic & manga reader web app built with Next.js.

## Features

- 📚 Library browse with search, genre, and status filters
- 📖 Reader with page/chapter navigation, keyboard controls, fit modes
- 🔖 Bookmarks and reading progress (localStorage + optional Supabase sync)
- 👤 Accounts: email/password, magic link, and OAuth (Google/GitHub/Apple)
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
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — optional, for cloud sync + accounts
- `SUPABASE_SERVICE_ROLE_KEY` — optional, server-side only; required for self-service account deletion

## Database (Supabase, optional free tier)

1. Create a free project at supabase.com.
2. Run `supabase/migrations/0001_init.sql` (bookmarks, reading progress) and `supabase/migrations/0002_profiles.sql` (user profiles) in the SQL editor.
3. Put the project URL and anon key in `.env.local`.

Core features work without Supabase (localStorage only).

## Accounts & login methods

Accounts are powered by **Supabase Auth** (no custom auth code). Supported methods:

- **Email + password**
- **Magic link** (passwordless)
- **OAuth** — Google, GitHub, Apple

Per-user synced data (RLS-protected): bookmarks, reading progress, and profile (display name, avatar).

To enable OAuth and self-service account deletion in production:

1. Supabase dashboard → Authentication → Providers: enable each provider and add its credentials.
2. Add your deployment origin (e.g. `https://mangaspace-eight.vercel.app`) to **Redirect URLs**, including the `/auth/callback` path.
3. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel (server-side only — never expose it to the client); it is used only by the account-deletion route.

Email/password and magic link work as soon as Supabase is configured; OAuth buttons activate once their provider is set up.

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