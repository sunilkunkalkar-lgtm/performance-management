import { createGoalAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  return (
    <div>
      <PageHeader
        kicker="Objectives"
        title="New goal"
        description="Write an outcome with a metric, target, and due date for the active cycle."
      />
      {error ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}
      <form action={createGoalAction} className="max-w-2xl space-y-4">
        <label className="block text-sm">
          Title
          <input
            name="title"
            required
            className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          Description
          <textarea
            name="description"
            required
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Metric
            <input
              name="metric"
              required
              placeholder="e.g. Services instrumented"
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            Unit
            <input
              name="unit"
              placeholder="e.g. services"
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            Target
            <input
              name="target"
              type="number"
              step="any"
              required
              defaultValue={1}
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            Weight %
            <input
              name="weight"
              type="number"
              defaultValue={25}
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            Due date
            <input
              name="dueDate"
              type="date"
              required
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          Level
          <select
            name="level"
            className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none ring-teal focus:ring-2"
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="TEAM">Team</option>
            <option value="COMPANY">Company</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-teal px-5 py-2.5 font-medium text-paper hover:bg-teal-deep"
        >
          Save goal
        </button>
      </form>
    </div>
  );
}
