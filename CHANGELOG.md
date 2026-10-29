# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Accounts via Supabase Auth: email/password, magic link (passwordless), and
  OAuth (Google, GitHub, Apple).
- `/account` page: edit profile (display name, avatar), change email/password,
  view linked sign-in methods, and delete your account.
- `public.profiles` table (auto-created on signup) with owner-only RLS.
- Server-side account-deletion route (`/account/delete`) using the service-role key.
- Header link to the account page when signed in.
- Content-Security-Policy `report-uri` reporting to a new `/api/csp-report`
  endpoint (logged to Vercel stdout), making site CSP violations observable
  in production before tightening script-src (#32). Extends the CSP
  hardening shipped in #64.

### Changed
- Login page offers multiple sign-in methods instead of email/password only.
- Hardened the Content-Security-Policy with strictly-additive directives
  (object-src 'none', base-uri 'self', form-action 'self',
  upgrade-insecure-requests) in PR #64.

### Fixed
- Comic content is reachable again. MangaDex blocks browser-origin requests
  (the CORS preflight returns 403 and the response carries no
  `access-control-allow-origin` header), so the comic detail page, the reader
  and the bookmarks grid now resolve their data on the server instead of in a
  client `useEffect`. Previously each of them silently fell back to mock data
  and rendered "Comic not found." / "Chapter not found." / an empty grid with
  no error shown to the user.
- `/bookmarks` now reports a load failure instead of claiming there are no
  bookmarks when the lookup fails.
- Chapters that MangaDex does not host itself (the source lives on another
  site) now link to the original source instead of showing an empty reader.

- When a chapter number exists both on MangaDex and on an external source, the
  MangaDex-hosted one is listed so it can actually be read in-app, instead of
  the external variant being shown and then failing to load.
