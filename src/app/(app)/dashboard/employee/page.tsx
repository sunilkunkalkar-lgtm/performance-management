import { TaskCard } from "@/components/task-card";
import { Alert, Empty, PageHeader } from "@/components/ui";
import { requireActorRole } from "@/lib/pms/context";
import { employeeDashboard } from "@/lib/pms/queries";

export default async function EmployeeDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireActorRole("employee");
  const { error } = await searchParams;
  const data = await employeeDashboard();
  if (!data.allowed) {
    return <Empty title="Access denied" body="This dashboard is for employee accounts only." />;
  }

  const active = data.tasks.filter((task) => task.status !== "completed");
  const completed = data.tasks.filter((task) => task.status === "completed");

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="My work"
        title={`Welcome, ${data.actor.fullName.split(" ")[0]}`}
        description="Your assigned tasks only. Update status, flag blockers, and send progress updates."
      />

      {error ? <Alert>{error}</Alert> : null}

      <section>
        <h2 className="mb-4 font-serif text-2xl">Active tasks</h2>
        {active.length === 0 ? (
          <Empty title="No active tasks" body="You are all caught up for now." />
        ) : (
          <div className="space-y-3">
            {active.map((task) => (
              <TaskCard key={task.id} task={task} comments={data.comments} mode="employee" />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Completed</h2>
        {completed.length === 0 ? (
          <Empty title="No completed tasks yet" body="Finished work will appear here." />
        ) : (
          <div className="space-y-3">
            {completed.map((task) => (
              <TaskCard key={task.id} task={task} comments={data.comments} mode="employee" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
