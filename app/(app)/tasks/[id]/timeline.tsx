import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Status } from "@prisma/client";
import { Avatar } from "@/components/ui/avatar";
import { STATUS_LABEL } from "@/lib/workflow";

type Author = { name: string; color: string };

type UpdateEntry = {
  id: string;
  createdAt: Date;
  note: string | null;
  progressFrom: number | null;
  progressTo: number | null;
  statusFrom: Status | null;
  statusTo: Status | null;
  author: Author;
};

type CommentEntry = {
  id: string;
  createdAt: Date;
  body: string;
  author: Author;
};

export function Timeline({
  updates,
  comments,
}: {
  updates: UpdateEntry[];
  comments: CommentEntry[];
}) {
  const entries = [
    ...updates.map((u) => ({ kind: "update" as const, at: u.createdAt, data: u })),
    ...comments.map((c) => ({ kind: "comment" as const, at: c.createdAt, data: c })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>;
  }

  return (
    <ol className="relative flex flex-col gap-4 border-l pl-5">
      {entries.map((entry) => (
        <li key={`${entry.kind}-${entry.data.id}`} className="relative">
          <span
            className={`absolute -left-[27px] top-1 size-3 rounded-full border-2 bg-background ${
              entry.kind === "comment" ? "border-muted-foreground" : "border-primary"
            }`}
          />
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Avatar
              name={entry.data.author.name}
              color={entry.data.author.color}
              className="size-5"
            />
            <span className="text-sm font-medium">{entry.data.author.name}</span>
            {entry.kind === "update" ? (
              <TimelineDelta entry={entry.data} />
            ) : (
              <span className="text-xs text-muted-foreground">berkomentar</span>
            )}
            <span className="font-mono text-[11px] text-muted-foreground">
              {formatDistanceToNow(entry.at, { addSuffix: true, locale: idLocale })}
            </span>
          </div>
          {entry.kind === "comment" ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {entry.data.body}
            </p>
          ) : entry.data.note ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {entry.data.note}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function TimelineDelta({ entry }: { entry: UpdateEntry }) {
  const parts: string[] = [];
  if (
    entry.progressFrom != null &&
    entry.progressTo != null &&
    entry.progressFrom !== entry.progressTo
  ) {
    parts.push(`${entry.progressFrom}% → ${entry.progressTo}%`);
  }
  if (entry.statusTo && entry.statusFrom !== entry.statusTo) {
    parts.push(
      `${entry.statusFrom ? STATUS_LABEL[entry.statusFrom] : "baru"} → ${STATUS_LABEL[entry.statusTo]}`
    );
  }
  if (parts.length === 0) {
    return <span className="text-xs text-muted-foreground">memberi catatan</span>;
  }
  return (
    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
      {parts.join(" · ")}
    </span>
  );
}
