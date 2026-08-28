export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="h-4 w-24 animate-pulse rounded bg-line" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded bg-line" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="h-28 animate-pulse rounded-2xl bg-line/70" />
        <div className="h-28 animate-pulse rounded-2xl bg-line/70" />
        <div className="h-28 animate-pulse rounded-2xl bg-line/70" />
      </div>
      <p className="mt-6 text-sm text-ink-soft">Loading workspace…</p>
    </div>
  );
}
