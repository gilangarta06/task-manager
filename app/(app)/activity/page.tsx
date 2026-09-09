import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { taskCode } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_LABEL } from "@/lib/workflow";

export default async function ActivityPage() {
  await requireUser();

  const [updates, comments] = await Promise.all([
    prisma.taskUpdate.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        author: { select: { name: true, color: true } },
        task: { select: { number: true, title: true } },
      },
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        author: { select: { name: true, color: true } },
        task: { select: { number: true, title: true } },
      },
    }),
  ]);

  const entries = [
    ...updates.map((u) => ({ kind: "update" as const, at: u.createdAt, data: u })),
    ...comments.map((c) => ({ kind: "comment" as const, at: c.createdAt, data: c })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Aktivitas</h1>
        <p className="text-sm text-muted-foreground">Semua update &amp; komentar, terbaru di atas.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          {entries.map((entry) => (
            <div key={`${entry.kind}-${entry.data.id}`} className="flex items-start gap-3 text-sm">
              <Avatar
                name={entry.data.author.name}
                color={entry.data.author.color}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{entry.data.author.name}</span>{" "}
                  {entry.kind === "comment"
                    ? "berkomentar di"
                    : describeUpdate(entry.data)}{" "}
                  <Link
                    href={`/tasks/${entry.data.task.number}`}
                    className="font-mono text-xs text-foreground hover:underline"
                  >
                    {taskCode(entry.data.task.number)}
                  </Link>{" "}
                  <span className="text-muted-foreground">— {entry.data.task.title}</span>
                </p>
                {entry.kind === "comment" ? (
                  <p className="whitespace-pre-wrap text-muted-foreground">{entry.data.body}</p>
                ) : entry.data.note ? (
                  <p className="whitespace-pre-wrap text-muted-foreground">{entry.data.note}</p>
                ) : null}
                <p className="font-mono text-[11px] text-muted-foreground">
                  {format(entry.at, "d MMM yyyy, HH:mm", { locale: idLocale })}
                </p>
              </div>
            </div>
          ))}
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function describeUpdate(u: {
  progressFrom: number | null;
  progressTo: number | null;
  statusFrom: string | null;
  statusTo: string | null;
}) {
  if (u.progressFrom != null && u.progressTo != null && u.progressFrom !== u.progressTo) {
    return `menaikkan progress ${u.progressFrom}% → ${u.progressTo}% di`;
  }
  if (u.statusTo) {
    return `mengubah status → ${STATUS_LABEL[u.statusTo as keyof typeof STATUS_LABEL]} di`;
  }
  return "memberi catatan di";
}
