import Link from "next/link";
import { dashboard } from "@/lib/pms/queries";
import { Badge, Card, PageHeader, Progress } from "@/components/ui";
import { approvalLabel, formatDate, goalStatusLabel, percent } from "@/lib/format";

export default async function DashboardPage() {
  const { actor, cycle, goals, appraisals, kudos, people, keyResults } = await dashboard();
  const name = actor.fullName.split(" ")[0];

  return (
    <div>
      <PageHeader
        kicker={cycle?.name ?? "No active cycle"}
        title={`Hello, ${name}`}
        description="OKRs, 1:1 reviews, and kudos for the active cycle."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Your OKRs</p>
          <p className="mt-2 font-serif text-4xl">{goals.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Open reviews</p>
          <p className="mt-2 font-serif text-4xl">
            {appraisals.filter((a) => a.managerStatus !== "completed").length}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Kudos received</p>
          <p className="mt-2 font-serif text-4xl">{kudos.length}</p>
        </Card>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Goals</h2>
            <Link href="/goals" className="text-sm text-teal hover:underline">
              View all
            </Link>
          </div>
          {goals.map((goal) => {
            const kr = keyResults.find((k) => k.goalId === goal.id);
            const p = kr ? percent(kr.currentValue, kr.target) : 0;
            return (
              <Link key={goal.id} href={`/goals/${goal.id}`}>
                <Card className="transition hover:border-teal/40">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{goal.title}</p>
                    <Badge tone={goal.approvalStatus === "approved" ? "good" : "gold"}>
                      {approvalLabel(goal.approvalStatus)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{goalStatusLabel(goal.status)}</p>
                  {kr ? (
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-ink-soft">
                        <span>
                          {kr.currentValue} / {kr.target} {kr.unit}
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
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="font-serif text-xl">Reviews</h2>
            <ul className="mt-3 divide-y divide-line">
              {appraisals.slice(0, 5).map((review) => {
                const person = people.find((p) => p.id === review.employeeId);
                return (
                  <li key={review.id} className="py-3 first:pt-0">
                    <Link href={`/reviews/${review.id}`} className="flex justify-between gap-2">
                      <span className="text-sm font-medium">
                        {review.employeeId === actor.id ? "Your review" : person?.fullName}
                      </span>
                      <Badge>{review.selfStatus.replaceAll("_", " ")}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            <h2 className="font-serif text-xl">Recent kudos</h2>
            <ul className="mt-3 space-y-3">
              {kudos.map((item) => {
                const from = people.find((p) => p.id === item.fromEmployeeId);
                return (
                  <li key={item.id}>
                    <p className="text-sm">{item.message}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {from?.fullName} · {formatDate(item.createdAt)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
