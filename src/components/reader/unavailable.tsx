import Link from "next/link";

// Shown when a chapter has no readable page images: either the chapter is
// hosted on another site, or its source exposes no pages at all.
export function ChapterUnavailable({
  comicId,
  externalUrl,
}: {
  comicId: string;
  externalUrl?: string;
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
