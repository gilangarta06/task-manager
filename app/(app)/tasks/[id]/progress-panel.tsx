"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Status } from "@prisma/client";
import { addProgressUpdate } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ui/progress-bar";

export function ProgressPanel({
  taskId,
  progress,
  status,
}: {
  taskId: string;
  progress: number;
  status: Status;
}) {
  const [value, setValue] = useState(progress);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const closed = status === "DONE";
  const dirty = value !== progress || note.trim().length > 0;

  function submit() {
    startTransition(async () => {
      try {
        await addProgressUpdate(taskId, { progress: value, note: note.trim() || null });
        setNote("");
        toast.success("Progress diperbarui.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menyimpan progress.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Progress</CardTitle>
        <span className="font-mono text-lg font-semibold tabular-nums">{value}%</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ProgressBar value={value} className="h-2" />
        {closed ? (
          <p className="text-sm text-muted-foreground">
            Tugas selesai. Ubah status dari <strong>Done</strong> untuk melanjutkan pengerjaan.
          </p>
        ) : (
          <>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Progress"
            />
            <div className="flex gap-1.5">
              {[0, 25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue(p)}
                  className="rounded border px-2 py-0.5 font-mono text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Apa yang berubah? (opsional)"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {value >= 100 && status !== "REVIEW"
                  ? "100% → status otomatis pindah ke Review."
                  : "Perubahan tersimpan di timeline."}
              </p>
              <Button size="sm" onClick={submit} disabled={pending || !dirty}>
                {pending ? "Menyimpan…" : "Simpan update"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
