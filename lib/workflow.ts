import type { Status, Priority } from "@prisma/client";

export const SESSION_COOKIE = "tm_session";

export const STATUS_ORDER: Status[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "BLOCKED",
];

export const STATUS_LABEL: Record<Status, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export const STATUS_CLASS: Record<Status, string> = {
  BACKLOG: "bg-muted text-muted-foreground",
  TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  DONE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  BLOCKED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export const PRIORITY_ORDER: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PRIORITY_CLASS: Record<Priority, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-slate-600 dark:text-slate-300",
  HIGH: "text-amber-600 dark:text-amber-400",
  URGENT: "text-red-600 dark:text-red-400",
};

export function clampProgress(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function isClosed(status: Status) {
  return status === "DONE";
}

export function suggestedStatusForProgress(current: Status, progress: number): Status | null {
  if (progress >= 100 && current !== "DONE" && current !== "REVIEW") return "REVIEW";
  return null;
}

export function isOverdue(dueDate: Date | null, status: Status) {
  if (!dueDate || status === "DONE") return false;
  return dueDate.getTime() < Date.now();
}
