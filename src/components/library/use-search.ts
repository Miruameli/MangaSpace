"use client";

import { useEffect, useState } from "react";
import { searchComics } from "@/app/actions/comics";
import { getAllProgress } from "@/lib/storage/progress";
import type { Comic, ReadingProgress } from "@/types/comic";

const DEBOUNCE_MS = 300;

// Owns the library's search lifecycle: a debounced query, the server-action
// search it triggers, and the derived "current" comic list. The initial set
// arrives from the server and is shown whenever there is no active query.
export function useLibrarySearch(initialComics: Comic[]) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMap] = useState<Record<string, ReadingProgress>>(() =>
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
    searchComics(debouncedQuery)
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
  }, [debouncedQuery]);

  return { query, setQuery, debouncedQuery, loading, error, comics, progressMap };
}
