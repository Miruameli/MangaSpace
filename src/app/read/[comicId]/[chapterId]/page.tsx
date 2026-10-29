import { Reader } from "@/components/reader";
import { getChapter, getComic } from "@/lib/data";

// Server Component: load the chapter and its page list on the server.
// MangaDex blocks browser-origin requests, so fetching in the client would
// yield no pages at all.
export default async function ReaderRoute({
  params,
  searchParams,
}: {
  params: Promise<{ comicId: string; chapterId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { comicId, chapterId } = await params;
  const sp = await searchParams;
  const page = Number(sp?.page ?? "0");
  const initialPage = Number.isInteger(page) && page >= 0 ? page : 0;
  const [comic, chapter] = await Promise.all([
    getComic(comicId),
    getChapter(comicId, chapterId),
  ]);
  return (
    <Reader
      chapterId={chapterId}
      initialPage={initialPage}
      comic={comic}
      chapter={chapter}
    />
  );
}
