import { notFound } from "next/navigation";
import { saveManagerReviewAction, saveSelfReviewAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ratingLabel, reviewLabel } from "@/lib/format";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      employee: true,
      manager: true,
      cycle: true,
      competencies: true,
    },
  });
  if (!review) notFound();

  const isEmployee = review.employeeId === user.id;
  const isManager = review.managerId === user.id || user.role === "ADMIN";
  const canSelf = isEmployee && review.status !== "COMPLETED";
  const canManager =
    isManager &&
    (review.status === "MANAGER_REVIEW" || review.status === "COMPLETED" || user.role === "ADMIN");

  return (
    <div>
      <PageHeader
        kicker={review.cycle.name}
        title={`${review.employee.name} · review`}
        description={`${review.employee.title} · manager ${review.manager.name}`}
      />
      <div className="mb-6">
        <Badge tone={review.status === "COMPLETED" ? "good" : "gold"}>
          {reviewLabel(review.status)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl">Self-review</h2>
          {canSelf ? (
            <form action={saveSelfReviewAction} className="mt-4 space-y-4">
              <input type="hidden" name="reviewId" value={review.id} />
              <label className="block text-sm">
                Summary of impact
                <textarea
                  name="selfSummary"
                  rows={6}
                  defaultValue={review.selfSummary}
                  className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
                />
              </label>
              <label className="block text-sm">
                Overall self rating
                <select
                  name="selfRating"
                  defaultValue={review.selfRating ?? ""}
                  className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {ratingLabel(n)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-3">
                {review.competencies.map((c) => (
                  <label key={c.id} className="flex items-center justify-between gap-4 text-sm">
                    <span>{c.name}</span>
                    <select
                      name={`self-${c.id}`}
                      defaultValue={c.selfScore ?? ""}
                      className="rounded-lg border border-line bg-cream/40 px-2 py-1.5"
                    >
                      <option value="">—</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  name="intent"
                  value="save"
                  className="rounded-xl border border-line px-4 py-2.5 text-sm"
                >
                  Save draft
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="submit"
                  className="rounded-xl bg-teal px-4 py-2.5 text-sm font-medium text-paper hover:bg-teal-deep"
                >
                  Submit to manager
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <p className="whitespace-pre-wrap leading-relaxed">
                {review.selfSummary || "Not started."}
              </p>
              <p className="text-ink-soft">Self rating: {ratingLabel(review.selfRating)}</p>
              <ul className="space-y-1">
                {review.competencies.map((c) => (
                  <li key={c.id} className="flex justify-between">
                    <span>{c.name}</span>
                    <span>{c.selfScore ?? "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-serif text-2xl">Manager review</h2>
          {canManager && review.status !== "NOT_STARTED" && review.status !== "SELF_REVIEW" ? (
            <form action={saveManagerReviewAction} className="mt-4 space-y-4">
              <input type="hidden" name="reviewId" value={review.id} />
              <label className="block text-sm">
                Manager summary
                <textarea
                  name="managerSummary"
                  rows={6}
                  defaultValue={review.managerSummary}
                  disabled={review.status === "COMPLETED" && user.role !== "ADMIN"}
                  className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2 disabled:opacity-70"
                />
              </label>
              <label className="block text-sm">
                Overall rating
                <select
                  name="managerRating"
                  defaultValue={review.managerRating ?? ""}
                  disabled={review.status === "COMPLETED" && user.role !== "ADMIN"}
                  className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {ratingLabel(n)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-3">
                {review.competencies.map((c) => (
                  <label key={c.id} className="flex items-center justify-between gap-4 text-sm">
                    <span>{c.name}</span>
                    <select
                      name={`mgr-${c.id}`}
                      defaultValue={c.managerScore ?? ""}
                      disabled={review.status === "COMPLETED" && user.role !== "ADMIN"}
                      className="rounded-lg border border-line bg-cream/40 px-2 py-1.5"
                    >
                      <option value="">—</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              {review.status !== "COMPLETED" || user.role === "ADMIN" ? (
                <div className="flex gap-2">
                  <button
                    type="submit"
                    name="intent"
                    value="save"
                    className="rounded-xl border border-line px-4 py-2.5 text-sm"
                  >
                    Save draft
                  </button>
                  <button
                    type="submit"
                    name="intent"
                    value="submit"
                    className="rounded-xl bg-teal px-4 py-2.5 text-sm font-medium text-paper hover:bg-teal-deep"
                  >
                    Complete review
                  </button>
                </div>
              ) : null}
            </form>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">
              {isEmployee
                ? "Your manager writes this after you submit."
                : "Waiting for the self-review to be submitted."}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
