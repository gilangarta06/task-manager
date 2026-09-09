import Link from "next/link";
import { Archive, ArchiveRestore } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { setProjectArchived } from "@/app/actions";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { STATUS_LABEL } from "@/lib/workflow";

export default async function ProjectsPage() {
  await requireUser();

  const projects = await prisma.project.findMany({
    orderBy: [{ archived: "asc" }, { name: "asc" }],
    include: {
      tasks: { select: { progress: true, status: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Proyek</h1>
          <p className="text-sm text-muted-foreground">Kelompok tugas &amp; ringkasan progress.</p>
        </div>
        <NewProjectDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => {
          const total = p.tasks.length;
          const avg = total
            ? Math.round(p.tasks.reduce((s, t) => s + t.progress, 0) / total)
            : 0;
          const done = p.tasks.filter((t) => t.status === "DONE").length;
          return (
            <Card key={p.id} className={p.archived ? "opacity-60" : undefined}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {p.description ? (
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <form action={setProjectArchived.bind(null, p.id, !p.archived)}>
                    <button
                      type="submit"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title={p.archived ? "Aktifkan" : "Arsipkan"}
                    >
                      {p.archived ? (
                        <ArchiveRestore className="size-4" />
                      ) : (
                        <Archive className="size-4" />
                      )}
                    </button>
                  </form>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{avg}% rata-rata</span>
                    <span className="font-mono tabular-nums">
                      {done}/{total} {STATUS_LABEL.DONE}
                    </span>
                  </div>
                  <ProgressBar value={avg} />
                </div>

                <Link
                  href={`/tasks?project=${p.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Lihat tugas →
                </Link>
              </CardContent>
            </Card>
          );
        })}
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada proyek.</p>
        ) : null}
      </div>
    </div>
  );
}
