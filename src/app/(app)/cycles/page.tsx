import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default async function CyclesPage() {
  await requireUser();
  const cycles = await prisma.cycle.findMany({
    include: { _count: { select: { goals: true, reviews: true } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <div>
      <PageHeader
        kicker="Cadence"
        title="Review cycles"
        description="Mid-year and annual windows. Goals and reviews attach to the active cycle."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {cycles.map((cycle) => (
          <Card key={cycle.id}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-serif text-2xl">{cycle.name}</h2>
              <Badge
                tone={
                  cycle.status === "ACTIVE"
                    ? "good"
                    : cycle.status === "CLOSED"
                      ? "neutral"
                      : "gold"
                }
              >
                {cycle.status.toLowerCase()}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{cycle.kind}</p>
            <p className="mt-4 text-sm">
              {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)}
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              {cycle._count.goals} goals · {cycle._count.reviews} reviews
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
