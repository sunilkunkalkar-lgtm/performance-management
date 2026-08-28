"use client";

import { useFormStatus } from "react-dom";

export function PendingHint({ label = "Saving…" }: { label?: string }) {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <p className="text-sm text-ink-soft" role="status" aria-live="polite">
      {label}
    </p>
  );
}
