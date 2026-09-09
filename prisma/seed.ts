import { PrismaClient, type Status, type Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash(process.env.SEED_PASSWORD || "changeme123", 10);

  const owner = await prisma.user.upsert({
    where: { email: process.env.OWNER_EMAIL || "owner@task-manager.local" },
    update: { name: process.env.OWNER_NAME || "Rachman" },
    create: {
      email: process.env.OWNER_EMAIL || "owner@task-manager.local",
      name: process.env.OWNER_NAME || "Rachman",
      password,
      role: "OWNER",
      color: "#1e5fd6",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: process.env.MEMBER_EMAIL || "gilang@task-manager.local" },
    update: { name: process.env.MEMBER_NAME || "Gilang" },
    create: {
      email: process.env.MEMBER_EMAIL || "gilang@task-manager.local",
      name: process.env.MEMBER_NAME || "Gilang",
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

  type Seed = {
    title: string;
    status: Status;
    progress: number;
    priority: Priority;
  };

  const seeds: Seed[] = [
    { title: "Daftar AirBNB", status: "TODO", progress: 0, priority: "MEDIUM" },
    {
      title: "Rekap Multiplier dan Promo OTA, Potongan OTA",
      status: "IN_PROGRESS",
      progress: 90,
      priority: "MEDIUM",
    },
    { title: "Log Pergantian Shift", status: "IN_PROGRESS", progress: 95, priority: "MEDIUM" },
    {
      title: "Ratedist UI UX dan Development",
      status: "IN_PROGRESS",
      progress: 60,
      priority: "MEDIUM",
    },
  ];

  let order = 0;
  for (const seed of seeds) {
    order += 1;
    const now = new Date();
    const task = await prisma.task.create({
      data: {
        title: seed.title,
        status: seed.status,
        progress: seed.progress,
        priority: seed.priority,
        assigneeId: member.id,
        createdById: owner.id,
        order,
        startedAt: seed.progress > 0 ? now : null,
        completedAt: seed.status === "DONE" ? now : null,
        updates: {
          create: {
            authorId: owner.id,
            note: "Tugas dibuat.",
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
  console.log(`  Owner:  ${owner.name} <${owner.email}>`);
  console.log(`  Member: ${member.name} <${member.email}>`);
  console.log(`  Password: ${process.env.SEED_PASSWORD || "changeme123"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
