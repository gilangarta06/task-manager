import Link from "next/link";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parse,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { taskCode } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

type SearchParams = Promise<{ w?: string }>;

function humanDuration(ms: number) {
  const hours = ms / 3_600_000;
  if (hours < 24) return `${hours.toFixed(1)} jam`;
  return `${(hours / 24).toFixed(1)} hari`;
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const { w } = await searchParams;

  const anchor = w ? parse(w, "yyyy-MM-dd", new Date()) : new Date();
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 });

  const [completed, created, active] = await Promise.all([
    prisma.task.findMany({
      where: { completedAt: { gte: weekStart, lte: weekEnd } },
      orderBy: { completedAt: "asc" },
      select: {
        number: true,
        title: true,
        startedAt: true,
        completedAt: true,
        assignee: { select: { name: true, color: true } },
        project: { select: { name: true, color: true } },
      },
    }),
    prisma.task.count({ where: { createdAt: { gte: weekStart, lte: weekEnd } } }),
    prisma.task.count({ where: { status: { notIn: ["DONE", "BACKLOG"] } } }),
  ]);

  const durations = completed
    .filter((t) => t.startedAt && t.completedAt)
    .map((t) => t.completedAt!.getTime() - t.startedAt!.getTime());
  const avgDuration = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : null;

  const byPerson = new Map<string, { name: string; color: string; count: number }>();
  for (const t of completed) {
    if (!t.assignee) continue;
    const entry = byPerson.get(t.assignee.name) ?? { ...t.assignee, count: 0 };
    entry.count += 1;
    byPerson.set(t.assignee.name, entry);
  }

  const byProject = new Map<string, { name: string; color: string; count: number }>();
  for (const t of completed) {
    const key = t.project?.name ?? "Tanpa proyek";
    const color = t.project?.color ?? "#5c6874";
    const entry = byProject.get(key) ?? { name: key, color, count: 0 };
    entry.count += 1;
    byProject.set(key, entry);
  }

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const perDay = days.map((d) => ({
    day: d,
    count: completed.filter((t) => t.completedAt && isSameDay(t.completedAt, d)).length,
  }));
  const maxDay = Math.max(1, ...perDay.map((d) => d.count));

  const prev = format(subWeeks(weekStart, 1), "yyyy-MM-dd");
  const nextW = format(addWeeks(weekStart, 1), "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Laporan mingguan</h1>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "d MMM", { locale: idLocale })} –{" "}
            {format(weekEnd, "d MMM yyyy", { locale: idLocale })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/reports?w=${prev}`}
            className="rounded-md border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Minggu sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/reports?w=${nextW}`}
            className="rounded-md border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Minggu berikutnya"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Selesai minggu ini" value={String(completed.length)} />
        <Stat label="Tugas baru" value={String(created)} />
        <Stat label="Rata-rata pengerjaan" value={avgDuration ? humanDuration(avgDuration) : "—"} />
        <Stat label="Masih aktif" value={String(active)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Penyelesaian per hari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            {perDay.map(({ day, count }) => (
              <div key={day.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {count}
                </span>
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${(count / maxDay) * 96 + 4}px` }}
                />
                <span className="font-mono text-[11px] uppercase text-muted-foreground">
                  {format(day, "EEEEEE", { locale: idLocale })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per orang</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {byPerson.size === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada penyelesaian.</p>
            ) : (
              [...byPerson.values()]
                .sort((a, b) => b.count - a.count)
                .map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-sm">
                    <Avatar name={p.name} color={p.color} className="size-5" />
                    <span>{p.name}</span>
                    <span className="ml-auto font-mono tabular-nums text-muted-foreground">
                      {p.count}
                    </span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per proyek</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {byProject.size === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada penyelesaian.</p>
            ) : (
              [...byProject.values()]
                .sort((a, b) => b.count - a.count)
                .map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span>{p.name}</span>
                    <span className="ml-auto font-mono tabular-nums text-muted-foreground">
                      {p.count}
                    </span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tugas selesai</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {completed.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada tugas selesai minggu ini.</p>
          ) : (
            completed.map((t) => (
              <Link
                key={t.number}
                href={`/tasks/${t.number}`}
                className="flex items-center gap-2 rounded-md border p-2 text-sm hover:border-primary/40"
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {taskCode(t.number)}
                </span>
                <span className="truncate">{t.title}</span>
                {t.startedAt && t.completedAt ? (
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                    {humanDuration(t.completedAt.getTime() - t.startedAt.getTime())}
                  </span>
                ) : null}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
