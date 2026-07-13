import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/serialize";
import { recomputeMatches } from "@/lib/g2b";

type Params = { params: Promise<{ id: string }> };

const EDITABLE_FIELDS = ["name", "itemCode", "priceMin", "priceMax"] as const;

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  const product = await prisma.product.update({ where: { id }, data });
  await recomputeMatches();
  return NextResponse.json(serializeProduct(product));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
