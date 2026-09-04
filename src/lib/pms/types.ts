export type AppRole = "boss" | "hr" | "employee";
export type TaskStatus = "not_started" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export type Profile = {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  role: AppRole;
  passwordHash: string;
  avatarUrl: string | null;
};

export type Employee = {
  id: string;
  profileId: string;
  managerId: string | null;
  title: string;
  department: string;
  jobRole: string;
  hireDate: string | null;
};

export type Person = Employee & {
  fullName: string;
  email: string;
  role: AppRole;
  clerkId: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  createdById: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  isBlocked: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type ExecutiveSummary = {
  totalActive: number;
  completionRate: number;
  activeBlockers: number;
};

export type ProductivityScorecard = {
  employeeId: string;
  fullName: string;
  department: string;
  title: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completionRate: number;
};

export type Actor = Person;

export type Result<T> = { data: T; error: null } | { data: null; error: string };
