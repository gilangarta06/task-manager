"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addComment } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ taskId }: { taskId: string }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!body.trim()) return;
    const value = body;
    startTransition(async () => {
      try {
        await addComment(taskId, value);
        setBody("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal mengirim komentar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Tulis komentar…"
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={pending || !body.trim()}>
          {pending ? "Mengirim…" : "Kirim"}
        </Button>
      </div>
    </div>
  );
}
