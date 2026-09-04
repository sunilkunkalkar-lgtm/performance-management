import { logoutAction, resetDemoAction } from "@/app/actions";
import { HrAlerts } from "@/components/hr/hr-alerts";
import { SubmitButton } from "@/components/submit-button";
import { Card, PageHeader } from "@/components/ui";
import { requireActor } from "@/lib/pms/context";

export default async function HrSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const actor = await requireActor();

  return (
    <>
      <PageHeader
        kicker="HR"
        title="Settings"
        description="Account preferences and demo data controls."
      />
      <HrAlerts {...params} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Your account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-ink-soft">Name</dt>
              <dd className="font-medium">{actor.fullName}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Email</dt>
              <dd className="font-medium">{actor.email}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Role</dt>
              <dd className="font-medium uppercase">{actor.role}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="font-serif text-xl">Demo data</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Restore the seeded employees, tasks, and credentials to their initial state.
          </p>
          <form action={resetDemoAction} className="mt-4">
            <SubmitButton className="rounded-xl border border-line px-4 py-2 text-sm hover:bg-cream">
              Reset mock data
            </SubmitButton>
          </form>
          <form action={logoutAction} className="mt-3">
            <SubmitButton className="rounded-xl bg-ink px-4 py-2 text-sm text-paper hover:bg-ink/90">
              Sign out
            </SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
