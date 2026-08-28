import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader, Progress } from "@/components/ui";
import { formatDate, percent, reviewLabel, statusLabel } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const activeCycle = await prisma.cycle.findFirst({ where: { status: "ACTIVE" } });

  const [goals, reviews, feedback, reports] = await Promise.all([
    prisma.goal.findMany({
      where: { ownerId: user.id, cycleId: activeCycle?.id },
      orderBy: { dueDate: "asc" },
    }),
    prisma.review.findMany({
      where:
        user.role === "EMPLOYEE"
          ? { employeeId: user.id }
          : {
              OR: [{ employeeId: user.id }, { managerId: user.id }],
            },
      include: { employee: true, cycle: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.feedback.findMany({
      where: { toId: user.id },
      include: { from: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    user.role === "EMPLOYEE"
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: { managerId: user.id },
          include: {
            goals: { where: { cycleId: activeCycle?.id } },
            reviewsAsEmployee: { where: { cycleId: activeCycle?.id } },
          },
        }),
  ]);

  const onTrack = goals.filter((g) => g.status === "ON_TRACK" || g.status === "COMPLETED").length;

  return (
    <div>
      <PageHeader
        kicker={activeCycle?.name ?? "No active cycle"}
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Your goals, reviews, and recent feedback for this cycle."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Goals</p>
          <p className="mt-2 font-serif text-4xl">{goals.length}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {onTrack} on track or complete
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Open reviews</p>
          <p className="mt-2 font-serif text-4xl">
            {reviews.filter((r) => r.status !== "COMPLETED").length}
          </p>
          <p className="mt-1 text-sm text-ink-soft">Across this and prior cycles</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Feedback received</p>
          <p className="mt-2 font-serif text-4xl">{feedback.length}</p>
          <p className="mt-1 text-sm text-ink-soft">Latest notes from colleagues</p>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Goals this cycle</h2>
            <Link href="/goals" className="text-sm text-teal hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {goals.length === 0 ? (
              <Card>
                <p className="text-sm text-ink-soft">No goals yet. Create one to start the cycle.</p>
                <Link href="/goals/new" className="mt-3 inline-block text-sm text-teal">
                  Add a goal
                </Link>
              </Card>
            ) : (
              goals.map((goal) => {
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
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{goal.title}</p>
                          <p className="mt-1 text-sm text-ink-soft">
                            Due {formatDate(goal.dueDate)} · {goal.weight}% weight
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
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="mb-3 font-serif text-2xl">Reviews</h2>
            <Card>
              <ul className="divide-y divide-line">
                {reviews.length === 0 ? (
                  <li className="py-2 text-sm text-ink-soft">No reviews assigned.</li>
                ) : (
                  reviews.map((review) => (
                    <li key={review.id} className="py-3 first:pt-0 last:pb-0">
                      <Link href={`/reviews/${review.id}`} className="block">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {review.employeeId === user.id
                              ? "Your review"
                              : review.employee.name}
                          </p>
                          <Badge>{reviewLabel(review.status)}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink-soft">{review.cycle.name}</p>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-2xl">Recent feedback</h2>
            <Card>
              {feedback.length === 0 ? (
                <p className="text-sm text-ink-soft">No feedback yet.</p>
              ) : (
                <ul className="space-y-4">
                  {feedback.map((item) => (
                    <li key={item.id}>
                      <p className="text-sm leading-relaxed">{item.message}</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {item.from.name} · {formatDate(item.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>

      {reports.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-3 font-serif text-2xl">Direct reports</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((person) => (
              <Card key={person.id}>
                <p className="font-medium">{person.name}</p>
                <p className="text-sm text-ink-soft">{person.title}</p>
                <p className="mt-3 text-sm">
                  {person.goals.length} goals ·{" "}
                  {person.reviewsAsEmployee[0]
                    ? reviewLabel(person.reviewsAsEmployee[0].status)
                    : "No review"}
                </p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
