import { Suspense } from "react";
import { ComicDetail } from "@/components/comic-detail";

export default async function ComicDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
      <ComicDetail id={id} />
    </Suspense>
  );
}