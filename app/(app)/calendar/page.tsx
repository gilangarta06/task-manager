import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { cn, taskCode } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { STATUS_CLASS, STATUS_LABEL } from "@/lib/workflow";

type SearchParams = Promise<{ m?: string }>;

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const { m } = await searchParams;

  const anchor = m ? parse(m, "yyyy-MM", new Date()) : new Date();
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const tasks = await prisma.task.findMany({
    where: { dueDate: { gte: gridStart, lte: gridEnd } },
    orderBy: { dueDate: "asc" },
    select: {
      number: true,
      title: true,
      status: true,
      dueDate: true,
      assignee: { select: { name: true, color: true } },
    },
  });

  const prev = format(subMonths(monthStart, 1), "yyyy-MM");
  const next = format(addMonths(monthStart, 1), "yyyy-MM");
  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Kalender</h1>
          <p className="text-sm text-muted-foreground">Tugas menurut jatuh tempo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?m=${prev}`}
            className="rounded-md border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="min-w-36 text-center text-sm font-medium">
            {format(monthStart, "MMMM yyyy", { locale: idLocale })}
          </span>
          <Link
            href={`/calendar?m=${next}`}
            className="rounded-md border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {weekdays.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(t.dueDate, day));
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-24 border-b border-r p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                  !isSameMonth(day, monthStart) && "bg-muted/30 text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "mb-1 inline-flex size-6 items-center justify-center rounded-full font-mono text-xs tabular-nums",
                    isToday(day) && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="flex flex-col gap-1">
                  {dayTasks.map((t) => (
                    <Link
                      key={t.number}
                      href={`/tasks/${t.number}`}
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                        STATUS_CLASS[t.status]
                      )}
                      title={`${taskCode(t.number)} · ${t.title} · ${STATUS_LABEL[t.status]}`}
                    >
                      {t.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
