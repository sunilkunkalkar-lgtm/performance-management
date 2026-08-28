import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { radar } from "@/lib/pms/queries";
import { Alert, Badge, Card, Empty, PageHeader, Progress } from "@/components/ui";

export default async function RadarPage() {
  const { actor, rows, error } = await radar();

  return (
    <div>
      <PageHeader
        kicker="Retention"
        title="Flight Risk Radar"
        description="Aggregates approved-goal completion, missed 1:1 check-ins, and pending reviews for your team."
      />
      {error ? <Alert tone="info">{error}</Alert> : null}
      {actor.role === "employee" ? (
        <Empty
          title="Manager view"
          body="Sign in as Marcus, Maya, or Priya to see risk signals for direct reports."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const tone = row.riskScore >= 50 ? "behind" : row.riskScore >= 20 ? "risk" : "good";
            return (
              <Card key={row.employeeId}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{row.fullName}</p>
                    <p className="text-sm text-ink-soft">
                      {row.title} · {row.department}
                    </p>
                  </div>
                  <Badge tone={tone}>risk {row.riskScore}</Badge>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-ink-soft">
                      <CheckCircle2 className="h-3 w-3" /> Goal completion
                    </p>
                    <Progress value={row.goalCompletionRate} />
                    <p className="mt-1 text-sm">{row.goalCompletionRate}%</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="mt-0.5 h-4 w-4 text-ink-soft" />
                    <span>{row.missedCheckins} missed check-ins</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-ink-soft" />
                    <span>{row.pendingReviews} pending reviews</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
