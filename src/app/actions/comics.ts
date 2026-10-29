"use server";

import { listComics } from "@/lib/data";
import type { Comic } from "@/types/comic";

// Server-side search for the library. Fetching MangaDex on the server avoids a
// cross-origin browser request (which fails in the client today) and lets the
// existing `next: { revalidate }` ISR cache apply.
export async function searchComics(query: string): Promise<Comic[]> {
  return listComics(query);
}
