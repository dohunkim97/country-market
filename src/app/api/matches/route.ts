import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCompany } from "@/lib/company";
import { serializeMatch } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const company = await getOrCreateCompany();
  const includeDismissed = req.nextUrl.searchParams.get("includeDismissed") === "1";
  const status = req.nextUrl.searchParams.get("status") ?? "open"; // open | closed | all
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "200");

  const now = new Date();
  const deadlineFilter =
    status === "closed" ? { lt: now } : status === "open" ? { gte: now } : undefined;

  const matches = await prisma.match.findMany({
    where: {
      companyId: company.id,
      ...(includeDismissed ? {} : { dismissedAt: null }),
      ...(deadlineFilter ? { bid: { deadline: deadlineFilter } } : {}),
    },
    include: { bid: true, product: true },
    orderBy: { bid: { deadline: status === "closed" ? "desc" : "asc" } },
    take: Number.isFinite(limit) ? limit : 200,
  });

  return NextResponse.json(matches.map(serializeMatch));
}
