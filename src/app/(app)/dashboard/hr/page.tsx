import {
  createEmployeeAction,
  deleteEmployeeAction,
  updateEmployeeAction,
} from "@/app/actions";
import { BlockerAlert, ExecutiveSummaryCard } from "@/components/executive-summary";
import { TaskCard } from "@/components/task-card";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Badge, Card, Empty, Field, PageHeader, Progress, inputClassName } from "@/components/ui";
import { requireActorRole } from "@/lib/pms/context";
import { hrDashboard } from "@/lib/pms/queries";
import { getDb } from "@/lib/pms/context";

export default async function HrDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
}) {
  await requireActorRole("hr");
  const params = await searchParams;
  const data = await hrDashboard();
  if (!data.allowed || !data.summary) {
    return <Empty title="Access denied" body="This dashboard is for HR accounts only." />;
  }

  const peopleById = new Map(data.people.map((person) => [person.id, person.fullName]));
  const statusCounts = {
    not_started: data.tasks.filter((task) => task.status === "not_started").length,
    in_progress: data.tasks.filter((task) => task.status === "in_progress").length,
    completed: data.tasks.filter((task) => task.status === "completed").length,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="HR"
        title="People & productivity"
        description="Manage employee accounts and monitor task health across the organization."
      />

      {params.error ? <Alert>{params.error}</Alert> : null}
      {params.created ? <Alert tone="info">Employee added.</Alert> : null}
      {params.updated ? <Alert tone="info">Employee updated.</Alert> : null}
      {params.deleted ? <Alert tone="info">Employee removed.</Alert> : null}

      <BlockerAlert count={data.summary.activeBlockers} />
      <ExecutiveSummaryCard summary={data.summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl">Add employee</h2>
          <form action={createEmployeeAction} className="mt-4 grid gap-3">
            <Field label="Full name">
              <input name="fullName" required className={inputClassName} />
            </Field>
            <Field label="Email">
              <input type="email" name="email" required className={inputClassName} />
            </Field>
            <Field label="Password">
              <input type="password" name="password" required className={inputClassName} />
            </Field>
            <Field label="Title">
              <input name="title" className={inputClassName} />
            </Field>
            <Field label="Department">
              <input name="department" className={inputClassName} />
            </Field>
            <Field label="Job role">
              <input name="jobRole" className={inputClassName} />
            </Field>
            <SubmitButton>Add employee</SubmitButton>
          </form>
        </Card>

        <Card>
          <h2 className="font-serif text-2xl">Task status distribution</h2>
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
      </div>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Employee management</h2>
        <div className="space-y-4">
          {data.employees.map((employee) => {
            const profile = getDb().profiles.find((p) => p.id === employee.profileId)!;
            return (
              <Card key={employee.id}>
                <form action={updateEmployeeAction} className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="employeeId" value={employee.id} />
                  <Field label="Full name">
                    <input name="fullName" defaultValue={profile.fullName} className={inputClassName} />
                  </Field>
                  <Field label="Email">
                    <input name="email" type="email" defaultValue={profile.email} className={inputClassName} />
                  </Field>
                  <Field label="New password (optional)">
                    <input name="password" type="password" className={inputClassName} placeholder="Leave blank to keep current" />
                  </Field>
                  <Field label="Title">
                    <input name="title" defaultValue={employee.title} className={inputClassName} />
                  </Field>
                  <Field label="Department">
                    <input name="department" defaultValue={employee.department} className={inputClassName} />
                  </Field>
                  <Field label="Job role">
                    <input name="jobRole" defaultValue={employee.jobRole} className={inputClassName} />
                  </Field>
                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    <SubmitButton>Save changes</SubmitButton>
                  </div>
                </form>
                <form action={deleteEmployeeAction} className="mt-3 border-t border-line pt-3">
                  <input type="hidden" name="employeeId" value={employee.id} />
                  <SubmitButton className="rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-800 hover:bg-rose-50">
                    Remove employee
                  </SubmitButton>
                </form>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Productivity scorecards</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data.scorecards.map((card) => (
            <Card key={card.employeeId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{card.fullName}</p>
                  <p className="text-sm text-ink-soft">
                    {card.title} · {card.department}
                  </p>
                </div>
                <Badge tone={card.blockedTasks > 0 ? "behind" : "good"}>{card.completionRate}%</Badge>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-ink-soft">
                <div>
                  <p className="font-serif text-2xl text-ink">{card.totalTasks}</p>
                  <p>Total</p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-teal">{card.completedTasks}</p>
                  <p>Done</p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-ink">{card.inProgressTasks}</p>
                  <p>Active</p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-rose-700">{card.blockedTasks}</p>
                  <p>Blocked</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl">All tasks (read-only)</h2>
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
      </section>
    </div>
  );
}
