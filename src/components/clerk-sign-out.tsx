"use client";

import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export function ClerkSignOut({ compact = false }: { compact?: boolean }) {
  return (
    <SignOutButton>
      <button
        className={
          compact
            ? "text-xs uppercase tracking-wider text-ink-soft"
            : "inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-paper/55 hover:text-paper"
        }
      >
        {compact ? (
          "Sign out"
        ) : (
          <>
            <LogOut className="h-3 w-3" /> Sign out
          </>
        )}
      </button>
    </SignOutButton>
  );
}
