import { prisma } from "@/lib/prisma";

/**
 * Single-tenant app: one workspace = one company. Creates a blank company
 * on first access instead of running an auth/signup flow.
 */
export async function getOrCreateCompany() {
  const existing = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    include: { products: { orderBy: { createdAt: "asc" } } },
  });
  if (existing) return existing;

  return prisma.company.create({
    data: { name: "내 회사" },
    include: { products: { orderBy: { createdAt: "asc" } } },
  });
}
