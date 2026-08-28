import { notFound } from "next/navigation";
import { GoalStatus } from "@prisma/client";
import { updateGoalProgressAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader, Progress } from "@/components/ui";
import { formatDate, percent, statusLabel } from "@/lib/format";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      owner: true,
      cycle: true,
      updates: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!goal) notFound();

  const canEdit = goal.ownerId === user.id || user.role !== "EMPLOYEE";
  const p = percent(goal.current, goal.target);

  return (
    <div>
      <PageHeader
        kicker={goal.cycle.name}
        title={goal.title}
        description={goal.description}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-soft">
                {goal.owner.name} · {goal.level.toLowerCase()} · due {formatDate(goal.dueDate)}
              </p>
              <Badge
                tone={
                  goal.status === "AT_RISK"
                    ? "risk"
                    : goal.status === "BEHIND"
                      ? "behind"
                      : "good"
                }
              >
                {statusLabel(goal.status)}
              </Badge>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span>
                  {goal.current} / {goal.target} {goal.unit}
                </span>
                <span>{p}%</span>
              </div>
              <Progress value={p} />
            </div>
          </Card>

          {canEdit ? (
            <Card>
              <h2 className="font-serif text-xl">Update progress</h2>
              <form action={updateGoalProgressAction} className="mt-4 space-y-3">
                <input type="hidden" name="goalId" value={goal.id} />
                <label className="block text-sm">
                  Current value
                  <input
                    name="progress"
                    type="number"
                    step="any"
                    defaultValue={goal.current}
                    className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
                  />
                </label>
                <label className="block text-sm">
                  Status
                  <select
                    name="status"
                    defaultValue={goal.status}
                    className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
                  >
                    {Object.values(GoalStatus).map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Note
                  <textarea
                    name="note"
                    rows={3}
                    placeholder="What moved, and what is next?"
                    className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-teal px-4 py-2.5 text-sm font-medium text-paper hover:bg-teal-deep"
                >
                  Save update
                </button>
              </form>
            </Card>
          ) : null}

          <Card>
            <h2 className="font-serif text-xl">History</h2>
            {goal.updates.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">No updates yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {goal.updates.map((update) => (
                  <li key={update.id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
                    <p className="text-sm">{update.note}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {update.author.name} · {formatDate(update.createdAt)} · progress{" "}
                      {update.progress}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <h2 className="font-serif text-xl">Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Metric</dt>
                <dd>{goal.metric}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Weight</dt>
                <dd>{goal.weight}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Owner</dt>
                <dd>{goal.owner.title}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
