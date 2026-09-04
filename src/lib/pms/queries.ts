import { getDb, persistDb, requireActor } from "./context";
import {
  canManageTask,
  canUpdateTaskAsEmployee,
  canViewTask,
  listEmployeesForActor,
  tasksForActor,
} from "./rbac";
import { fail, ok, peopleOf, type Db } from "./seed";
import type {
  AppRole,
  ExecutiveSummary,
  ProductivityScorecard,
  Result,
  TaskPriority,
  TaskStatus,
} from "./types";

function id() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

export function executiveSummary(tasks: { status: TaskStatus; isBlocked: boolean }[]): ExecutiveSummary {
  const active = tasks.filter((t) => t.status !== "completed");
  const completed = tasks.filter((t) => t.status === "completed").length;
  const total = tasks.length;
  return {
    totalActive: active.length,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    activeBlockers: tasks.filter((t) => t.isBlocked && t.status !== "completed").length,
  };
}

export function productivityScorecards(db: Db): ProductivityScorecard[] {
  const employees = db.employees.filter((e) => {
    const profile = db.profiles.find((p) => p.id === e.profileId);
    return profile?.role === "employee";
  });

  return employees.map((employee) => {
    const profile = db.profiles.find((p) => p.id === employee.profileId)!;
    const tasks = db.tasks.filter((t) => t.assigneeId === employee.id);
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const blocked = tasks.filter((t) => t.isBlocked && t.status !== "completed").length;
    return {
      employeeId: employee.id,
      fullName: profile.fullName,
      department: employee.department,
      title: employee.title,
      totalTasks: tasks.length,
      completedTasks: completed,
      inProgressTasks: inProgress,
      blockedTasks: blocked,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  });
}

export async function requireRole(allowed: AppRole | AppRole[]) {
  const actor = await requireActor();
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(actor.role)) {
    return { actor, allowed: false as const };
  }
  return { actor, allowed: true as const };
}

export async function bossDashboard() {
  const gate = await requireRole("boss");
  if (!gate.allowed) return { ...gate, tasks: [], people: [], comments: [], summary: null };
  const db = getDb();
  const tasks = tasksForActor(gate.actor, db);
  const people = peopleOf(db);
  return {
    actor: gate.actor,
    allowed: true as const,
    tasks,
    people,
    comments: db.taskComments,
    summary: executiveSummary(tasks),
  };
}

export async function hrDashboard() {
  const gate = await requireRole("hr");
  if (!gate.allowed) return { ...gate, tasks: [], employees: [], people: [], comments: [], summary: null, scorecards: [] };
  const db = getDb();
  const tasks = tasksForActor(gate.actor, db);
  const employees = listEmployeesForActor(gate.actor, db);
  return {
    actor: gate.actor,
    allowed: true as const,
    tasks,
    employees,
    people: peopleOf(db),
    comments: db.taskComments,
    summary: executiveSummary(tasks),
    scorecards: productivityScorecards(db),
  };
}

export async function employeeDashboard() {
  const gate = await requireRole("employee");
  if (!gate.allowed) return { ...gate, tasks: [], comments: [] };
  const db = getDb();
  const tasks = tasksForActor(gate.actor, db);
  return {
    actor: gate.actor,
    allowed: true as const,
    tasks,
    comments: db.taskComments.filter((c) => tasks.some((t) => t.id === c.taskId)),
  };
}

export async function createTask(input: {
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  priority: TaskPriority;
}): Promise<Result<{ id: string }>> {
  const gate = await requireRole("boss");
  if (!gate.allowed) return fail("Only bosses can create tasks.");
  if (!input.title.trim()) return fail("Title is required.");
  if (!input.assigneeId) return fail("Assign an employee.");
  const db = getDb();
  const assignee = db.employees.find((e) => e.id === input.assigneeId);
  const profile = assignee ? db.profiles.find((p) => p.id === assignee.profileId) : null;
  if (!assignee || profile?.role !== "employee") return fail("Assign tasks to employees only.");
  const taskId = id();
  const timestamp = now();
  db.tasks.push({
    id: taskId,
    title: input.title.trim(),
    description: input.description.trim(),
    assigneeId: input.assigneeId,
    createdById: gate.actor.id,
    status: "not_started",
    priority: input.priority,
    dueDate: input.dueDate || null,
    isBlocked: false,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  persistDb();
  return ok({ id: taskId });
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Result<true>> {
  const actor = await requireActor();
  const db = getDb();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) return fail("Task not found.");
  if (!canUpdateTaskAsEmployee(actor, task)) return fail("You can only update your own tasks.");
  const order: TaskStatus[] = ["not_started", "in_progress", "completed"];
  const current = order.indexOf(task.status);
  const next = order.indexOf(status);
  if (next < current) return fail("Status can only move forward.");
  if (next > current + 1) return fail("Advance one status at a time.");
  task.status = status;
  task.updatedAt = now();
  if (status === "completed") {
    task.completedAt = now();
    task.isBlocked = false;
  }
  persistDb();
  return ok(true);
}

export async function toggleTaskBlocker(taskId: string, blocked: boolean): Promise<Result<true>> {
  const actor = await requireActor();
  const db = getDb();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) return fail("Task not found.");
  if (!canUpdateTaskAsEmployee(actor, task)) return fail("You can only flag blockers on your own tasks.");
  if (task.status === "completed") return fail("Completed tasks cannot be flagged.");
  task.isBlocked = blocked;
  task.updatedAt = now();
  persistDb();
  return ok(true);
}

export async function addTaskComment(taskId: string, body: string): Promise<Result<true>> {
  const actor = await requireActor();
  const db = getDb();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) return fail("Task not found.");
  if (!canViewTask(actor, task, db)) return fail("You cannot comment on this task.");
  if (!body.trim()) return fail("Comment cannot be empty.");
  db.taskComments.push({
    id: id(),
    taskId,
    authorId: actor.id,
    body: body.trim(),
    createdAt: now(),
  });
  task.updatedAt = now();
  persistDb();
  return ok(true);
}

export async function createEmployee(input: {
  fullName: string;
  email: string;
  password: string;
  title: string;
  department: string;
  jobRole: string;
}): Promise<Result<{ id: string }>> {
  const gate = await requireRole("hr");
  if (!gate.allowed) return fail("Only HR can add employees.");
  const db = getDb();
  const email = input.email.toLowerCase().trim();
  if (!email || !input.password || !input.fullName.trim()) return fail("Name, email, and password are required.");
  if (db.profiles.some((p) => p.email === email)) return fail("Email already exists.");
  const profileId = id();
  const employeeId = id();
  const clerkId = `user_${employeeId.slice(0, 8)}`;
  const { hashPassword } = await import("@/lib/auth/password");
  db.profiles.push({
    id: profileId,
    clerkId,
    email,
    fullName: input.fullName.trim(),
    role: "employee",
    passwordHash: hashPassword(input.password),
    avatarUrl: null,
  });
  db.employees.push({
    id: employeeId,
    profileId,
    managerId: db.employees.find((e) => e.profileId === db.profiles.find((p) => p.role === "boss")?.id)?.id ?? null,
    title: input.title.trim() || "Employee",
    department: input.department.trim() || "General",
    jobRole: input.jobRole.trim() || "Employee",
    hireDate: new Date().toISOString().slice(0, 10),
  });
  persistDb();
  return ok({ id: employeeId });
}

export async function updateEmployee(input: {
  employeeId: string;
  fullName: string;
  email: string;
  password?: string;
  title: string;
  department: string;
  jobRole: string;
}): Promise<Result<true>> {
  const gate = await requireRole("hr");
  if (!gate.allowed) return fail("Only HR can update employees.");
  const db = getDb();
  const employee = db.employees.find((e) => e.id === input.employeeId);
  if (!employee) return fail("Employee not found.");
  const profile = db.profiles.find((p) => p.id === employee.profileId);
  if (!profile || profile.role !== "employee") return fail("Only employee profiles can be edited here.");
  const email = input.email.toLowerCase().trim();
  if (db.profiles.some((p) => p.email === email && p.id !== profile.id)) return fail("Email already in use.");
  profile.fullName = input.fullName.trim();
  profile.email = email;
  if (input.password?.trim()) {
    const { hashPassword } = await import("@/lib/auth/password");
    profile.passwordHash = hashPassword(input.password.trim());
  }
  employee.title = input.title.trim();
  employee.department = input.department.trim();
  employee.jobRole = input.jobRole.trim();
  persistDb();
  return ok(true);
}

export async function deleteEmployee(employeeId: string): Promise<Result<true>> {
  const gate = await requireRole("hr");
  if (!gate.allowed) return fail("Only HR can remove employees.");
  const db = getDb();
  const employee = db.employees.find((e) => e.id === employeeId);
  if (!employee) return fail("Employee not found.");
  const profile = db.profiles.find((p) => p.id === employee.profileId);
  if (!profile || profile.role !== "employee") return fail("Only employee accounts can be removed.");
  const taskIds = db.tasks.filter((t) => t.assigneeId === employeeId).map((t) => t.id);
  db.tasks = db.tasks.filter((t) => t.assigneeId !== employeeId);
  db.taskComments = db.taskComments.filter((c) => !taskIds.includes(c.taskId));
  db.employees = db.employees.filter((e) => e.id !== employeeId);
  db.profiles = db.profiles.filter((p) => p.id !== employee.profileId);
  persistDb();
  return ok(true);
}

export async function authenticate(email: string, password: string) {
  const db = getDb();
  const profile = db.profiles.find((p) => p.email === email.toLowerCase().trim());
  if (!profile) return fail("Invalid email or password.");
  const { verifyPassword } = await import("@/lib/auth/password");
  if (!verifyPassword(password, profile.passwordHash)) return fail("Invalid email or password.");
  return ok(profile.clerkId);
}

export type { Actor } from "./types";
