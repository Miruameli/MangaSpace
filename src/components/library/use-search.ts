"use client";

import { useEffect, useState } from "react";
import { searchComics } from "@/app/actions/comics";
import { getAllProgress, PROGRESS_KEY, BOOKMARKS_KEY } from "@/lib/storage/progress";
import type { Comic, ReadingProgress } from "@/types/comic";

const DEBOUNCE_MS = 300;

// Owns the library's search lifecycle: a debounced query, the server-action
// search it triggers, and the derived "current" comic list. The initial set
// arrives from the server and is shown whenever there is no active query.
export function useLibrarySearch(
  initialComics: Comic[],
  initialQueryOrOptions: string | { initialQuery?: string; initialSearch?: string; query?: string; search?: string } = "",
  filters: { language?: string } = {},
) {
  const initialQuery =
    typeof initialQueryOrOptions === "string"
      ? initialQueryOrOptions
      : initialQueryOrOptions.initialQuery ??
        initialQueryOrOptions.initialSearch ??
        initialQueryOrOptions.query ??
        initialQueryOrOptions.search ??
        "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>(() =>
    getAllProgress(),
  );

  // Show the server-fetched initial set until a search query is active.
  const comics = debouncedQuery ? results : initialComics;

  // Debounce the input so we search once per pause, not on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Clearing the query must also clear the loading flag. A search still in
  // flight when the query empties is cancelled by the effect cleanup (so its
  // own `finally` never runs), and the empty-query search effect returns early
  // — leaving "Loading…" stuck forever without this reset.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset loading/results when the query clears
    setResults([]);
    setLoading(false);
    setError(null);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- transient loading for async search
    setLoading(true);
    setError(null);
    // Forward the active language filter so results are filtered server-side via
    // MangaDex translatedLanguage[] — exactly as the initial library load is.
    // Without it, typing a query silently drops the language filter, and a
    // client-side check can't help because Comic.language is never populated.
    const searchPromise = filters.language
      ? searchComics(debouncedQuery, { language: filters.language })
      : searchComics(debouncedQuery);
    searchPromise
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Search failed.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, filters.language]);
  // Re-read progress when it changes (cross-tab, reader navigation, remote sync).
  useEffect(() => {
    const handler = () => setProgressMap(getAllProgress());
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROGRESS_KEY || e.key === BOOKMARKS_KEY) handler();
    };
    window.addEventListener("mangaspace:progress", handler);
    window.addEventListener("focus", handler);
    window.addEventListener("storage", onStorage);
    const onVisibility = () => {
      if (document.visibilityState === "visible") handler();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("mangaspace:progress", handler);
      window.removeEventListener("focus", handler);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return { query, setQuery, debouncedQuery, loading, error, comics, progressMap };
}
