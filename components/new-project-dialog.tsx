"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createProject } from "@/app/actions";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLORS = ["#1e5fd6", "#0f8a4c", "#c2410c", "#7c3aed", "#be123c", "#5c6874"];

export function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createProject({
          name: String(formData.get("name") || ""),
          color,
          description: String(formData.get("description") || "") || null,
        });
        setOpen(false);
        toast.success("Proyek dibuat.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal membuat proyek.");
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Proyek baru
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Proyek baru">
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-name">Nama</Label>
            <Input id="p-name" name="name" required autoFocus placeholder="mis. Maintenance" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-desc">Deskripsi</Label>
            <Input id="p-desc" name="description" placeholder="Opsional" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Warna</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-6 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-ring" : ""}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan…" : "Buat"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
