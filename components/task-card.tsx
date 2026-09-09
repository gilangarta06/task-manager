import Link from "next/link";
import { format } from "date-fns";
import { CalendarClock, MessageSquare } from "lucide-react";
import type { Status, Priority } from "@prisma/client";
import { cn, taskCode } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  STATUS_LABEL,
  STATUS_CLASS,
  PRIORITY_LABEL,
  PRIORITY_CLASS,
  isOverdue,
} from "@/lib/workflow";

export interface TaskCardData {
  number: number;
  title: string;
  status: Status;
  progress: number;
  priority: Priority;
  dueDate: Date | null;
  assignee: { name: string; color: string } | null;
  project: { name: string; color: string } | null;
  _count?: { comments: number };
}

export function TaskCard({ task, showStatus = false }: { task: TaskCardData; showStatus?: boolean }) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Link
      href={`/tasks/${task.number}`}
      className="block rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-primary/40"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">{taskCode(task.number)}</span>
        {showStatus ? (
          <Badge className={STATUS_CLASS[task.status]}>{STATUS_LABEL[task.status]}</Badge>
        ) : task.project ? (
          <span
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
            title={task.project.name}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: task.project.color }}
            />
            {task.project.name}
          </span>
        ) : null}
      </div>

      <p className="mb-2.5 text-sm font-medium leading-snug">{task.title}</p>

      <ProgressBar value={task.progress} className="mb-1.5" />
      <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
        <span>{task.progress}%</span>
        {task.dueDate ? (
          <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
            <CalendarClock className="size-3" />
            {format(task.dueDate, "d MMM")}
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        {task.assignee ? (
          <>
            <Avatar name={task.assignee.name} color={task.assignee.color} className="size-5" />
            <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Belum ditugaskan</span>
        )}
        <span className={cn("ml-auto font-mono text-[11px]", PRIORITY_CLASS[task.priority])}>
          {PRIORITY_LABEL[task.priority].toUpperCase()}
        </span>
        {task._count && task._count.comments > 0 ? (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <MessageSquare className="size-3" />
            {task._count.comments}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
