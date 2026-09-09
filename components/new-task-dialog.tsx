"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createTask } from "@/app/actions";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PRIORITY_ORDER, PRIORITY_LABEL, STATUS_ORDER, STATUS_LABEL } from "@/lib/workflow";

type Option = { id: string; name: string };

export function NewTaskDialog({
  users,
  projects,
  defaultAssigneeId,
}: {
  users: Option[];
  projects: Option[];
  defaultAssigneeId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await createTask({
          title: String(formData.get("title") || ""),
          description: String(formData.get("description") || "") || null,
          priority: formData.get("priority") as never,
          status: formData.get("status") as never,
          assigneeId: String(formData.get("assigneeId") || "") || null,
          projectId: String(formData.get("projectId") || "") || null,
          dueDate: String(formData.get("dueDate") || "") || null,
        });
        setOpen(false);
        toast.success("Tugas dibuat.");
        if (result?.number) router.push(`/tasks/${result.number}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal membuat tugas.");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="size-4" />
        Tambah tugas
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah tugas"
        description="Isi minimal judul. Sisanya bisa dilengkapi nanti di halaman tugas."
      >
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" name="title" required autoFocus placeholder="mis. Perbaiki AC kamar 204" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" name="description" placeholder="Detail, langkah, catatan…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue="TODO">
                {STATUS_ORDER.filter((s) => s !== "BLOCKED").map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="priority">Prioritas</Label>
              <Select id="priority" name="priority" defaultValue="MEDIUM">
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assigneeId">Penanggung jawab</Label>
              <Select id="assigneeId" name="assigneeId" defaultValue={defaultAssigneeId || ""}>
                <option value="">— Belum ditugaskan —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="projectId">Proyek</Label>
              <Select id="projectId" name="projectId" defaultValue="">
                <option value="">— Tanpa proyek —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dueDate">Jatuh tempo</Label>
            <Input id="dueDate" name="dueDate" type="date" className="w-full" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan…" : "Buat tugas"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
