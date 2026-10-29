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

### Changed
- Login page offers multiple sign-in methods instead of email/password only.
