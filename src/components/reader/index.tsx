"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getChapter, getComic } from "@/lib/data";
import { saveProgress } from "@/lib/storage/progress";
import type { Chapter, Comic } from "@/types/comic";
import { ReaderView } from "./view";
import { getNextTarget } from "./navigation";

export function Reader({
  comicId,
  chapterId,
  initialPage,
}: {
  comicId: string;
  chapterId: string;
  initialPage: number;
}) {
  const router = useRouter();
  const [comic, setComic] = useState<Comic | undefined>(undefined);
  const [chapter, setChapter] = useState<Chapter | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [pageIndex, setPageIndex] = useState(
    Number.isFinite(initialPage) && initialPage >= 0 ? initialPage : 0,
  );
  const [fitWidth, setFitWidth] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("mangaspace:fitWidth") !== "false";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("mangaspace:fitWidth", String(fitWidth));
  }, [fitWidth]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for async fetch
    setLoading(true);
    Promise.all([getComic(comicId), getChapter(comicId, chapterId)])
      .then(([c, ch]) => {
        if (cancelled) return;
        setComic(c);
        setChapter(ch);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [comicId, chapterId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset page index when chapter/route changes
    setPageIndex(Number.isFinite(initialPage) && initialPage >= 0 ? initialPage : 0);
  }, [chapterId, initialPage]);

  const totalPages = chapter?.pages.length ?? 0;

  useEffect(() => {
    if (!comic || !chapter) return;
    const clamped = Math.min(Math.max(pageIndex, 0), Math.max(totalPages - 1, 0));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamping page index to valid range
    if (clamped !== pageIndex) setPageIndex(clamped);
    saveProgress({ comicId: comic.id, chapterId: chapter.id, page: clamped, updatedAt: Date.now() });
  }, [comic, chapter, pageIndex, totalPages]);

  const goPrev = useCallback(() => {
    setPageIndex((i) => Math.max(0, i - 1));
  }, []);
  const goNext = useCallback(() => {
    const target = getNextTarget(comic, chapter, pageIndex, totalPages);
    if (!target) return;
    if (target.kind === "page") {
      setPageIndex(target.pageIndex);
      return;
    }
    if (comic) {
      router.push(`/read/${comic.id}/${target.chapterId}?page=${target.page}`);
    }
  }, [comic, chapter, pageIndex, totalPages, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") goPrev();
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "f") setFitWidth((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  if (loading) return <p className="text-zinc-500">Loading…</p>;
  if (!comic || !chapter) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Chapter not found.</p>
        <Link href="/" className="text-blue-500 hover:underline mt-2 inline-block">
          Back home
        </Link>
      </div>
    );
  }

  const safeIndex = Math.min(Math.max(pageIndex, 0), Math.max(totalPages - 1, 0));
  const chapterIndex = comic.chapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = chapterIndex > 0 ? comic.chapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < comic.chapters.length - 1 ? comic.chapters[chapterIndex + 1] : null;

  if (totalPages === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">No pages available for this chapter.</p>
        <Link href={`/comic/${comic.id}`} className="text-blue-500 hover:underline mt-2 inline-block">
          Back to comic
        </Link>
      </div>
    );
  }

  return (
    <ReaderView
      comic={comic}
      chapter={chapter}
      safeIndex={safeIndex}
      totalPages={totalPages}
      fitWidth={fitWidth}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
      goPrev={goPrev}
      goNext={goNext}
      toggleFit={() => setFitWidth((v) => !v)}
    />
  );
}