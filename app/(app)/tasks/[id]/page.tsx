import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getFormOptions } from "@/lib/queries";
import { taskCode } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { STATUS_LABEL, STATUS_CLASS, PRIORITY_LABEL } from "@/lib/workflow";
import { TaskControls } from "./task-controls";
import { TaskHeaderEditor } from "./task-header-editor";
import { ProgressPanel } from "./progress-panel";
import { SubtaskList } from "./subtask-list";
import { AttachmentPanel } from "./attachment-panel";
import { CommentForm } from "./comment-form";
import { Timeline } from "./timeline";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const number = Number(id);
  if (!Number.isInteger(number)) notFound();

  const task = await prisma.task.findUnique({
    where: { number },
    include: {
      assignee: { select: { id: true, name: true, color: true } },
      createdBy: { select: { name: true, color: true } },
      project: { select: { id: true, name: true, color: true } },
      subtasks: { orderBy: { order: "asc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      updates: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, color: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, color: true } } },
      },
    },
  });

  if (!task) notFound();

  const { users, projects } = await getFormOptions();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/board"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali ke papan
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{taskCode(task.number)}</span>
              <Badge className={STATUS_CLASS[task.status]}>{STATUS_LABEL[task.status]}</Badge>
              {task.status === "BLOCKED" && task.blockedReason ? (
                <span className="text-xs text-destructive">— {task.blockedReason}</span>
              ) : null}
            </div>
            <TaskHeaderEditor
              taskId={task.id}
              title={task.title}
              description={task.description}
            />
          </div>

          <ProgressPanel
            taskId={task.id}
            progress={task.progress}
            status={task.status}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <SubtaskList taskId={task.id} subtasks={task.subtasks} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lampiran</CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentPanel taskId={task.id} attachments={task.attachments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline &amp; komentar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <CommentForm taskId={task.id} />
              <Timeline updates={task.updates} comments={task.comments} />
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <TaskControls
                taskId={task.id}
                status={task.status}
                priority={task.priority}
                assigneeId={task.assignee?.id ?? null}
                projectId={task.project?.id ?? null}
                dueDate={task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : ""}
                users={users}
                projects={projects}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-2 p-4 text-sm">
              <Row label="Prioritas" value={PRIORITY_LABEL[task.priority]} />
              <Row
                label="Dibuat oleh"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar name={task.createdBy.name} color={task.createdBy.color} className="size-5" />
                    {task.createdBy.name}
                  </span>
                }
              />
              <Row label="Dibuat" value={format(task.createdAt, "d MMM yyyy", { locale: idLocale })} />
              {task.startedAt ? (
                <Row
                  label="Mulai"
                  value={format(task.startedAt, "d MMM yyyy", { locale: idLocale })}
                />
              ) : null}
              {task.completedAt ? (
                <Row
                  label="Selesai"
                  value={format(task.completedAt, "d MMM yyyy", { locale: idLocale })}
                />
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
