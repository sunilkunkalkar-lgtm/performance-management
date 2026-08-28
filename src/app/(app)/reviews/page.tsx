import Link from "next/link";
import { listAppraisals } from "@/lib/pms/queries";
import { Badge, Card, PageHeader } from "@/components/ui";

export default async function ReviewsPage() {
  const { actor, appraisals, people, cycles } = await listAppraisals();

  return (
    <div>
      <PageHeader
        kicker="1-to-1 cycles"
        title="Reviews"
        description="Self-appraisal first, then the manager assessment. Both sit on the same cycle."
      />
      <div className="space-y-3">
        {appraisals.map((review) => {
          const employee = people.find((p) => p.id === review.employeeId);
          const manager = people.find((p) => p.id === review.managerId);
          const cycle = cycles.find((c) => c.id === review.cycleId);
          return (
            <Link key={review.id} href={`/reviews/${review.id}`}>
              <Card className="flex flex-col gap-2 transition hover:border-teal/40 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {review.employeeId === actor.id ? "Your review" : employee?.fullName}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {cycle?.name} · manager {manager?.fullName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge tone={review.selfStatus === "submitted" || review.selfStatus === "completed" ? "good" : "gold"}>
                    self {review.selfStatus.replaceAll("_", " ")}
                  </Badge>
                  <Badge tone={review.managerStatus === "completed" ? "good" : "neutral"}>
                    manager {review.managerStatus.replaceAll("_", " ")}
                  </Badge>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
