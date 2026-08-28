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
    <div className="mx-auto max-w-lg px-5 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-teal">Something went wrong</p>
      <h1 className="mt-3 font-serif text-3xl">We could not load this page</h1>
      <p className="mt-3 text-sm text-ink-soft">
        {error.message || "An unexpected error occurred while fetching data."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-xl bg-teal px-4 py-2.5 text-sm font-medium text-paper hover:bg-teal-deep"
      >
        Try again
      </button>
    </div>
  );
}
