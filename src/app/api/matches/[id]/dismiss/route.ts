import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeMatch } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const match = await prisma.match.update({
    where: { id },
    data: { dismissedAt: new Date() },
    include: { bid: true, product: true },
  });
  return NextResponse.json(serializeMatch(match));
}
