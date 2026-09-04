import { createTaskAction } from "@/app/actions";
import { BlockerAlert, ExecutiveSummaryCard } from "@/components/executive-summary";
import { TaskStatusBoard } from "@/components/task-card";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Card, Empty, Field, PageHeader, inputClassName } from "@/components/ui";
import { requireActorRole } from "@/lib/pms/context";
import { bossDashboard } from "@/lib/pms/queries";

export default async function BossDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  await requireActorRole("boss");
  const { error, created } = await searchParams;
  const data = await bossDashboard();
  if (!data.allowed || !data.summary) {
    return <Empty title="Access denied" body="This dashboard is for boss accounts only." />;
  }

  const peopleById = new Map(data.people.map((person) => [person.id, person.fullName]));
  const employees = data.people.filter((person) => person.role === "employee");
  const completedWithNotes = data.tasks.filter((task) => task.status === "completed");

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Boss"
        title="Execution overview"
        description="Create and assign tasks, track live progress, and review completed work."
      />

      {error ? <Alert>{error}</Alert> : null}
      {created ? <Alert tone="info">Task created and assigned.</Alert> : null}

      <BlockerAlert count={data.summary.activeBlockers} />
      <ExecutiveSummaryCard summary={data.summary} />

      <Card>
        <h2 className="font-serif text-2xl">Create & assign task</h2>
        <form action={createTaskAction} className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input name="title" required className={inputClassName} placeholder="Ship reliability dashboard" />
          </Field>
          <Field label="Assign to">
            <select name="assigneeId" required className={inputClassName}>
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" name="dueDate" className={inputClassName} />
          </Field>
          <Field label="Priority">
            <select name="priority" className={inputClassName} defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                name="description"
                rows={3}
                className={inputClassName}
                placeholder="What should the employee deliver?"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <SubmitButton>Create task</SubmitButton>
          </div>
        </form>
      </Card>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Live progress</h2>
        <TaskStatusBoard tasks={data.tasks} peopleById={peopleById} comments={data.comments} />
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Review panel</h2>
        {completedWithNotes.length === 0 ? (
          <Empty title="No completed tasks yet" body="Completed work and progress notes will appear here." />
        ) : (
          <div className="space-y-3">
            {completedWithNotes.map((task) => {
              const notes = data.comments.filter((comment) => comment.taskId === task.id);
              return (
                <Card key={task.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {peopleById.get(task.assigneeId)} · {task.description}
                      </p>
                    </div>
                  </div>
                  {notes.length > 0 ? (
                    <ul className="mt-3 space-y-2 border-t border-line pt-3">
                      {notes.map((note) => (
                        <li key={note.id} className="text-sm text-ink-soft">
                          {note.body}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-ink-soft">No progress notes submitted.</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
