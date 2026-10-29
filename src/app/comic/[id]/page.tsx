import { notFound } from "next/navigation";
import { ComicDetail } from "@/components/comic-detail";
import { getComic } from "@/lib/data";

// Server Component: resolve the comic on the server. MangaDex rejects
// browser-origin requests (CORS preflight 403, no allow-origin header), so a
// client-side fetch silently falls back to mock data and renders zero
// chapters. Server-side the API is reachable and the ISR cache applies.
export default async function ComicDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comic = await getComic(id);
  if (!comic) notFound();
  return <ComicDetail id={id} comic={comic} />;
}
