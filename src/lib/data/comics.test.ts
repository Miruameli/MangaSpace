import { describe, expect, it } from "vitest";
import { getChapter, getComic, getAllComics, ALL_GENRES } from "./comics";

describe("comics data", () => {
  it("returns all comics", () => {
    expect(getAllComics().length).toBeGreaterThan(0);
  });

  it("finds a comic by id", () => {
    const c = getComic("neon-drift");
    expect(c?.title).toBe("Neon Drift");
  });

  it("returns undefined for unknown comic", () => {
    expect(getComic("nope")).toBeUndefined();
  });

  it("rejects malicious ids", () => {
    expect(getComic("../etc/passwd")).toBeUndefined();
    expect(getComic("a/b")).toBeUndefined();
    expect(getComic("")).toBeUndefined();
  });

  it("finds a chapter", () => {
    const ch = getChapter("neon-drift", "neon-drift-ch1");
    expect(ch?.pages.length).toBeGreaterThan(0);
  });

  it("ALL_GENRES is sorted and unique", () => {
    const sorted = [...ALL_GENRES].sort();
    expect(ALL_GENRES).toEqual(sorted);
    expect(new Set(ALL_GENRES).size).toBe(ALL_GENRES.length);
  });
});