"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import type { Subtask } from "@prisma/client";
import { addSubtask, toggleSubtask, removeSubtask } from "@/app/actions";
import { ProgressBar } from "@/components/ui/progress-bar";

export function SubtaskList({ taskId, subtasks }: { taskId: string; subtasks: Subtask[] }) {
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const done = subtasks.filter((s) => s.done).length;
  const pct = subtasks.length ? Math.round((done / subtasks.length) * 100) : 0;

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {subtasks.length > 0 ? (
        <div className="flex items-center gap-2">
          <ProgressBar value={pct} className="h-1.5" />
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {done}/{subtasks.length}
          </span>
        </div>
      ) : null}

      <ul className="flex flex-col gap-1">
        {subtasks.map((s) => (
          <li key={s.id} className="group flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.done}
              disabled={pending}
              onChange={(e) => run(() => toggleSubtask(s.id, e.target.checked))}
              className="size-4 accent-primary"
            />
            <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.title}</span>
            <button
              type="button"
              onClick={() => run(() => removeSubtask(s.id))}
              className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Hapus"
            >
              <X className="size-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const value = title;
          setTitle("");
          run(() => addSubtask(taskId, value));
        }}
        className="flex items-center gap-2"
      >
        <Plus className="size-4 text-muted-foreground" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tambah langkah…"
          className="flex-1 border-b border-transparent bg-transparent py-1 text-sm outline-none focus:border-input"
        />
      </form>
    </div>
  );
}
