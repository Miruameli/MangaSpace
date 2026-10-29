import { listComics } from "@/lib/data";
import { LibraryView } from "@/components/library/view";

function readParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
}

function normalizeStatus(value: string | undefined): string {
  const v = (value ?? "").trim().toLowerCase();
  if (!v || v === "all") return "all";
  return v;
}

// Server Component: fetch the library on the server so MangaDex is reached
// server-side (no fragile cross-origin browser fetch), then hand the data to
// the interactive client view.
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const search = (readParam(sp, "search") ?? readParam(sp, "q") ?? readParam(sp, "query") ?? "").trim();
  const genreRaw = (readParam(sp, "genre") ?? "all").trim();
  const genre = genreRaw === "" ? "all" : genreRaw;
  const status = normalizeStatus(readParam(sp, "status"));
  const comics = await listComics({ query: search, genre, status });
  return (
    <LibraryView
      initialComics={comics}
      initialQuery={search}
      initialGenre={genre}
      initialStatus={status}
    />
  );
}