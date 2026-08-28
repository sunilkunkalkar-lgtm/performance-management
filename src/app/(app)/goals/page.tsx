import Link from "next/link";
import { listGoalsForActor } from "@/lib/pms/queries";
import { Badge, Card, PageHeader, Progress } from "@/components/ui";
import { approvalLabel, formatDate, goalStatusLabel, percent } from "@/lib/format";

export default async function GoalsPage() {
  const { actor, goals, keyResults, people } = await listGoalsForActor();

  return (
    <div>
      <PageHeader
        kicker="Cascading OKRs"
        title="Goals"
        description="Create an objective, submit it for manager approval, then track key results."
        action={
          <Link
            href="/goals/new"
            className="rounded-xl bg-teal px-4 py-2.5 text-sm font-medium text-paper hover:bg-teal-deep"
          >
            New OKR
          </Link>
        }
      />
      <div className="space-y-3">
        {goals.map((goal) => {
          const owner = people.find((p) => p.id === goal.employeeId);
          const parent = goal.parentGoalId
            ? goals.find((g) => g.id === goal.parentGoalId)
            : null;
          const kr = keyResults.find((k) => k.goalId === goal.id);
          const p = kr ? percent(kr.currentValue, kr.target) : 0;
          const tone =
            goal.approvalStatus === "approved"
              ? "good"
              : goal.approvalStatus === "rejected"
                ? "behind"
                : "gold";
          return (
            <Link key={goal.id} href={`/goals/${goal.id}`}>
              <Card className="transition hover:border-teal/40">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{goal.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {owner?.fullName}
                      {owner?.id === actor.id ? " (you)" : ""} · due{" "}
                      {goal.dueDate ? formatDate(goal.dueDate) : "—"}
                    </p>
                    {parent ? (
                      <p className="mt-1 text-xs text-teal">Aligns to: {parent.title}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Badge>{goalStatusLabel(goal.status)}</Badge>
                    <Badge tone={tone}>{approvalLabel(goal.approvalStatus)}</Badge>
                  </div>
                </div>
                {kr ? (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-ink-soft">
                      <span>
                        {kr.title}: {kr.currentValue}/{kr.target} {kr.unit}
                      </span>
                      <span>{p}%</span>
                    </div>
                    <Progress value={p} />
                  </div>
                ) : null}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
