import { BlockerAlert, ExecutiveSummaryCard } from "@/components/executive-summary";
import { HrAlerts } from "@/components/hr/hr-alerts";
import { Badge, Card, PageHeader } from "@/components/ui";
import { hrDashboard } from "@/lib/pms/queries";

export default async function HrScorecardsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const data = await hrDashboard();
  if (!data.allowed || !data.summary) return null;

  return (
    <>
      <PageHeader
        kicker="HR"
        title="Productivity scorecard"
        description="Track completion rates and workload health across the team."
      />
      <HrAlerts {...params} />

      <BlockerAlert count={data.summary.activeBlockers} />
      <ExecutiveSummaryCard summary={data.summary} />

      <div className="grid gap-4 md:grid-cols-2">
        {data.scorecards.map((card) => (
          <Card key={card.employeeId}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{card.fullName}</p>
                <p className="text-sm text-ink-soft">
                  {card.title} · {card.department}
                </p>
              </div>
              <Badge tone={card.blockedTasks > 0 ? "behind" : "good"}>{card.completionRate}%</Badge>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-ink-soft">
              <div>
                <p className="font-serif text-2xl text-ink">{card.totalTasks}</p>
                <p>Total</p>
              </div>
              <div>
                <p className="font-serif text-2xl text-teal">{card.completedTasks}</p>
                <p>Done</p>
              </div>
              <div>
                <p className="font-serif text-2xl text-ink">{card.inProgressTasks}</p>
                <p>Active</p>
              </div>
              <div>
                <p className="font-serif text-2xl text-rose-700">{card.blockedTasks}</p>
                <p>Blocked</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
