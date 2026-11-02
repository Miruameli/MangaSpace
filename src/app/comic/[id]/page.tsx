import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { ComicDetail } from "@/components/comic-detail";
import { getComic } from "@/lib/data";

// Server Component: resolve the comic on the server. MangaDex rejects
// browser-origin requests (CORS preflight 403, no allow-origin header), so a
// client-side fetch would fail. Server-side the API is reachable and the
// ISR cache applies.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const comic = await getComic(id);
  if (!comic) return { title: "MangaSpace — Free Comic Reader" };
  return {
    title: `${comic.title} — MangaSpace`,
    description: comic.description?.slice(0, 160) || "Read comics and manga online for free.",
  };
}

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
