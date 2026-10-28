
export const API = "https://api.mangadex.org";
export const COVERS = "https://uploads.mangadex.org/covers";
export const FALLBACK_COVER = "https://picsum.photos/seed/manga/400/600";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validUuid(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id);
}

export interface MdTag {
  attributes?: { name?: Record<string, string> };
}

export interface MdManga {
  id: string;
  attributes?: {
    title?: Record<string, string>;
    description?: Record<string, string>;
    status?: string;
    tags?: MdTag[];
  };
  relationships?: Array<{ type: string; attributes?: { fileName?: string; name?: string } }>;
}

export interface MdChapter {
  id: string;
  attributes?: { chapter?: string; title?: string; publishAt?: string; translatedLanguage?: string };
}

export function pickText(obj: Record<string, string> | undefined): string {
  if (!obj) return "";
  return obj.en ?? Object.values(obj)[0] ?? "";
}

export function coverUrl(manga: MdManga): string {
  const rel = manga.relationships?.find((r) => r.type === "cover_art");
  const fileName = rel?.attributes?.fileName;
  if (!fileName) return FALLBACK_COVER;
  return `${COVERS}/${manga.id}/${fileName}.256.jpg`;
}

export function statusFromManga(s?: string): "ongoing" | "completed" {
  return s === "completed" ? "completed" : "ongoing";
}

export function tagNames(manga: MdManga): string[] {
  return (
    manga.attributes?.tags
      ?.map((t) => pickText(t.attributes?.name))
      .filter(Boolean) ?? []
  );
}

export function authorName(manga: MdManga): string {
  const rel = manga.relationships?.find((r) => r.type === "author");
  return rel?.attributes?.name ?? "Unknown";
}

export async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}