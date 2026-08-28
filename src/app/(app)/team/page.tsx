import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { percent, reviewLabel, statusLabel } from "@/lib/format";

export default async function TeamPage() {
  const user = await requireUser();
  const reports = await prisma.user.findMany({
    where:
      user.role === "ADMIN"
        ? { role: { not: "ADMIN" } }
        : { managerId: user.id },
    include: {
      department: true,
      goals: { where: { cycle: { status: "ACTIVE" } } },
      reviewsAsEmployee: {
        where: { cycle: { status: "ACTIVE" } },
        include: { cycle: true },
      },
    },
    orderBy: { name: "asc" },
  });

  if (reports.length === 0) {
    return (
      <div>
        <PageHeader
          kicker="Coaching"
          title="Team"
          description="Direct reports and their cycle health."
        />
        <Empty
          title="No direct reports"
          body="This view is for managers and people partners. Sign in as Marcus, Maya, or Priya to see a team."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Coaching"
        title="Team"
        description={
          user.role === "ADMIN"
            ? "Company-wide snapshot of reports in the active cycle."
            : "Your direct reports, goals, and review status."
        }
      />
      <div className="space-y-3">
        {reports.map((person) => {
          const review = person.reviewsAsEmployee[0];
          const avg =
            person.goals.length === 0
              ? 0
              : Math.round(
                  person.goals.reduce((sum, g) => sum + percent(g.current, g.target), 0) /
                    person.goals.length,
                );
          return (
            <Card key={person.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{person.name}</p>
                <p className="text-sm text-ink-soft">
                  {person.title} · {person.department.name}
                </p>
                <p className="mt-2 text-sm">
                  {person.goals.length} goals · avg progress {avg}%
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {person.goals.map((g) => (
                    <Link key={g.id} href={`/goals/${g.id}`}>
                      <Badge
                        tone={
                          g.status === "AT_RISK"
                            ? "risk"
                            : g.status === "BEHIND"
                              ? "behind"
                              : "good"
                        }
                      >
                        {statusLabel(g.status)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
              {review ? (
                <Link href={`/reviews/${review.id}`}>
                  <Badge tone={review.status === "COMPLETED" ? "good" : "gold"}>
                    {reviewLabel(review.status)}
                  </Badge>
                </Link>
              ) : (
                <Badge>No review</Badge>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
