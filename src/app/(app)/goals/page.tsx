import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader, Progress } from "@/components/ui";
import { formatDate, percent, statusLabel } from "@/lib/format";

export default async function GoalsPage() {
  const user = await requireUser();
  const active = await prisma.cycle.findFirst({ where: { status: "ACTIVE" } });
  const where =
    user.role === "ADMIN"
      ? { cycleId: active?.id }
      : user.role === "MANAGER"
        ? {
            cycleId: active?.id,
            OR: [{ ownerId: user.id }, { owner: { managerId: user.id } }],
          }
        : { cycleId: active?.id, ownerId: user.id };

  const goals = await prisma.goal.findMany({
    where,
    include: { owner: true },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div>
      <PageHeader
        kicker="Objectives"
        title="Goals"
        description="Track outcomes for the active cycle. Progress updates stay on the goal record."
        action={
          <Link
            href="/goals/new"
            className="rounded-xl bg-teal px-4 py-2.5 text-sm font-medium text-paper hover:bg-teal-deep"
          >
            New goal
          </Link>
        }
      />
      <div className="space-y-3">
        {goals.map((goal) => {
          const p = percent(goal.current, goal.target);
          const tone =
            goal.status === "COMPLETED" || goal.status === "ON_TRACK"
              ? "good"
              : goal.status === "AT_RISK"
                ? "risk"
                : "behind";
          return (
            <Link key={goal.id} href={`/goals/${goal.id}`}>
              <Card className="transition hover:border-teal/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{goal.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {goal.owner.name} · {goal.level.toLowerCase()} · due{" "}
                      {formatDate(goal.dueDate)}
                    </p>
                  </div>
                  <Badge tone={tone}>{statusLabel(goal.status)}</Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-ink-soft">
                    <span>
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                    <span>{p}%</span>
                  </div>
                  <Progress value={p} />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
