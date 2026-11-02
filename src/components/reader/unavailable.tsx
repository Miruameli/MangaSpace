import Link from "next/link";

// Shown when a chapter has no readable page images: either the chapter is
// hosted on another site, the at-home page fetch failed, or its source
// exposes no pages at all. Chapter navigation is preserved so an
// external/unavailable chapter is not a dead end.
export function ChapterUnavailable({
  comicId,
  externalUrl,
  loadFailed,
  prevChapterId,
  nextChapterId,
}: {
  comicId: string;
  externalUrl?: string;
  loadFailed?: boolean;
  prevChapterId?: string | null;
  nextChapterId?: string | null;
}) {
  return (
    <div className="text-center py-20 space-y-4">
      {externalUrl ? (
        <>
          <p className="text-zinc-500">
            This chapter is hosted on another site. Continue reading on the original source.
          </p>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline inline-block"
          >
            Read on external source
          </a>
        </>
      ) : loadFailed ? (
        <>
          <p className="text-zinc-500">Could not load pages for this chapter.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-blue-500 hover:underline inline-block"
          >
            Retry
          </button>
        </>
      ) : (
        <p className="text-zinc-500">No pages available for this chapter.</p>
      )}
      <div className="flex items-center justify-center gap-4 text-sm">
        {prevChapterId && (
          <Link
            href={`/read/${comicId}/${prevChapterId}`}
            className="text-blue-500 hover:underline"
          >
            ← Prev chapter
          </Link>
        )}
        <Link href={`/comic/${comicId}`} className="text-blue-500 hover:underline">
          Back to comic
        </Link>
        {nextChapterId && (
          <Link
            href={`/read/${comicId}/${nextChapterId}`}
            className="text-blue-500 hover:underline"
          >
            Next chapter →
          </Link>
        )}
      </div>
    </div>
  );
}
