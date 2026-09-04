import { loginAction } from "@/app/actions";
import { clerkEnabled } from "@/lib/pms/context";
import { SEED_CREDENTIALS } from "@/lib/pms/seed";
import { Field, inputClassName } from "@/components/ui";
import { redirect } from "next/navigation";
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
          <p className="inline-flex rounded-full bg-gold/20 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
            Secure access
          </p>
          <p className="mt-6 font-serif text-4xl">Suii</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-paper/55">
            Performance management
          </p>
        </div>
        <div className="max-w-md">
          <h1 className="font-serif text-5xl leading-tight">
            Role-isolated dashboards with individual credentials.
          </h1>
          <p className="mt-6 text-lg text-paper/70">
            Boss, HR, and employee accounts each sign in with their own email and password.
          </p>
        </div>
        <p className="text-sm text-paper/45">Sessions are signed cookies. Data lives in .data/pms-demo.json.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <h2 className="font-serif text-3xl">Sign in</h2>
          <p className="mt-2 text-ink-soft">Use your individual email and password.</p>
          {error ? (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          ) : null}
          <form action={loginAction} className="mt-8 space-y-4">
            <Field label="Email">
              <input
                type="email"
                name="email"
                required
                autoComplete="username"
                className={inputClassName}
                placeholder="you@suii.app"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className={inputClassName}
                placeholder="••••••••"
              />
            </Field>
            <SubmitButton className="w-full rounded-xl bg-teal px-4 py-2.5 text-sm font-medium text-paper hover:bg-teal-deep">
              Sign in
            </SubmitButton>
          </form>
          <div className="mt-8 rounded-2xl border border-line bg-cream/30 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Demo accounts</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {SEED_CREDENTIALS.map((account) => (
                <li key={account.email}>
                  <span className="font-medium text-ink">{account.label}</span>: {account.email} / {account.password}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
