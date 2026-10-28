import Link from "next/link";
import Image from "next/image";
import type { Comic } from "@/types/comic";

export function ComicCard({ comic }: { comic: Comic }) {
  return (
    <Link
      href={`/comic/${comic.id}`}
      className="group block rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-lg transition"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={comic.cover}
          alt={comic.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-105 transition duration-300"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-1">{comic.title}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
          {comic.author}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {comic.genres.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              {g}
            </span>
          ))}
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              comic.status === "completed"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            }`}
          >
            {comic.status}
          </span>
        </div>
      </div>
    </Link>
  );
}