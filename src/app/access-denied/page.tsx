import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { clerkEnabled } from "@/lib/pms/context";
import { DEMO_ACCOUNTS } from "@/lib/pms/seed";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccessDeniedPage() {
  if (!clerkEnabled()) redirect("/login");

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seededEmails = DEMO_ACCOUNTS.map((account) => account.email).join(", ");

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-teal">Access denied</p>
      <h1 className="mt-3 font-serif text-4xl">No employee profile found</h1>
      <p className="mt-4 text-ink-soft">
        You are signed in with Clerk, but this account is not linked to an employee record in
        Supabase. Sign in with one of the seeded demo emails so your profile can be linked to an
        existing employee row.
      </p>
      <p className="mt-4 rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink-soft">
        Seeded emails: {seededEmails}
      </p>
      <p className="mt-4 text-sm text-ink-soft">
        Also confirm <code className="rounded bg-cream px-1">SUPABASE_SERVICE_ROLE_KEY</code> is set
        so the app can link your Clerk user id to the seeded profile on first sign-in.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <UserButton />
        <Link href="/sign-in" className="text-sm font-medium text-teal hover:text-teal-deep">
          Switch account
        </Link>
      </div>
    </div>
  );
}
