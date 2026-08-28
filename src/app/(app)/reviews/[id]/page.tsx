import { notFound } from "next/navigation";
import { saveManagerReviewAction, saveSelfReviewAction } from "@/app/actions";
import { Alert, Badge, Card, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PendingHint } from "@/components/pending-hint";
import { getAppraisal } from "@/lib/pms/queries";
import { ratingLabel } from "@/lib/format";

export default async function ReviewDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { actor, appraisal, scores, people, cycle, error: loadError } = await getAppraisal(id);
  if (!appraisal) {
    if (loadError === "Review not found.") notFound();
    return (
      <div>
        <PageHeader title="Review" />
        <Alert>{loadError}</Alert>
      </div>
    );
  }

  const employee = people.find((p) => p.id === appraisal.employeeId);
  const manager = people.find((p) => p.id === appraisal.managerId);
  const isEmployee = actor.id === appraisal.employeeId;
  const isManager = actor.id === appraisal.managerId || actor.role === "admin";
  const canSelf = isEmployee && appraisal.selfStatus !== "completed";
  const canManager =
    isManager &&
    (appraisal.selfStatus === "submitted" || appraisal.selfStatus === "completed");

  return (
    <div>
      <PageHeader
        kicker={cycle?.name}
        title={`${employee?.fullName} · 1:1 review`}
        description={`${employee?.title} · manager ${manager?.fullName}`}
      />
      {error ? <Alert>{error}</Alert> : null}
      <div className="mb-6 flex gap-2">
        <Badge>self {appraisal.selfStatus.replaceAll("_", " ")}</Badge>
        <Badge>manager {appraisal.managerStatus.replaceAll("_", " ")}</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl">Self-appraisal</h2>
          {canSelf ? (
            <form action={saveSelfReviewAction} className="mt-4 space-y-4">
              <input type="hidden" name="appraisalId" value={appraisal.id} />
              {scores.map((score) => (
                <input key={score.id} type="hidden" name="scoreId" value={score.id} />
              ))}
              <label className="block text-sm">
                Impact this cycle
                <textarea
                  name="selfSummary"
                  rows={6}
                  defaultValue={appraisal.selfSummary}
                  className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
                />
              </label>
              <label className="block text-sm">
                Overall self rating
                <select
                  name="selfRating"
                  defaultValue={appraisal.selfRating ?? ""}
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
                {scores.map((score) => (
                  <label key={score.id} className="flex items-center justify-between gap-4 text-sm">
                    <span>{score.competency}</span>
                    <select
                      name={`self-${score.id}`}
                      defaultValue={score.selfScore ?? ""}
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
              <div className="flex flex-wrap items-center gap-2">
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
                <PendingHint label="Saving self-appraisal…" />
              </div>
            </form>
          ) : (
            <div className="mt-4 space-y-2 text-sm">
              <p className="whitespace-pre-wrap leading-relaxed">
                {appraisal.selfSummary || "Not started."}
              </p>
              <p className="text-ink-soft">Self rating: {ratingLabel(appraisal.selfRating)}</p>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Manager assessment</h2>
          {canManager && appraisal.managerStatus !== "completed" ? (
            <form action={saveManagerReviewAction} className="mt-4 space-y-4">
              <input type="hidden" name="appraisalId" value={appraisal.id} />
              {scores.map((score) => (
                <input key={score.id} type="hidden" name="scoreId" value={score.id} />
              ))}
              <label className="block text-sm">
                Manager summary
                <textarea
                  name="managerSummary"
                  rows={6}
                  defaultValue={appraisal.managerSummary}
                  className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3 py-2.5 outline-none ring-teal focus:ring-2"
                />
              </label>
              <label className="block text-sm">
                Overall rating
                <select
                  name="managerRating"
                  defaultValue={appraisal.managerRating ?? ""}
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
                {scores.map((score) => (
                  <label key={score.id} className="flex items-center justify-between gap-4 text-sm">
                    <span>{score.competency}</span>
                    <select
                      name={`mgr-${score.id}`}
                      defaultValue={score.managerScore ?? ""}
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  name="intent"
                  value="save"
                  className="rounded-xl border border-line px-4 py-2.5 text-sm"
                >
                  Save draft
                </button>
                <SubmitButton name="intent" value="submit" pendingLabel="Completing…">
                  Complete review
                </SubmitButton>
                <PendingHint label="Saving manager assessment…" />
              </div>
            </form>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">
              {appraisal.managerStatus === "completed"
                ? appraisal.managerSummary
                : isEmployee
                  ? "Your manager writes this after you submit."
                  : "Waiting for the self-appraisal to be submitted."}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
