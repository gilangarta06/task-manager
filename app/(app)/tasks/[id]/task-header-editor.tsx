"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { updateTask } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function TaskHeaderEditor({
  taskId,
  title,
  description,
}: {
  taskId: string;
  title: string;
  description: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [descValue, setDescValue] = useState(description ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    if (!titleValue.trim()) {
      toast.error("Judul tidak boleh kosong.");
      return;
    }
    startTransition(async () => {
      try {
        await updateTask(taskId, {
          title: titleValue.trim(),
          description: descValue.trim() || null,
        });
        setEditing(false);
        toast.success("Tugas diperbarui.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menyimpan.");
      }
    });
  }

  if (!editing) {
    return (
      <div className="group">
        <div className="flex items-start gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Edit tugas"
          >
            <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        {description ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{description}</p>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 text-sm text-muted-foreground/70 hover:text-foreground"
          >
            + Tambah deskripsi
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={titleValue}
        onChange={(e) => setTitleValue(e.target.value)}
        className="text-base font-medium"
        autoFocus
      />
      <Textarea
        value={descValue}
        onChange={(e) => setDescValue(e.target.value)}
        placeholder="Deskripsi…"
        className="min-h-24"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setTitleValue(title);
            setDescValue(description ?? "");
            setEditing(false);
          }}
        >
          Batal
        </Button>
      </div>
    </div>
  );
}
