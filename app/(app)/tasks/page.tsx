import Link from "next/link";
import { format } from "date-fns";
import type { Prisma, Status } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getFormOptions } from "@/lib/queries";
import { cn, taskCode } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { NewTaskDialog } from "@/components/new-task-dialog";
import {
  STATUS_ORDER,
  STATUS_LABEL,
  STATUS_CLASS,
  PRIORITY_LABEL,
  PRIORITY_CLASS,
  isOverdue,
} from "@/lib/workflow";

type SearchParams = Promise<{ status?: string; assignee?: string; project?: string; q?: string }>;

export default async function TasksPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const { users, projects } = await getFormOptions();

  const where: Prisma.TaskWhereInput = {};
  if (params.status && STATUS_ORDER.includes(params.status as Status)) {
    where.status = params.status as Status;
  }
  if (params.assignee) where.assigneeId = params.assignee;
  if (params.project) where.projectId = params.project;
  if (params.q) where.title = { contains: params.q, mode: "insensitive" };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
    select: {
      number: true,
      title: true,
      status: true,
      progress: true,
      priority: true,
      dueDate: true,
      assignee: { select: { name: true, color: true } },
      project: { select: { name: true, color: true } },
    },
  });

  const buildHref = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/tasks?${qs}` : "/tasks";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Daftar Tugas</h1>
          <p className="text-sm text-muted-foreground">{tasks.length} tugas ditampilkan.</p>
        </div>
        <NewTaskDialog users={users} projects={projects} defaultAssigneeId={user.id} />
      </div>

      <form className="flex flex-wrap items-end gap-2" action="/tasks">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Cari judul…"
          className="h-9 w-44 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          name="status"
          defaultValue={params.status || ""}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
        >
          <option value="">Semua status</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          name="assignee"
          defaultValue={params.assignee || ""}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
        >
          <option value="">Semua orang</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          name="project"
          defaultValue={params.project || ""}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
        >
          <option value="">Semua proyek</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          Terapkan
        </button>
        {(params.q || params.status || params.assignee || params.project) && (
          <Link href="/tasks" className="h-9 px-2 text-sm leading-9 text-muted-foreground hover:text-foreground">
            Reset
          </Link>
        )}
      </form>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Tugas</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Progress</th>
                <th className="px-4 py-2.5 font-medium">PJ</th>
                <th className="px-4 py-2.5 font-medium">Prioritas</th>
                <th className="px-4 py-2.5 font-medium">Tenggat</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.number} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <Link href={`/tasks/${t.number}`} className="flex flex-col">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {taskCode(t.number)}
                        {t.project ? ` · ${t.project.name}` : ""}
                      </span>
                      <span className="font-medium">{t.title}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge className={STATUS_CLASS[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={t.progress} className="w-20" />
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {t.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {t.assignee ? (
                      <span className="flex items-center gap-1.5">
                        <Avatar name={t.assignee.name} color={t.assignee.color} className="size-5" />
                        <span className="text-xs">{t.assignee.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className={cn("px-4 py-2.5 font-mono text-xs", PRIORITY_CLASS[t.priority])}>
                    {PRIORITY_LABEL[t.priority]}
                  </td>
                  <td className="px-4 py-2.5">
                    {t.dueDate ? (
                      <span
                        className={cn(
                          "font-mono text-xs",
                          isOverdue(t.dueDate, t.status) && "text-destructive"
                        )}
                      >
                        {format(t.dueDate, "d MMM yyyy")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Tidak ada tugas yang cocok.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
