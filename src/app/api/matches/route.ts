import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCompany } from "@/lib/company";
import { serializeMatch } from "@/lib/serialize";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const company = await getOrCreateCompany();
  const includeDismissed = req.nextUrl.searchParams.get("includeDismissed") === "1";
  const status = req.nextUrl.searchParams.get("status") ?? "open"; // upcoming | open | closed | all
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "200");
  const postedWithinDays = req.nextUrl.searchParams.get("postedWithinDays");

  const now = new Date();

  let bidWhere: Prisma.BidWhereInput = {};
  let orderBy: Prisma.MatchOrderByWithRelationInput = { bid: { deadline: "asc" } };

  if (status === "upcoming") {
    // 공고는 등록됐지만 입찰시작일시(bidBeginDt)가 아직 안 지남 — 준비 기간.
    bidWhere = { bidBeginDt: { gt: now }, deadline: { gte: now } };
    orderBy = { bid: { bidBeginDt: "asc" } };
  } else if (status === "open") {
    bidWhere = {
      OR: [{ bidBeginDt: null }, { bidBeginDt: { lte: now } }],
      deadline: { gte: now },
    };
  } else if (status === "closed") {
    bidWhere = { deadline: { lt: now } };
    orderBy = { bid: { deadline: "desc" } };
  }

  if (postedWithinDays) {
    const days = Number(postedWithinDays);
    if (Number.isFinite(days) && days > 0) {
      bidWhere = { ...bidWhere, postedAt: { gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) } };
    }
  }

  const matches = await prisma.match.findMany({
    where: {
      companyId: company.id,
      ...(includeDismissed ? {} : { dismissedAt: null }),
      ...(Object.keys(bidWhere).length > 0 ? { bid: bidWhere } : {}),
    },
    include: { bid: true, product: true },
    orderBy,
    take: Number.isFinite(limit) ? limit : 200,
  });

  return NextResponse.json(matches.map(serializeMatch));
}
