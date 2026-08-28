import { demoLoginAction } from "@/app/actions";
import { clerkEnabled } from "@/lib/pms/context";
import { DEMO_ACCOUNTS } from "@/lib/pms/seed";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (clerkEnabled()) {
    redirect("/sign-in");
  }
  const { error } = await searchParams;

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-ink px-12 py-14 text-paper lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="inline-flex rounded-full bg-gold/20 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
            Demo mode
          </p>
          <p className="mt-6 font-serif text-4xl">Suii</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-paper/55">
            Performance management
          </p>
        </div>
        <div className="max-w-md">
          <h1 className="font-serif text-5xl leading-tight">
            Local mock data. No Clerk or Supabase required.
          </h1>
          <p className="mt-6 text-lg text-paper/70">
            Pick a persona to test employee, manager, and admin access against the same
            seeded workspace.
          </p>
        </div>
        <p className="text-sm text-paper/45">Session is a signed cookie. Data lives in .data/pms-demo.json.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <h2 className="font-serif text-3xl">Sign in</h2>
          <p className="mt-2 text-ink-soft">
            One click. Employees see their own OKRs and reviews; managers see direct
            reports.
          </p>
          {error ? (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          ) : null}
          <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <form action={demoLoginAction}>
                  <input type="hidden" name="email" value={account.email} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-cream"
                  >
                    <span>
                      <span className="block font-medium">{account.name}</span>
                      <span className="block text-sm text-ink-soft">{account.email}</span>
                    </span>
                    <span className="text-xs text-ink-soft">{account.role}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
