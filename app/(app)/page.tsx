import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getFormOptions } from "@/lib/queries";
import { taskCode } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { TaskCard, type TaskCardData } from "@/components/task-card";
import { STATUS_CLASS, STATUS_LABEL } from "@/lib/workflow";

const TASK_SELECT = {
  number: true,
  title: true,
  status: true,
  progress: true,
  priority: true,
  dueDate: true,
  assignee: { select: { name: true, color: true } },
  project: { select: { name: true, color: true } },
} as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const { users, projects } = await getFormOptions();

  const [openTasks, overdue, review, recentUpdates, projectRollup, statusCounts] = await Promise.all([
    prisma.task.findMany({
      where: { assigneeId: user.id, status: { notIn: ["DONE"] } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 6,
      select: TASK_SELECT,
    }),
    prisma.task.findMany({
      where: { status: { notIn: ["DONE"] }, dueDate: { lt: new Date() } },
      orderBy: { dueDate: "asc" },
      take: 6,
      select: TASK_SELECT,
    }),
    prisma.task.findMany({
      where: { status: "REVIEW" },
      orderBy: { updatedAt: "desc" },
      select: TASK_SELECT,
    }),
    prisma.taskUpdate.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        author: { select: { name: true, color: true } },
        task: { select: { number: true, title: true } },
      },
    }),
    prisma.project.findMany({
      where: { archived: false },
      select: {
        id: true,
        name: true,
        color: true,
        tasks: { select: { progress: true, status: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.task.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Halo, {user.name}</h1>
          <p className="text-sm text-muted-foreground">Ringkasan pekerjaan hari ini.</p>
        </div>
        <NewTaskDialog users={users} projects={projects} defaultAssigneeId={user.id} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const).map((s) => (
          <Card key={s}>
            <CardContent className="p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {countByStatus[s] ?? 0}
              </p>
              <Badge className={`${STATUS_CLASS[s]} mt-1`}>{STATUS_LABEL[s]}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Tugas saya</CardTitle>
            <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground">
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada tugas terbuka. 🎉</p>
            ) : (
              openTasks.map((t) => <TaskCard key={t.number} task={t as TaskCardData} showStatus />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">Terlambat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada yang lewat tenggat.</p>
            ) : (
              overdue.map((t) => <TaskCard key={t.number} task={t as TaskCardData} showStatus />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Menunggu review</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {review.length === 0 ? (
              <p className="text-sm text-muted-foreground">Antrean review kosong.</p>
            ) : (
              review.map((t) => <TaskCard key={t.number} task={t as TaskCardData} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress proyek</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {projectRollup.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada proyek.</p>
            ) : (
              projectRollup.map((p) => {
                const total = p.tasks.length;
                const avg = total
                  ? Math.round(p.tasks.reduce((sum, t) => sum + t.progress, 0) / total)
                  : 0;
                return (
                  <div key={p.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {avg}% · {total} tugas
                      </span>
                    </div>
                    <ProgressBar value={avg} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Aktivitas terakhir</CardTitle>
          <Link href="/activity" className="text-xs text-muted-foreground hover:text-foreground">
            Lihat semua
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {recentUpdates.map((u) => (
            <div key={u.id} className="flex items-start gap-3 text-sm">
              <Avatar name={u.author.name} color={u.author.color} className="mt-0.5" />
              <div className="min-w-0">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{u.author.name}</span>{" "}
                  {u.progressFrom != null && u.progressTo != null && u.progressFrom !== u.progressTo
                    ? `menaikkan progress ${u.progressFrom}% → ${u.progressTo}%`
                    : u.statusTo
                      ? `mengubah status → ${STATUS_LABEL[u.statusTo]}`
                      : "memberi catatan"}{" "}
                  di{" "}
                  <Link
                    href={`/tasks/${u.task.number}`}
                    className="font-mono text-xs text-foreground hover:underline"
                  >
                    {taskCode(u.task.number)}
                  </Link>
                </p>
                {u.note ? <p className="text-muted-foreground">{u.note}</p> : null}
                <p className="font-mono text-[11px] text-muted-foreground">
                  {formatDistanceToNow(u.createdAt, { addSuffix: true, locale: idLocale })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
