import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCompany } from "@/lib/company";
import { serializeProduct } from "@/lib/serialize";
import { recomputeMatches } from "@/lib/g2b";

export async function POST(req: NextRequest) {
  const company = await getOrCreateCompany();
  const body = await req.json().catch(() => ({}));

  const product = await prisma.product.create({
    data: {
      companyId: company.id,
      name: typeof body.name === "string" && body.name.trim() ? body.name : "새 제품",
      itemCode: body.itemCode ?? null,
      priceMin: body.priceMin ?? null,
      priceMax: body.priceMax ?? null,
    },
  });

  await recomputeMatches();

  return NextResponse.json(serializeProduct(product), { status: 201 });
}
