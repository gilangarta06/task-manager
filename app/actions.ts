"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";
import { z } from "zod";
import type { Prisma, Status } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSession } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { SESSION_COOKIE, clampProgress, suggestedStatusForProgress } from "@/lib/workflow";

async function currentUserId() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.id;
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    return { error: "Email atau password salah." };
  }

  const token = signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

const createTaskSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).default("TODO"),
  assigneeId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function createTask(raw: z.input<typeof createTaskSchema>) {
  const authorId = await currentUserId();
  const data = createTaskSchema.parse(raw);

  const last = await prisma.task.findFirst({
    where: { status: data.status },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      status: data.status,
      assigneeId: data.assigneeId || null,
      projectId: data.projectId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdById: authorId,
      order: (last?.order ?? 0) + 1,
      startedAt: data.status === "IN_PROGRESS" ? new Date() : null,
      updates: {
        create: {
          authorId,
          note: "Tugas dibuat.",
          statusTo: data.status,
          progressFrom: 0,
          progressTo: 0,
        },
      },
    },
  });

  revalidateAll();
  return { number: task.number };
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).optional(),
  blockedReason: z.string().max(500).nullable().optional(),
});

export async function updateTask(taskId: string, raw: z.input<typeof patchSchema>) {
  const authorId = await currentUserId();
  const patch = patchSchema.parse(raw);

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Tugas tidak ditemukan.");

  const data: Prisma.TaskUpdateInput = {};

  if (patch.title !== undefined) data.title = patch.title;
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.priority !== undefined) data.priority = patch.priority;
  if (patch.assigneeId !== undefined)
    data.assignee = patch.assigneeId ? { connect: { id: patch.assigneeId } } : { disconnect: true };
  if (patch.projectId !== undefined)
    data.project = patch.projectId ? { connect: { id: patch.projectId } } : { disconnect: true };
  if (patch.dueDate !== undefined) data.dueDate = patch.dueDate ? new Date(patch.dueDate) : null;

  let statusChanged = false;
  if (patch.status !== undefined && patch.status !== task.status) {
    statusChanged = true;
    const next = patch.status as Status;
    data.status = next;

    if (next === "BLOCKED") {
      data.blockedReason = patch.blockedReason || "Diblokir";
    } else {
      data.blockedReason = null;
    }
    if (next === "IN_PROGRESS" && !task.startedAt) data.startedAt = new Date();
    if (next === "DONE") {
      data.completedAt = new Date();
      data.progress = 100;
    }
    if (task.status === "DONE" && next !== "DONE") data.completedAt = null;
  }

  const updated = await prisma.task.update({ where: { id: taskId }, data });

  if (statusChanged) {
    await prisma.taskUpdate.create({
      data: {
        taskId,
        authorId,
        statusFrom: task.status,
        statusTo: updated.status,
        progressFrom: task.progress,
        progressTo: updated.progress,
        note: patch.status === "BLOCKED" ? updated.blockedReason : null,
      },
    });
  }

  revalidateAll();
}

const progressSchema = z.object({
  progress: z.number().int().min(0).max(100),
  note: z.string().max(2000).optional().nullable(),
});

export async function addProgressUpdate(taskId: string, raw: z.input<typeof progressSchema>) {
  const authorId = await currentUserId();
  const { progress, note } = progressSchema.parse(raw);

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Tugas tidak ditemukan.");
  if (task.status === "DONE") throw new Error("Tugas sudah selesai. Buka kembali dulu untuk mengubah progress.");

  const nextProgress = clampProgress(progress);
  const suggested = suggestedStatusForProgress(task.status, nextProgress);
  const nextStatus: Status = suggested ?? task.status;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      progress: nextProgress,
      status: nextStatus,
      startedAt: task.startedAt ?? (nextProgress > 0 ? new Date() : null),
    },
  });

  await prisma.taskUpdate.create({
    data: {
      taskId,
      authorId,
      note: note?.trim() || null,
      progressFrom: task.progress,
      progressTo: nextProgress,
      statusFrom: nextStatus !== task.status ? task.status : null,
      statusTo: nextStatus !== task.status ? nextStatus : null,
    },
  });

  revalidateAll();
}

export async function addComment(taskId: string, body: string) {
  const authorId = await currentUserId();
  const text = body.trim();
  if (!text) throw new Error("Komentar kosong.");

  await prisma.comment.create({ data: { taskId, authorId, body: text.slice(0, 4000) } });
  revalidateAll();
}

export async function addSubtask(taskId: string, title: string) {
  await currentUserId();
  const text = title.trim();
  if (!text) return;

  const last = await prisma.subtask.findFirst({
    where: { taskId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.subtask.create({
    data: { taskId, title: text.slice(0, 200), order: (last?.order ?? 0) + 1 },
  });
  revalidateAll();
}

export async function toggleSubtask(subtaskId: string, done: boolean) {
  await currentUserId();
  await prisma.subtask.update({ where: { id: subtaskId }, data: { done } });
  revalidateAll();
}

export async function removeSubtask(subtaskId: string) {
  await currentUserId();
  await prisma.subtask.delete({ where: { id: subtaskId } });
  revalidateAll();
}

export async function removeAttachment(attachmentId: string) {
  await currentUserId();
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment) return;

  if (attachment.url.startsWith("/uploads/")) {
    try {
      await unlink(path.join(process.cwd(), "public", attachment.url));
    } catch {
      void 0;
    }
  }
  await prisma.attachment.delete({ where: { id: attachmentId } });
  revalidateAll();
}

const projectSchema = z.object({
  name: z.string().min(1).max(120),
  color: z.string().max(20).optional(),
  description: z.string().max(1000).optional().nullable(),
});

export async function createProject(raw: z.input<typeof projectSchema>) {
  const createdById = await currentUserId();
  const data = projectSchema.parse(raw);
  await prisma.project.create({
    data: {
      name: data.name,
      color: data.color || "#5c6874",
      description: data.description || null,
      createdById,
    },
  });
  revalidateAll();
}

export async function setProjectArchived(projectId: string, archived: boolean) {
  await currentUserId();
  await prisma.project.update({ where: { id: projectId }, data: { archived } });
  revalidateAll();
}

export async function reorderTask(taskId: string, status: Status, order: number) {
  const authorId = await currentUserId();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  const data: Prisma.TaskUpdateInput = { order };
  let statusChanged = false;

  if (status !== task.status) {
    statusChanged = true;
    data.status = status;
    if (status === "IN_PROGRESS" && !task.startedAt) data.startedAt = new Date();
    if (status === "DONE") {
      data.completedAt = new Date();
      data.progress = 100;
    }
    if (status !== "BLOCKED") data.blockedReason = null;
    if (task.status === "DONE" && status !== "DONE") data.completedAt = null;
  }

  const updated = await prisma.task.update({ where: { id: taskId }, data });

  if (statusChanged) {
    await prisma.taskUpdate.create({
      data: {
        taskId,
        authorId,
        statusFrom: task.status,
        statusTo: updated.status,
        progressFrom: task.progress,
        progressTo: updated.progress,
      },
    });
  }

  revalidateAll();
}
