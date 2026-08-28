import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";
import { reviewLabel } from "@/lib/format";

export default async function ReviewsPage() {
  const user = await requireUser();
  const reviews = await prisma.review.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : {
            OR: [{ employeeId: user.id }, { managerId: user.id }],
          },
    include: { employee: true, manager: true, cycle: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        kicker="Calibration"
        title="Reviews"
        description="Self-review first, then manager review. Ratings use a 1–5 scale."
      />
      <div className="space-y-3">
        {reviews.map((review) => (
          <Link key={review.id} href={`/reviews/${review.id}`}>
            <Card className="flex flex-col gap-2 transition hover:border-teal/40 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{review.employee.name}</p>
                <p className="text-sm text-ink-soft">
                  {review.cycle.name} · manager {review.manager.name}
                </p>
              </div>
              <Badge
                tone={
                  review.status === "COMPLETED"
                    ? "good"
                    : review.status === "NOT_STARTED"
                      ? "neutral"
                      : "gold"
                }
              >
                {reviewLabel(review.status)}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
