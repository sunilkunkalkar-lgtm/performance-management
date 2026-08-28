import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { initials } from "@/lib/format";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/goals", label: "Goals" },
  { href: "/reviews", label: "Reviews" },
  { href: "/feedback", label: "Feedback" },
  { href: "/people", label: "People" },
  { href: "/team", label: "Team" },
  { href: "/cycles", label: "Cycles" },
  { href: "/reports", label: "Reports" },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-ink text-paper lg:border-b-0 lg:border-r lg:min-h-screen">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link href="/dashboard" className="block">
            <p className="font-serif text-2xl tracking-tight">Suii</p>
            <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-paper/60">
              Performance
            </p>
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-paper/80 hover:bg-white/10 hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-5 py-5 lg:mt-8 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-sm font-medium text-ink">
              {initials(user.name)}
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-paper/60">{user.title}</p>
            </div>
          </div>
          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="text-xs uppercase tracking-[0.16em] text-paper/55 hover:text-paper"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-line bg-paper/80 px-5 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-medium">
              {initials(user.name)}
            </div>
            <span className="text-sm">{user.name}</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-xs uppercase tracking-wider text-ink-soft">
              Sign out
            </button>
          </form>
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
    <div className={`rounded-2xl border border-line bg-paper p-5 shadow-[0_1px_0_rgba(16,36,43,0.04)] ${className}`}>
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

export function Empty({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Card>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
    </Card>
  );
}
