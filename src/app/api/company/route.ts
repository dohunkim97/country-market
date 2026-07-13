import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCompany } from "@/lib/company";
import { serializeCompany } from "@/lib/serialize";

export async function GET() {
  const company = await getOrCreateCompany();
  return NextResponse.json(serializeCompany(company));
}

const EDITABLE_FIELDS = [
  "name",
  "alertEmail",
  "emailConnected",
  "webhookUrl",
  "webhookConnected",
  "scoreThreshold",
  "reminderD7",
  "reminderD3",
  "reminderD1",
] as const;

export async function PATCH(req: NextRequest) {
  const company = await getOrCreateCompany();
  const body = await req.json();

  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  const updated = await prisma.company.update({
    where: { id: company.id },
    data,
    include: { products: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json(serializeCompany(updated));
}
