"use client";
import { getSupabase } from "@/lib/db/supabase";
import type { ReadingProgress } from "@/types/comic";
const PROGRESS_KEY = "mangaspace:progress";
const BOOKMARKS_KEY = "mangaspace:bookmarks";
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getAllProgress(): Record<string, ReadingProgress> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, ReadingProgress>>(
    window.localStorage.getItem(PROGRESS_KEY),
    {},
  );
}

export function getProgress(comicId: string): ReadingProgress | null {
  return getAllProgress()[comicId] ?? null;
}

export function saveProgress(p: ReadingProgress): void {
  if (typeof window === "undefined") return;
  const all = getAllProgress();
  all[p.comicId] = { ...p, updatedAt: Date.now() };
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  void syncProgressRemote({ comicId: p.comicId, chapterId: p.chapterId, page: p.page, updatedAt: Date.now() });
}

export function getAllBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(window.localStorage.getItem(BOOKMARKS_KEY), []);
}

export function isBookmarked(comicId: string): boolean {
  return getAllBookmarks().includes(comicId);
}

export function toggleBookmark(comicId: string): boolean {
  if (typeof window === "undefined") return false;
  const list = getAllBookmarks();
  const idx = list.indexOf(comicId);
  if (idx >= 0) {
    list.splice(idx, 1);
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
    void syncBookmarkRemote(comicId, false);
    return false;
  }
  list.unshift(comicId);
  window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  void syncBookmarkRemote(comicId, true);
  return true;
}

// --- optional Supabase sync (best-effort, non-blocking) ---

function deviceId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "mangaspace:device-id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    window.localStorage.setItem(key, id);
  }
  return id;
}

export async function syncProgressRemote(p: ReadingProgress): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("reading_progress").upsert(
      { user_id: deviceId(), comic_id: p.comicId, chapter_id: p.chapterId, page: p.page, updated_at: new Date(p.updatedAt).toISOString() },
      { onConflict: "user_id,comic_id" },
    );
  } catch {
    // best-effort; localStorage remains source of truth
  }
}

export async function syncBookmarkRemote(comicId: string, add: boolean): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    if (add) {
      await sb.from("bookmarks").upsert({ user_id: deviceId(), comic_id: comicId });
    } else {
      await sb.from("bookmarks").delete().eq("user_id", deviceId()).eq("comic_id", comicId);
    }
  } catch {
    // best-effort
  }
}

export async function hydrateFromRemote(): Promise<void> {
  const sb = getSupabase();
  if (!sb || typeof window === "undefined") return;
  try {
    const uid = deviceId();
    const { data: prog } = await sb.from("reading_progress").select("*").eq("user_id", uid);
    if (prog) {
      const all = getAllProgress();
      for (const row of prog as { comic_id: string; chapter_id: string; page: number; updated_at: string }[]) {
        const ts = new Date(row.updated_at).getTime();
        const existing = all[row.comic_id];
        if (!existing || ts > existing.updatedAt) {
          all[row.comic_id] = { comicId: row.comic_id, chapterId: row.chapter_id, page: row.page, updatedAt: ts };
        }
      }
      window.localStorage.setItem("mangaspace:progress", JSON.stringify(all));
    }
    const { data: bms } = await sb.from("bookmarks").select("comic_id").eq("user_id", uid);
    if (bms) {
      const ids = bms.map((r: { comic_id: string }) => r.comic_id);
      // merge with local
      const local = getAllBookmarks();
      const merged = Array.from(new Set([...ids, ...local]));
      window.localStorage.setItem("mangaspace:bookmarks", JSON.stringify(merged));
    }
  } catch {
    // best-effort
  }
}