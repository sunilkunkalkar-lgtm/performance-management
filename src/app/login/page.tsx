import { loginAction } from "@/app/actions";
import { DEMO_ACCOUNTS } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
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
            Make performance conversations worth having.
          </h1>
          <p className="mt-6 text-lg text-paper/70">
            Goals, reviews, and feedback in one place — so managers coach and
            people know where they stand.
          </p>
        </div>
        <p className="text-sm text-paper/45">Demo workspace · password is suii123</p>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="mb-2 font-serif text-3xl lg:hidden">Suii</p>
          <h2 className="font-serif text-3xl">Sign in</h2>
          <p className="mt-2 text-ink-soft">
            Use a demo account below. Everyone shares the password{" "}
            <span className="font-medium text-ink">suii123</span>.
          </p>

          {error ? (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          ) : null}

          <form action={loginAction} className="mt-8 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-soft">Email</span>
              <input
                name="email"
                type="email"
                required
                defaultValue="aisha@suii.app"
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-ink-soft">Password</span>
              <input
                name="password"
                type="password"
                required
                defaultValue="suii123"
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-teal px-4 py-3 font-medium text-paper hover:bg-teal-deep"
            >
              Continue
            </button>
          </form>

          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">Demo people</p>
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-paper">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-ink-soft">{account.email}</p>
                  </div>
                  <span className="text-xs text-ink-soft">{account.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
