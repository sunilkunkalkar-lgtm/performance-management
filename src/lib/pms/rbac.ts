import type { AppRole, Actor, Task } from "./types";
import type { Db } from "./seed";

export const DASHBOARD_BY_ROLE: Record<AppRole, string> = {
  boss: "/dashboard/boss",
  hr: "/dashboard/hr",
  employee: "/dashboard/employee",
};

export function dashboardPathForRole(role: AppRole): string {
  return DASHBOARD_BY_ROLE[role];
}

export function canAccessRole(actor: Actor, allowed: AppRole | AppRole[]): boolean {
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  return roles.includes(actor.role);
}

export function canViewTask(actor: Actor, task: Task, db: Db): boolean {
  if (actor.role === "boss" || actor.role === "hr") return true;
  return task.assigneeId === actor.id;
}

export function canManageTask(actor: Actor, task: Task): boolean {
  return actor.role === "boss" && task.createdById === actor.id;
}

export function canUpdateTaskAsEmployee(actor: Actor, task: Task): boolean {
  return actor.role === "employee" && task.assigneeId === actor.id;
}

export function listEmployeesForActor(actor: Actor, db: Db) {
  if (actor.role === "boss" || actor.role === "hr") {
    return db.employees.filter((e) => {
      const profile = db.profiles.find((p) => p.id === e.profileId);
      return profile?.role === "employee";
    });
  }
  return [];
}

export function tasksForActor(actor: Actor, db: Db): Task[] {
  if (actor.role === "employee") {
    return db.tasks.filter((t) => t.assigneeId === actor.id);
  }
  return db.tasks;
}
