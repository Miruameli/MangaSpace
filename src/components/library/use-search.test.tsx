import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Comic } from "@/types/comic";

// searchComics is the async boundary the bug revolves around; make it controllable.
vi.mock("@/app/actions/comics", () => ({
  searchComics: vi.fn(),
}));
vi.mock("@/lib/storage/progress", () => ({
  getAllProgress: vi.fn(() => ({})),
}));

import { searchComics } from "@/app/actions/comics";
import { useLibrarySearch } from "./use-search";

const DEBOUNCE_MS = 300;

function makeComic(id: string, title: string): Comic {
  return {
    id,
    title,
    author: "Author",
    cover: "",
    description: "",
    genres: [],
    status: "ongoing",
    updatedAt: "2024-01-01T00:00:00.000Z",
    chapters: [],
  };
}

const initial = [makeComic("a", "Alpha"), makeComic("b", "Beta")];

// Fake timers make the 300ms debounce deterministic: we advance it explicitly
// instead of racing real-time `waitFor` polls. advanceTimersByTimeAsync also
// flushes the async search's promise microtasks within the same tick.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

async function flush(ms = DEBOUNCE_MS) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("useLibrarySearch", () => {
  it("shows the initial library and is idle before any query", () => {
    const { result } = renderHook(() => useLibrarySearch(initial));
    expect(result.current.comics).toEqual(initial);
    expect(result.current.loading).toBe(false);
    expect(searchComics).not.toHaveBeenCalled();
  });

  it("releases the loading flag when the query is cleared mid-search (#30)", async () => {
    // A search promise we resolve manually, after we've cleared the query.
    const { promise: pending, resolve: resolveSearch } =
      Promise.withResolvers<Comic[]>();
    vi.mocked(searchComics).mockReturnValue(pending);

    const { result } = renderHook(() => useLibrarySearch(initial));

    // Type a query; once the debounce elapses the search starts and loading flips on.
    act(() => {
      result.current.setQuery("alph");
    });
    await flush();
    expect(searchComics).toHaveBeenCalledWith("alph");
    expect(result.current.debouncedQuery).toBe("alph");
    expect(result.current.loading).toBe(true);

    // Clear the query while the search is still in flight.
    act(() => {
      result.current.setQuery("");
    });
    // Let the debounce empty the query, which cancels the in-flight search effect.
    await flush();
    expect(result.current.debouncedQuery).toBe("");

    // The cancelled search resolves late — after the query was cleared.
    await act(async () => {
      resolveSearch([makeComic("z", "Zeta")]);
    });

    // Loading must be released; the bug left it stuck true forever.
    expect(result.current.loading).toBe(false);
    // The view returns to the initial library, not the stale search results.
    expect(result.current.comics).toEqual(initial);
  });

  it("shows search results once the query resolves", async () => {
    vi.mocked(searchComics).mockResolvedValue([makeComic("z", "Zeta")]);
    const { result } = renderHook(() => useLibrarySearch(initial));

    act(() => {
      result.current.setQuery("ze");
    });
    await flush();
    expect(result.current.comics).toEqual([makeComic("z", "Zeta")]);
    expect(result.current.loading).toBe(false);
  });

  it("reports a search failure and clears loading", async () => {
    vi.mocked(searchComics).mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useLibrarySearch(initial));

    act(() => {
      result.current.setQuery("x");
    });
    await flush();
    expect(result.current.error).toBe("boom");
    expect(result.current.loading).toBe(false);
  });
});
