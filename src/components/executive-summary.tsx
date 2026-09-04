import type { ExecutiveSummary } from "@/lib/pms/types";
import { Card } from "./ui";

export function ExecutiveSummaryCard({ summary }: { summary: ExecutiveSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Active tasks</p>
        <p className="mt-2 font-serif text-4xl text-ink">{summary.totalActive}</p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Completion rate</p>
        <p className="mt-2 font-serif text-4xl text-teal">{summary.completionRate}%</p>
      </Card>
      <Card className={summary.activeBlockers > 0 ? "border-rose-300 bg-rose-50/40" : ""}>
        <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Active blockers</p>
        <p className={`mt-2 font-serif text-4xl ${summary.activeBlockers > 0 ? "text-rose-700" : "text-ink"}`}>
          {summary.activeBlockers}
        </p>
      </Card>
    </div>
  );
}

export function BlockerAlert({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <p className="font-medium">Needs attention</p>
      <p className="mt-1">
        {count} task{count === 1 ? "" : "s"} flagged with active blockers.
      </p>
    </div>
  );
}
