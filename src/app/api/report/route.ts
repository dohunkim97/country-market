import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCompany } from "@/lib/company";
import type { YearlyReportRow } from "@/lib/types";

/**
 * 연간 리포트: 매칭된 공고(관심없음 처리 포함) 대비 실제로 입찰한 공고의 비율.
 * 연도는 공고 게시일(bid.postedAt) 기준.
 */
export async function GET() {
  const company = await getOrCreateCompany();

  const matches = await prisma.match.findMany({
    where: { companyId: company.id },
    select: { applied: true, bid: { select: { id: true, postedAt: true } } },
  });

  const bidsByYear = new Map<number, Map<string, boolean>>();
  for (const m of matches) {
    const year = m.bid.postedAt.getFullYear();
    if (!bidsByYear.has(year)) bidsByYear.set(year, new Map());
    const yearMap = bidsByYear.get(year)!;
    // a bid can appear via multiple product matches; applied is kept consistent
    // across them, so last-write is fine.
    yearMap.set(m.bid.id, m.applied);
  }

  const rows: YearlyReportRow[] = Array.from(bidsByYear.entries())
    .map(([year, bidMap]) => {
      const matchedBidCount = bidMap.size;
      const appliedBidCount = Array.from(bidMap.values()).filter(Boolean).length;
      return {
        year,
        matchedBidCount,
        appliedBidCount,
        appliedRate: matchedBidCount === 0 ? 0 : (appliedBidCount / matchedBidCount) * 100,
      };
    })
    .sort((a, b) => a.year - b.year);

  return NextResponse.json(rows);
}
