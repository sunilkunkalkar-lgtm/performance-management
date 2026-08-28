import { notFound } from "next/navigation";
import {
  decideGoalAction,
  submitGoalAction,
  updateProgressAction,
} from "@/app/actions";
import { Alert, Badge, Card, PageHeader, Progress } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PendingHint } from "@/components/pending-hint";
import { getGoal } from "@/lib/pms/queries";
import { approvalLabel, formatDate, goalStatusLabel, percent } from "@/lib/format";

export default async function GoalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { actor, goal, keyResults, people, parent, error: loadError } = await getGoal(id);
  if (loadError === "Goal not found.") notFound();
  if (!goal) {
    return (
      <div>
        <PageHeader title="Goal" />
        <Alert>{loadError}</Alert>
      </div>
    );
  }

  const owner = people.find((p) => p.id === goal.employeeId);
  const kr = keyResults[0];
  const p = kr ? percent(kr.currentValue, kr.target) : 0;
  const isOwner = actor.id === goal.employeeId;
  const isManager = actor.id === owner?.managerId || actor.role === "admin";

  return (
    <div>
      <PageHeader kicker={owner?.fullName} title={goal.title} description={goal.description} />
      {error ? <Alert>{error}</Alert> : null}
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge>{goalStatusLabel(goal.status)}</Badge>
        <Badge
          tone={
            goal.approvalStatus === "approved"
              ? "good"
              : goal.approvalStatus === "rejected"
                ? "behind"
                : "gold"
          }
        >
          {approvalLabel(goal.approvalStatus)}
        </Badge>
        {parent ? <Badge tone="neutral">Aligns to {parent.title}</Badge> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            {kr ? (
              <>
                <p className="text-sm text-ink-soft">{kr.title}</p>
                <div className="mt-3">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>
                      {kr.currentValue} / {kr.target} {kr.unit}
                    </span>
                    <span>{p}%</span>
                  </div>
                  <Progress value={p} />
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-soft">No key result yet.</p>
            )}
            <p className="mt-4 text-sm text-ink-soft">
              Due {goal.dueDate ? formatDate(goal.dueDate) : "—"} · {goal.weight}% weight
            </p>
            {goal.managerComment ? (
              <p className="mt-4 rounded-xl bg-cream px-3 py-2 text-sm">
                Manager: {goal.managerComment}
              </p>
            ) : null}
          </Card>

          {isOwner && (goal.approvalStatus === "draft" || goal.approvalStatus === "rejected") ? (
            <Card>
              <h2 className="font-serif text-xl">Submit for approval</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Your manager will see this OKR once you submit it.
              </p>
              <form action={submitGoalAction} className="mt-4">
                <input type="hidden" name="goalId" value={goal.id} />
                <SubmitButton>Submit to manager</SubmitButton>
              </form>
            </Card>
          ) : null}

          {isManager && !isOwner && goal.approvalStatus === "pending_approval" ? (
            <Card>
              <h2 className="font-serif text-xl">Approval</h2>
              <form action={decideGoalAction} className="mt-4 space-y-3">
                <input type="hidden" name="goalId" value={goal.id} />
                <label className="block text-sm">
                  Comment
                  <textarea
                    name="comment"
                    rows={3}
                    className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    name="decision"
                    value="approved"
                    className="rounded-xl bg-teal px-4 py-2.5 text-sm font-medium text-paper hover:bg-teal-deep"
                  >
                    Approve
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="rejected"
                    className="rounded-xl border border-line px-4 py-2.5 text-sm"
                  >
                    Reject
                  </button>
                  <PendingHint label="Updating approval…" />
                </div>
              </form>
            </Card>
          ) : null}

          {goal.approvalStatus === "approved" && (isOwner || isManager) ? (
            <Card>
              <h2 className="font-serif text-xl">Update progress</h2>
              <form action={updateProgressAction} className="mt-4 space-y-3">
                <input type="hidden" name="goalId" value={goal.id} />
                <label className="block text-sm">
                  Current key result value
                  <input
                    name="currentValue"
                    type="number"
                    step="any"
                    defaultValue={kr?.currentValue ?? 0}
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
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="achieved">Achieved</option>
                  </select>
                </label>
                <SubmitButton>Save progress</SubmitButton>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
