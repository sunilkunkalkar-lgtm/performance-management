import { BlockerAlert, ExecutiveSummaryCard } from "@/components/executive-summary";
import { HrAlerts } from "@/components/hr/hr-alerts";
import { TaskCard } from "@/components/task-card";
import { Card, PageHeader, Progress } from "@/components/ui";
import { hrDashboard } from "@/lib/pms/queries";

export default async function HrTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const data = await hrDashboard();
  if (!data.allowed || !data.summary) return null;

  const peopleById = new Map(data.people.map((person) => [person.id, person.fullName]));
  const statusCounts = {
    not_started: data.tasks.filter((task) => task.status === "not_started").length,
    in_progress: data.tasks.filter((task) => task.status === "in_progress").length,
    completed: data.tasks.filter((task) => task.status === "completed").length,
  };

  return (
    <>
      <PageHeader
        kicker="HR"
        title="All tasks"
        description="Read-only view of every task in the organization."
      />
      <HrAlerts {...params} />

      <BlockerAlert count={data.summary.activeBlockers} />
      <ExecutiveSummaryCard summary={data.summary} />

      <Card>
        <h2 className="font-serif text-xl">Task status distribution</h2>
        <div className="mt-4 space-y-4">
          {(["not_started", "in_progress", "completed"] as const).map((status) => (
            <div key={status}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize">{status.replaceAll("_", " ")}</span>
                <span>{statusCounts[status]}</span>
              </div>
              <Progress
                value={data.tasks.length ? Math.round((statusCounts[status] / data.tasks.length) * 100) : 0}
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {data.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            assigneeName={peopleById.get(task.assigneeId)}
            comments={data.comments}
            mode="hr"
          />
        ))}
      </div>
    </>
  );
}
