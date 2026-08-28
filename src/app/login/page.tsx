import { redirect } from "next/navigation";
import { demoLoginAction } from "@/app/actions";
import { clerkEnabled } from "@/lib/pms/context";
import { DEMO_ACCOUNTS } from "@/lib/pms/seed";
import { SubmitButton } from "@/components/submit-button";

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
          <p className="font-serif text-4xl">Suii</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-paper/55">
            Performance management
          </p>
        </div>
        <div className="max-w-md">
          <h1 className="font-serif text-5xl leading-tight">
            Cascading OKRs, honest 1:1s, and a radar for risk.
          </h1>
          <p className="mt-6 text-lg text-paper/70">
            Demo workspace until Clerk and Supabase keys are configured.
          </p>
        </div>
        <p className="text-sm text-paper/45">Pick a person. No password in demo mode.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <h2 className="font-serif text-3xl">Sign in</h2>
          <p className="mt-2 text-ink-soft">
            RLS-shaped access: employees see their own goals and reviews; managers see
            direct reports.
          </p>
          {error ? (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          ) : null}
          <form action={demoLoginAction} className="mt-8 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-soft">Demo account</span>
              <select
                name="email"
                defaultValue="aisha@suii.app"
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
              >
                {DEMO_ACCOUNTS.map((account) => (
                  <option key={account.email} value={account.email}>
                    {account.name} · {account.role}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton className="w-full rounded-xl bg-teal px-4 py-3 font-medium text-paper hover:bg-teal-deep disabled:opacity-60">
              Continue
            </SubmitButton>
          </form>
        </div>
      </section>
    </div>
  );
}
