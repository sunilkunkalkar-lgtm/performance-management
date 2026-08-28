import type { GoalStatus, ReviewStatus, Role } from "@prisma/client";

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function percent(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export function statusLabel(status: GoalStatus) {
  switch (status) {
    case "ON_TRACK":
      return "On track";
    case "AT_RISK":
      return "At risk";
    case "BEHIND":
      return "Behind";
    case "COMPLETED":
      return "Completed";
  }
}

export function reviewLabel(status: ReviewStatus) {
  switch (status) {
    case "NOT_STARTED":
      return "Not started";
    case "SELF_REVIEW":
      return "Self-review";
    case "MANAGER_REVIEW":
      return "Manager review";
    case "COMPLETED":
      return "Completed";
  }
}

export function roleLabel(role: Role) {
  switch (role) {
    case "ADMIN":
      return "People admin";
    case "MANAGER":
      return "Manager";
    case "EMPLOYEE":
      return "Employee";
  }
}

export function ratingLabel(score: number | null | undefined) {
  if (!score) return "—";
  const labels = ["", "Needs focus", "Developing", "Solid", "Strong", "Exceptional"];
  return `${score} · ${labels[score] ?? ""}`;
}
