import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeMatch } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

/**
 * Toggles "우리 회사가 이 공고에 입찰했는지" (no such field exists in the G2B API,
 * so this is a manual flag). Applied to every Match row for the same bid, since
 * one company submits at most one bid per notice regardless of how many of its
 * products the notice happened to match.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.match.findUniqueOrThrow({ where: { id } });
  const nextApplied = !existing.applied;

  await prisma.match.updateMany({
    where: { bidId: existing.bidId, companyId: existing.companyId },
    data: { applied: nextApplied, appliedAt: nextApplied ? new Date() : null },
  });

  const match = await prisma.match.findUniqueOrThrow({
    where: { id },
    include: { bid: true, product: true },
  });

  return NextResponse.json(serializeMatch(match));
}
