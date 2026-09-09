import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getFormOptions } from "@/lib/queries";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { BoardView } from "./board-view";

export default async function BoardPage() {
  const user = await requireUser();
  const { users, projects } = await getFormOptions();

  const tasks = await prisma.task.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      progress: true,
      priority: true,
      dueDate: true,
      order: true,
      assignee: { select: { name: true, color: true } },
      project: { select: { name: true, color: true } },
      _count: { select: { comments: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Papan</h1>
          <p className="text-sm text-muted-foreground">
            Pindahkan tugas antar status. Perubahan tercatat di timeline.
          </p>
        </div>
        <NewTaskDialog users={users} projects={projects} defaultAssigneeId={user.id} />
      </div>

      <BoardView tasks={tasks} />
    </div>
  );
}
