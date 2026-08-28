import { createGoalAction } from "@/app/actions";
import { Alert, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { listGoalsForActor } from "@/lib/pms/queries";

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { goals, people, actor } = await listGoalsForActor();
  const parents = goals.filter((g) => g.approvalStatus === "approved");

  return (
    <div>
      <PageHeader
        kicker="Cascading OKRs"
        title="New objective"
        description="Draft an OKR. It stays private until you submit it for manager approval."
      />
      {error ? <Alert>{error}</Alert> : null}
      <form action={createGoalAction} className="max-w-2xl space-y-4">
        <label className="block text-sm">
          Objective
          <input
            name="title"
            required
            className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          Why it matters
          <textarea
            name="description"
            required
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          Aligns to (optional cascade)
          <select
            name="parentGoalId"
            className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
          >
            <option value="">None</option>
            {parents
              .filter((g) => g.employeeId !== actor.id)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {people.find((p) => p.id === g.employeeId)?.fullName}: {g.title}
                </option>
              ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            Weight %
            <input
              name="weight"
              type="number"
              defaultValue={25}
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            Due date
            <input
              name="dueDate"
              type="date"
              required
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
            />
          </label>
        </div>
        <div className="rounded-2xl border border-line p-4">
          <p className="font-medium">Key result</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm sm:col-span-3">
              Result
              <input
                name="krTitle"
                placeholder="e.g. Services instrumented"
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
              />
            </label>
            <label className="block text-sm">
              Target
              <input
                name="krTarget"
                type="number"
                step="any"
                defaultValue={1}
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              Unit
              <input
                name="krUnit"
                placeholder="services"
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
              />
            </label>
          </div>
        </div>
        <SubmitButton>Save draft</SubmitButton>
      </form>
    </div>
  );
}
