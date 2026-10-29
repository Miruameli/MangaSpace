"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveProgress } from "@/lib/storage/progress";
import type { Chapter, Comic } from "@/types/comic";
import { ReaderView } from "./view";
import { ChapterUnavailable } from "./unavailable";
import { getNextTarget } from "./navigation";

// The comic and its chapter are resolved on the server (see
// app/read/[comicId]/[chapterId]/page.tsx); this client component owns the
// page navigation and the reading-progress state.
export function Reader({
  chapterId,
  initialPage,
  comic,
  chapter,
}: {
  chapterId: string;
  initialPage: number;
  comic: Comic | undefined;
  chapter: Chapter | undefined;
}) {
  const router = useRouter();

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
    return <ChapterUnavailable comicId={comic.id} externalUrl={chapter.externalUrl} />;
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