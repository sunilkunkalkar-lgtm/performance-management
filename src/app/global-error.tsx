"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f4efe6] px-6 py-16 text-center text-[#10242b]">
        <h1 className="text-2xl font-semibold">Suii could not start</h1>
        <p className="mt-3 text-sm opacity-70">{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-[#0f6e6a] px-4 py-2.5 text-sm text-white"
        >
          Retry
        </button>
      </body>
    </html>
  );
}
