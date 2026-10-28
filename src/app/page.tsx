"use client";

import { useEffect, useMemo, useState } from "react";
import { ComicCard } from "@/components/comic-card";
import { listComics, ALL_GENRES } from "@/lib/data";
import type { Comic } from "@/types/comic";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for async fetch
    setLoading(true);
    listComics(debouncedQuery)
      .then((data) => {
        if (cancelled) return;
        setComics(data);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    return comics.filter((c) => {
      if (genre !== "all" && !c.genres.includes(genre)) return false;
      if (status !== "all" && c.status !== status) return false;
      return true;
    });
  }, [comics, genre, status]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Library</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Browse and read comics for free.
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search title, author, description…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="all">All genres</option>
          {ALL_GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && filtered.length === 0 && !error && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No comics found.</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((c) => (
          <ComicCard key={c.id} comic={c} />
        ))}
      </div>
    </div>
  );
}