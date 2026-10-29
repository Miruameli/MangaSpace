# Security

MangaSpace uses [Supabase Auth](https://supabase.com/auth) for accounts and
Row-Level Security (RLS) for all user data.

## Design principles

- **Secrets stay server-side.** The service-role key (used only by the
  account-deletion route) is a Vercel environment variable and is never sent to
  the client. The browser uses only the public anon key.
- **Row-Level Security.** Every user-scoped table (`bookmarks`,
  `reading_progress`, `profiles`) enforces RLS so a user can read or write only
  their own rows (`auth.uid()`).
- **No passwords in the app.** Supabase handles password hashing; this app never
  stores or transmits passwords for its own storage.
- **OAuth credentials** live in the Supabase dashboard, never in the repository
  or the client bundle.
- **Account deletion** verifies the caller's own session and applies a
  same-origin check, so a user can delete only their own account.

## Reporting a vulnerability

If you find a security issue, please report it privately through GitHub's
private vulnerability reporting (Security → Report a vulnerability) rather than
opening a public issue.
