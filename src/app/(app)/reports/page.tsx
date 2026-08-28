import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { percent } from "@/lib/format";

export default async function ReportsPage() {
  const user = await requireUser();
  const active = await prisma.cycle.findFirst({ where: { status: "ACTIVE" } });
  const goals = await prisma.goal.findMany({
    where: { cycleId: active?.id },
    include: { owner: { include: { department: true } } },
  });
  const reviews = await prisma.review.findMany({
    where: { cycleId: active?.id },
  });

  const byStatus = {
    ON_TRACK: goals.filter((g) => g.status === "ON_TRACK").length,
    AT_RISK: goals.filter((g) => g.status === "AT_RISK").length,
    BEHIND: goals.filter((g) => g.status === "BEHIND").length,
    COMPLETED: goals.filter((g) => g.status === "COMPLETED").length,
  };
  const maxStatus = Math.max(...Object.values(byStatus), 1);

  const depts = new Map<string, { name: string; progress: number; count: number }>();
  for (const goal of goals) {
    const name = goal.owner.department.name;
    const current = depts.get(name) ?? { name, progress: 0, count: 0 };
    current.progress += percent(goal.current, goal.target);
    current.count += 1;
    depts.set(name, current);
  }

  const reviewCounts = {
    NOT_STARTED: reviews.filter((r) => r.status === "NOT_STARTED").length,
    SELF_REVIEW: reviews.filter((r) => r.status === "SELF_REVIEW").length,
    MANAGER_REVIEW: reviews.filter((r) => r.status === "MANAGER_REVIEW").length,
    COMPLETED: reviews.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <div>
      <PageHeader
        kicker={active?.name ?? "Reports"}
        title="Cycle health"
        description={
          user.role === "EMPLOYEE"
            ? "Company snapshot of the active cycle. Individual details stay on Goals and Reviews."
            : "Where goals and reviews stand across the company."
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Goals</p>
          <p className="mt-2 font-serif text-4xl">{goals.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Reviews complete</p>
          <p className="mt-2 font-serif text-4xl">
            {reviews.length === 0
              ? "0%"
              : `${Math.round((reviewCounts.COMPLETED / reviews.length) * 100)}%`}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Goals at risk</p>
          <p className="mt-2 font-serif text-4xl">{byStatus.AT_RISK + byStatus.BEHIND}</p>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl">Goal status</h2>
          <ul className="mt-5 space-y-3">
            {Object.entries(byStatus).map(([label, count]) => (
              <li key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label.replace("_", " ").toLowerCase()}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 rounded-full bg-cream">
                  <div
                    className="h-2 rounded-full bg-teal"
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Review pipeline</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {Object.entries(reviewCounts).map(([label, count]) => (
              <li key={label} className="flex justify-between border-b border-line pb-2">
                <span>{label.replaceAll("_", " ").toLowerCase()}</span>
                <span>{count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-serif text-2xl">Average goal progress by department</h2>
        <ul className="mt-5 space-y-4">
          {[...depts.values()].map((dept) => {
            const avg = dept.count ? Math.round(dept.progress / dept.count) : 0;
            return (
              <li key={dept.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{dept.name}</span>
                  <span>{avg}%</span>
                </div>
                <div className="h-2 rounded-full bg-cream">
                  <div className="h-2 rounded-full bg-gold" style={{ width: `${avg}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
