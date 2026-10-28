import { beforeEach, describe, expect, it } from "vitest";
import {
  getAllBookmarks,
  getAllProgress,
  getProgress,
  isBookmarked,
  saveProgress,
  toggleBookmark,
} from "./progress";

beforeEach(() => {
  localStorage.clear();
});

describe("progress storage", () => {
  it("returns null when no progress saved", () => {
    expect(getProgress("x")).toBeNull();
  });

  it("saves and retrieves progress", () => {
    saveProgress({ comicId: "c1", chapterId: "c1-ch1", page: 3, updatedAt: 0 });
    const p = getProgress("c1");
    expect(p).not.toBeNull();
    expect(p?.chapterId).toBe("c1-ch1");
    expect(p?.page).toBe(3);
  });

  it("updates progress on re-save", () => {
    saveProgress({ comicId: "c1", chapterId: "c1-ch1", page: 1, updatedAt: 0 });
    saveProgress({ comicId: "c1", chapterId: "c1-ch2", page: 0, updatedAt: 0 });
    expect(getProgress("c1")?.chapterId).toBe("c1-ch2");
  });

  it("getAllProgress returns all entries", () => {
    saveProgress({ comicId: "a", chapterId: "a-ch1", page: 0, updatedAt: 0 });
    saveProgress({ comicId: "b", chapterId: "b-ch1", page: 2, updatedAt: 0 });
    expect(Object.keys(getAllProgress())).toHaveLength(2);
  });

  it("toggleBookmark adds and removes", () => {
    expect(toggleBookmark("c1")).toBe(true);
    expect(isBookmarked("c1")).toBe(true);
    expect(getAllBookmarks()).toContain("c1");
    expect(toggleBookmark("c1")).toBe(false);
    expect(isBookmarked("c1")).toBe(false);
  });

  it("toggleBookmark dedupes", () => {
    toggleBookmark("c1");
    toggleBookmark("c1");
    toggleBookmark("c1");
    expect(getAllBookmarks().filter((x) => x === "c1")).toHaveLength(1);
  });
});