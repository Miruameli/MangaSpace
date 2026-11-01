import type { Comic, Chapter } from "@/types/comic";

const cover = (seed: string) => `https://picsum.photos/seed/${seed}/400/600`;
const page = (seed: string) => `https://picsum.photos/seed/${seed}/800/1200`;

function makeChapter(
  comicId: string,
  number: number,
  pageCount: number,
): Chapter {
  const id = `${comicId}-ch${number}`;
  return {
    id,
    comicId,
    number,
    title: "",
    pages: Array.from({ length: pageCount }, (_, i) =>
      page(`${comicId}-ch${number}-p${i + 1}`),
    ),
    publishedAt: new Date(2025, 0, number * 7).toISOString(),
  };
}

const comics: Comic[] = [
  {
    id: "neon-drift",
    title: "Neon Drift",
    author: "A. Kuro",
    description:
      "A courier in a rain-soaked megacity discovers a map that shouldn't exist. Every alley hides a secret, and every secret has a price.",
    cover: cover("neon-drift-cover"),
    genres: ["Sci-Fi", "Action", "Cyberpunk"],
    status: "ongoing",
    updatedAt: "2025-09-01",
    chapters: [makeChapter("neon-drift", 1, 6), makeChapter("neon-drift", 2, 5)],
  },
  {
    id: "quiet-forest",
    title: "Quiet Forest",
    author: "M. Hana",
    description:
      "Two siblings return to their childhood village and find the forest remembers everything they tried to forget.",
    cover: cover("quiet-forest-cover"),
    genres: ["Drama", "Mystery", "Slice of Life"],
    status: "completed",
    updatedAt: "2025-07-12",
    chapters: [makeChapter("quiet-forest", 1, 7), makeChapter("quiet-forest", 2, 4), makeChapter("quiet-forest", 3, 5)],
  },
  {
    id: "iron-saint",
    title: "Iron Saint",
    author: "R. Voss",
    description:
      "An exiled knight forges a living suit of armor from a dying star. The armor has its own will — and its own enemies.",
    cover: cover("iron-saint-cover"),
    genres: ["Fantasy", "Action"],
    status: "ongoing",
    updatedAt: "2025-09-20",
    chapters: [makeChapter("iron-saint", 1, 8)],
  },
  {
    id: "paper-moon",
    title: "Paper Moon",
    author: "S. Lin",
    description:
      "A librarian who can fold paper into reality must decide which stories deserve to come true.",
    cover: cover("paper-moon-cover"),
    genres: ["Fantasy", "Romance"],
    status: "ongoing",
    updatedAt: "2025-08-30",
    chapters: [makeChapter("paper-moon", 1, 5), makeChapter("paper-moon", 2, 6)],
  },
  {
    id: "last-train",
    title: "Last Train Home",
    author: "D. Park",
    description:
      "Passengers on the final train of the night discover it never stops — and the conductor has been dead for years.",
    cover: cover("last-train-cover"),
    genres: ["Horror", "Mystery", "Thriller"],
    status: "completed",
    updatedAt: "2025-06-15",
    chapters: [makeChapter("last-train", 1, 6)],
  },
  {
    id: "sunrise-cafe",
    title: "Sunrise Cafe",
    author: "Y. Tanaka",
    description:
      "A tiny cafe that only opens at dawn serves coffee to people who need one more conversation before letting go.",
    cover: cover("sunrise-cafe-cover"),
    genres: ["Slice of Life", "Drama"],
    status: "ongoing",
    updatedAt: "2025-09-28",
    chapters: [makeChapter("sunrise-cafe", 1, 4), makeChapter("sunrise-cafe", 2, 5)],
  },
];

export function getAllComics(): Comic[] {
  return comics;
}

const ID_RE = /^[a-z0-9-]{1,64}$/i;
function validId(id: unknown): id is string {
  return typeof id === "string" && ID_RE.test(id);
}

export function getComic(id: string): Comic | undefined {
  if (!validId(id)) return undefined;
  return comics.find((c) => c.id === id);
}

export function getChapter(comicId: string, chapterId: string): Chapter | undefined {
  if (!validId(comicId) || !validId(chapterId)) return undefined;
  const comic = getComic(comicId);
  return comic?.chapters.find((ch) => ch.id === chapterId);
}

export const ALL_GENRES = Array.from(
  new Set(comics.flatMap((c) => c.genres)),
).sort();