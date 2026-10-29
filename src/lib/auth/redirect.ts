// Resolve `next` against a sentinel base and require it to stay same-origin.
// This blocks every open-redirect form — protocol-relative (`//evil.com`),
// backslash tricks (`/\evil.com`, `/\@evil.com`), and absolute URLs — because
// any input that resolves to a different origin falls back to "/". Only the
// path (+ query/hash) of a same-origin relative URL is ever returned.
export function safeNext(next: string | null | undefined): string {
  if (!next || typeof next !== "string") return "/";
  const base = "https://__mangaspace-internal.invalid";
  let resolved: URL;
  try {
    resolved = new URL(next, base);
  } catch {
    return "/";
  }
  if (resolved.origin !== base) return "/";
  return resolved.pathname + resolved.search + resolved.hash;
}
