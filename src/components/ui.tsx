import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";
import { ClerkSignOut } from "@/components/clerk-sign-out";
import { logoutAction, resetDemoAction } from "@/app/actions";
import { clerkEnabled } from "@/lib/pms/context";
import { dashboardPathForRole } from "@/lib/pms/rbac";
import type { Actor } from "@/lib/pms/types";
import { initials, roleLabel } from "@/lib/format";

export function AppShell({
  user,
  children,
}: {
  user: Actor;
  children: React.ReactNode;
}) {
  const signedInWithClerk = clerkEnabled();
  const dashboardHref = dashboardPathForRole(user.role);

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-ink text-paper lg:border-b-0 lg:border-r lg:min-h-screen">
        <div className="px-5 py-5">
          <Link href={dashboardHref} className="block">
            <p className="font-serif text-2xl tracking-tight">Suii</p>
            <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-paper/60">
              Task management
            </p>
            {!signedInWithClerk ? (
              <p className="mt-3 inline-flex rounded-full bg-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-gold">
                Demo · credential auth
              </p>
            ) : null}
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col">
          <Link
            href={dashboardHref}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-paper/80 hover:bg-white/10 hover:text-paper"
          >
            <LayoutDashboard className="h-4 w-4" />
            {roleLabel(user.role)} dashboard
          </Link>
        </nav>
        <div className="hidden px-5 py-5 lg:mt-8 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-sm font-medium text-ink">
              {initials(user.fullName)}
            </div>
            <div>
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-paper/60">{user.title}</p>
            </div>
          </div>
          <div className="mt-4">
            {signedInWithClerk ? (
              <ClerkSignOut />
            ) : (
              <div className="space-y-2">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-paper/55 hover:text-paper"
                  >
                    <LogOut className="h-3 w-3" /> Sign out
                  </button>
                </form>
                <form action={resetDemoAction}>
                  <button
                    type="submit"
                    className="text-[10px] uppercase tracking-[0.16em] text-paper/40 hover:text-paper/80"
                  >
                    Reset mock data
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-line bg-paper/80 px-5 py-3 lg:hidden">
          <span className="text-sm">{user.fullName}</span>
          {signedInWithClerk ? (
            <ClerkSignOut compact />
          ) : (
            <form action={logoutAction}>
              <button type="submit" className="text-xs uppercase tracking-wider text-ink-soft">
                Sign out
              </button>
            </form>
          )}
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? (
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-teal">{kicker}</p>
        ) : null}
        <h1 className="font-serif text-4xl tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-ink-soft">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-paper p-5 shadow-[0_1px_0_rgba(16,36,43,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "risk" | "behind" | "gold";
}) {
  const tones = {
    neutral: "bg-cream text-ink-soft",
    good: "bg-teal/10 text-teal-deep",
    risk: "bg-amber-100 text-amber-900",
    behind: "bg-rose-100 text-rose-900",
    gold: "bg-gold/20 text-ink",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-cream">
      <div
        className="h-full rounded-full bg-teal"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Alert({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "error" | "info";
}) {
  return (
    <p
      className={`mb-4 rounded-xl px-3 py-2 text-sm ${
        tone === "error" ? "bg-rose-50 text-rose-800" : "bg-teal/10 text-teal-deep"
      }`}
    >
      {children}
    </p>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
    </Card>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputClassName =
  "w-full rounded-xl border border-line bg-cream/40 px-3 py-2 text-sm ring-teal focus:ring-2";
