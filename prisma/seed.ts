import { PrismaClient, type Status, type Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash(process.env.SEED_PASSWORD || "changeme123", 10);

  const owner = await prisma.user.upsert({
    where: { email: process.env.OWNER_EMAIL || "owner@task-manager.local" },
    update: {},
    create: {
      email: process.env.OWNER_EMAIL || "owner@task-manager.local",
      name: process.env.OWNER_NAME || "Owner",
      password,
      role: "OWNER",
      color: "#1e5fd6",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: process.env.MEMBER_EMAIL || "anggota@task-manager.local" },
    update: {},
    create: {
      email: process.env.MEMBER_EMAIL || "anggota@task-manager.local",
      name: process.env.MEMBER_NAME || "Anggota",
      password,
      role: "MEMBER",
      color: "#0f8a4c",
    },
  });

  const existing = await prisma.task.count();
  if (existing > 0) {
    console.log("Tasks already present, skipping sample data.");
    return;
  }

  const maintenance = await prisma.project.create({
    data: { name: "Maintenance", color: "#c2410c", createdById: owner.id },
  });
  const housekeeping = await prisma.project.create({
    data: { name: "Housekeeping", color: "#0f8a4c", createdById: owner.id },
  });
  const revenue = await prisma.project.create({
    data: { name: "Revenue", color: "#1e5fd6", createdById: owner.id },
  });

  type Seed = {
    title: string;
    status: Status;
    progress: number;
    priority: Priority;
    projectId: string;
    assigneeId: string;
    dueInDays?: number;
    description?: string;
    subtasks?: string[];
  };

  const seeds: Seed[] = [
    {
      title: "Perbaiki AC kamar 204 & cek unit lantai 2",
      status: "IN_PROGRESS",
      progress: 60,
      priority: "HIGH",
      projectId: maintenance.id,
      assigneeId: member.id,
      dueInDays: 2,
      description: "Kompresor kamar 204 sudah diganti, tinggal isi freon. Unit lantai 2 belum dicek.",
      subtasks: ["Bongkar unit 204", "Ganti kompresor", "Isi freon", "Cek unit lantai 2"],
    },
    {
      title: "Ganti seprai stok baru lantai 3",
      status: "TODO",
      progress: 0,
      priority: "MEDIUM",
      projectId: housekeeping.id,
      assigneeId: member.id,
      dueInDays: 4,
    },
    {
      title: "Audit stok minibar",
      status: "TODO",
      progress: 0,
      priority: "LOW",
      projectId: housekeeping.id,
      assigneeId: owner.id,
    },
    {
      title: "Update harga OTA untuk weekend",
      status: "IN_PROGRESS",
      progress: 30,
      priority: "MEDIUM",
      projectId: revenue.id,
      assigneeId: owner.id,
      dueInDays: 1,
    },
    {
      title: "Foto ulang kamar deluxe",
      status: "REVIEW",
      progress: 100,
      priority: "MEDIUM",
      projectId: revenue.id,
      assigneeId: member.id,
    },
    {
      title: "Pasang CCTV lobby",
      status: "DONE",
      progress: 100,
      priority: "HIGH",
      projectId: maintenance.id,
      assigneeId: member.id,
    },
  ];

  let order = 0;
  for (const seed of seeds) {
    order += 1;
    const now = new Date();
    const task = await prisma.task.create({
      data: {
        title: seed.title,
        description: seed.description,
        status: seed.status,
        progress: seed.progress,
        priority: seed.priority,
        projectId: seed.projectId,
        assigneeId: seed.assigneeId,
        createdById: owner.id,
        order,
        dueDate:
          seed.dueInDays != null
            ? new Date(now.getTime() + seed.dueInDays * 86400000)
            : null,
        startedAt: seed.status === "IN_PROGRESS" || seed.progress > 0 ? now : null,
        completedAt: seed.status === "DONE" ? now : null,
        subtasks: seed.subtasks
          ? {
              create: seed.subtasks.map((title, i) => ({
                title,
                order: i,
                done: seed.progress >= ((i + 1) / seed.subtasks!.length) * 100,
              })),
            }
          : undefined,
        updates: {
          create: {
            authorId: owner.id,
            note: "Tugas dibuat.",
            statusFrom: null,
            statusTo: seed.status,
            progressFrom: 0,
            progressTo: seed.progress,
          },
        },
      },
    });
    console.log(`  seeded TSK-${task.number.toString().padStart(3, "0")} — ${task.title}`);
  }

  console.log("\nSeed done.");
  console.log(`  Owner:  ${owner.email}`);
  console.log(`  Member: ${member.email}`);
  console.log(`  Password: ${process.env.SEED_PASSWORD || "changeme123"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
