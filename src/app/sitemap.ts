import type { MetadataRoute } from "next";
import { listComics, getAllGenres } from "@/lib/data";
import { getBaseUrl } from "@/lib/site";

// Revalidate hourly so the sitemap reflects new manga without a full rebuild.
// Without this, Next.js treats sitemap.ts as a static build-time route and
// would fire the MangaDex fetch during `next build` — slow, rate-limit prone,
// and capable of failing the build if MangaDex is down.
export const revalidate = 3600;

// MangaDex caps /manga?limit at 100 (verified against api.mangadex.org/docs).
// Fetching 500 in one request returns [] (mangadex.ts:184), silently dropping
// every comic route from the sitemap. Paginate in pages of 100 instead.
const MANGA_PAGE = 100;
const MAX_COMICS = 500;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/bookmarks`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/account`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic comic routes — paginate to stay within MangaDex's 100-limit cap
  const comicRoutes: MetadataRoute.Sitemap = [];
  let offset = 0;
  while (comicRoutes.length < MAX_COMICS) {
    const page = await listComics({ limit: MANGA_PAGE, offset });
    if (page.length === 0) break;
    for (const comic of page) {
      comicRoutes.push({
        url: `${baseUrl}/comic/${comic.id}`,
        lastModified: comic.updatedAt ? new Date(comic.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
    offset += page.length;
    if (page.length < MANGA_PAGE) break; // last page
  }

  // Genre filter routes (optional — helps search engines discover genre pages)
  const genres = await getAllGenres();
  const genreRoutes: MetadataRoute.Sitemap = genres.slice(0, 50).map((genre) => ({
    url: `${baseUrl}/?genre=${encodeURIComponent(genre)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...comicRoutes, ...genreRoutes];
}