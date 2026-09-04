import type { Task, TaskComment } from "@/lib/pms/types";
import { Badge, Card } from "./ui";
import { formatDate, priorityLabel, taskStatusLabel } from "@/lib/format";
import {
  addCommentAction,
  toggleBlockerAction,
  updateTaskStatusAction,
} from "@/app/actions";
import { SubmitButton } from "./submit-button";

const STATUS_FLOW: Record<Task["status"], Task["status"] | null> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: null,
};

export function TaskCard({
  task,
  assigneeName,
  comments,
  mode,
}: {
  task: Task;
  assigneeName?: string;
  comments: TaskComment[];
  mode: "boss" | "hr" | "employee";
}) {
  const taskComments = comments.filter((c) => c.taskId === task.id);
  const nextStatus = STATUS_FLOW[task.status];
  const blocked = task.isBlocked && task.status !== "completed";

  return (
    <Card className={blocked ? "border-rose-300 bg-rose-50/30" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-ink">{task.title}</h3>
            {blocked ? <Badge tone="behind">Blocker</Badge> : null}
          </div>
          {assigneeName ? <p className="mt-1 text-sm text-ink-soft">Assigned to {assigneeName}</p> : null}
          <p className="mt-2 text-sm text-ink-soft">{task.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={task.priority === "high" ? "risk" : task.priority === "medium" ? "gold" : "neutral"}>
            {priorityLabel(task.priority)}
          </Badge>
          <Badge tone={task.status === "completed" ? "good" : "neutral"}>{taskStatusLabel(task.status)}</Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-soft">
        {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : null}
        {task.completedAt ? <span>Completed {formatDate(task.completedAt)}</span> : null}
      </div>

      {taskComments.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-line pt-4">
          {taskComments.map((comment) => (
            <li key={comment.id} className="rounded-xl bg-cream/60 px-3 py-2 text-sm">
              <p>{comment.body}</p>
              <p className="mt-1 text-xs text-ink-soft">{formatDate(comment.createdAt)}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {mode === "employee" ? (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {nextStatus ? (
            <form action={updateTaskStatusAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="status" value={nextStatus} />
              <SubmitButton className="rounded-xl bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-deep">
                Mark as {taskStatusLabel(nextStatus)}
              </SubmitButton>
            </form>
          ) : null}

          <form action={toggleBlockerAction} className="flex items-center gap-3">
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="blocked" value={String(!task.isBlocked)} />
            <SubmitButton
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                task.isBlocked
                  ? "border-rose-300 bg-rose-100 text-rose-900"
                  : "border-line bg-paper text-ink-soft hover:border-rose-300 hover:text-rose-800"
              }`}
            >
              {task.isBlocked ? "Clear blocker" : "Flag blocker"}
            </SubmitButton>
          </form>

          <form action={addCommentAction} className="flex gap-2">
            <input type="hidden" name="taskId" value={task.id} />
            <input
              name="body"
              placeholder="Add a progress update..."
              className="min-w-0 flex-1 rounded-xl border border-line bg-cream/40 px-3 py-2 text-sm"
              required
            />
            <SubmitButton className="rounded-xl border border-line px-3 py-2 text-sm hover:bg-cream">
              Send
            </SubmitButton>
          </form>
        </div>
      ) : null}
    </Card>
  );
}

export function TaskStatusBoard({
  tasks,
  peopleById,
  comments,
}: {
  tasks: Task[];
  peopleById: Map<string, string>;
  comments: TaskComment[];
}) {
  const columns: { key: Task["status"]; label: string }[] = [
    { key: "not_started", label: "Not started" },
    { key: "in_progress", label: "In progress" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((column) => (
        <div key={column.key}>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-ink-soft">{column.label}</h3>
          <div className="space-y-3">
            {tasks
              .filter((task) => task.status === column.key)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assigneeName={peopleById.get(task.assigneeId)}
                  comments={comments}
                  mode="boss"
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
