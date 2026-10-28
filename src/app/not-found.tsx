import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-4">Page not found.</p>
      <Link href="/" className="text-blue-500 hover:underline">
        Back to library
      </Link>
    </div>
  );
}