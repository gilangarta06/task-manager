import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const taskId = String(form.get("taskId") || "");

  if (!(file instanceof File) || !taskId) {
    return NextResponse.json({ error: "File dan taskId wajib ada." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file maksimal 10MB." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Tipe file tidak didukung." }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, number: true } });
  if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });

  const ext = path.extname(file.name).slice(0, 10) || "";
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  await prisma.attachment.create({
    data: {
      taskId,
      url: `/uploads/${filename}`,
      name: file.name.slice(0, 200),
      size: file.size,
      mime: file.type,
      uploadedById: user.id,
    },
  });

  revalidatePath(`/tasks/${task.number}`);
  return NextResponse.json({ ok: true });
}
