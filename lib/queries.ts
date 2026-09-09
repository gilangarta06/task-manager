import { prisma } from "@/lib/prisma";

export async function getFormOptions() {
  const [users, projects] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({
      where: { archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return { users, projects };
}
