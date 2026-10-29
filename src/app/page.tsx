import { listComics } from "@/lib/data";
import { LibraryView } from "@/components/library/view";

// Server Component: fetch the library on the server so MangaDex is reached
// server-side (no fragile cross-origin browser fetch), then hand the data to
// the interactive client view.
export default async function HomePage() {
  const comics = await listComics("");
  return <LibraryView initialComics={comics} />;
}
