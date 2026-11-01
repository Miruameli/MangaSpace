import Link from "next/link";

// Shown when a chapter has no readable page images: either the chapter is
// hosted on another site, the at-home page fetch failed, or its source
// exposes no pages at all.
export function ChapterUnavailable({
  comicId,
  externalUrl,
  loadFailed,
}: {
  comicId: string;
  externalUrl?: string;
  loadFailed?: boolean;
}) {
  return (
    <div className="text-center py-20">
      {externalUrl ? (
        <>
          <p className="text-zinc-500">
            This chapter is hosted on another site. Continue reading on the original source.
          </p>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline mt-2 inline-block"
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
            className="text-blue-500 hover:underline mt-2 inline-block"
          >
            Retry
          </button>
        </>
      ) : (
        <p className="text-zinc-500">No pages available for this chapter.</p>
      )}
      <div className="mt-4">
        <Link href={`/comic/${comicId}`} className="text-blue-500 hover:underline">
          Back to comic
        </Link>
      </div>
    </div>
  );
}