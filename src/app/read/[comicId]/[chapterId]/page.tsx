import { Reader } from "@/components/reader";

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
  return <Reader comicId={comicId} chapterId={chapterId} initialPage={initialPage} />;
}