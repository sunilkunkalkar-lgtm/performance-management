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

export function goalStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function approvalLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function ratingLabel(score: number | null | undefined) {
  if (!score) return "—";
  const labels = ["", "Needs focus", "Developing", "Solid", "Strong", "Exceptional"];
  return `${score} · ${labels[score] ?? ""}`;
}

export function taskStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function priorityLabel(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function roleLabel(role: string) {
  return role.toUpperCase();
}
