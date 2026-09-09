"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, ImageIcon, Paperclip, X } from "lucide-react";
import type { Attachment } from "@prisma/client";
import { removeAttachment } from "@/app/actions";
import { Button } from "@/components/ui/button";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentPanel({
  taskId,
  attachments,
}: {
  taskId: string;
  attachments: Attachment[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("file", file);
        body.set("taskId", taskId);
        const res = await fetch("/api/upload", { method: "POST", body });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Gagal mengunggah.");
        }
      }
      toast.success("File terunggah.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengunggah.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {attachments.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {attachments.map((a) => {
            const isImage = a.mime.startsWith("image/");
            return (
              <li key={a.id} className="group flex items-center gap-2 text-sm">
                {isImage ? (
                  <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                )}
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:underline"
                  title={a.name}
                >
                  {a.name}
                </a>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {formatSize(a.size)}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => removeAttachment(a.id).then(() => router.refresh()))}
                  className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Hapus lampiran"
                >
                  <X className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada lampiran.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="size-4" />
        {uploading ? "Mengunggah…" : "Tambah lampiran"}
      </Button>
    </div>
  );
}
