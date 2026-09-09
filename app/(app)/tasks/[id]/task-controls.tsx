"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Status, Priority } from "@prisma/client";
import { updateTask } from "@/app/actions";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  STATUS_ORDER,
  STATUS_LABEL,
  PRIORITY_ORDER,
  PRIORITY_LABEL,
} from "@/lib/workflow";

type Option = { id: string; name: string };

export function TaskControls({
  taskId,
  status,
  priority,
  assigneeId,
  projectId,
  dueDate,
  users,
  projects,
}: {
  taskId: string;
  status: Status;
  priority: Priority;
  assigneeId: string | null;
  projectId: string | null;
  dueDate: string;
  users: Option[];
  projects: Option[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function apply(patch: Parameters<typeof updateTask>[1]) {
    startTransition(async () => {
      try {
        await updateTask(taskId, patch);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menyimpan.");
      }
    });
  }

  function onStatus(next: Status) {
    if (next === status) return;
    if (next === "BLOCKED") {
      const reason = window.prompt("Alasan diblokir?");
      if (reason === null) {
        router.refresh();
        return;
      }
      apply({ status: next, blockedReason: reason || "Diblokir" });
      return;
    }
    apply({ status: next });
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="c-status">Status</Label>
        <Select
          id="c-status"
          value={status}
          disabled={pending}
          onChange={(e) => onStatus(e.target.value as Status)}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="c-priority">Prioritas</Label>
        <Select
          id="c-priority"
          value={priority}
          disabled={pending}
          onChange={(e) => apply({ priority: e.target.value as Priority })}
        >
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="c-assignee">Penanggung jawab</Label>
        <Select
          id="c-assignee"
          value={assigneeId ?? ""}
          disabled={pending}
          onChange={(e) => apply({ assigneeId: e.target.value || null })}
        >
          <option value="">— Belum ditugaskan —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="c-project">Proyek</Label>
        <Select
          id="c-project"
          value={projectId ?? ""}
          disabled={pending}
          onChange={(e) => apply({ projectId: e.target.value || null })}
        >
          <option value="">— Tanpa proyek —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="c-due">Jatuh tempo</Label>
        <Input
          id="c-due"
          type="date"
          defaultValue={dueDate}
          disabled={pending}
          onChange={(e) => apply({ dueDate: e.target.value || null })}
        />
      </div>
    </>
  );
}
