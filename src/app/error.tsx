"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}