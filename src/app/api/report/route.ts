import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCompany } from "@/lib/company";
import type { YearlyReportRow } from "@/lib/types";

/**
 * 연간 리포트: 매칭된 공고(관심없음 처리 포함) 대비 실제로 입찰한 공고의
 * 건수·예산(추정가격) 비율. 연도는 공고 게시일(bid.postedAt) 기준.
 * ?productId=xxx 로 특정 제품만 볼 수 있음(생략 시 전체 제품 합산).
 */
export async function GET(req: NextRequest) {
  const company = await getOrCreateCompany();
  const productId = req.nextUrl.searchParams.get("productId");

  const matches = await prisma.match.findMany({
    where: { companyId: company.id, ...(productId ? { productId } : {}) },
    select: { applied: true, bid: { select: { id: true, postedAt: true, estPrice: true } } },
  });

  const bidsByYear = new Map<number, Map<string, { applied: boolean; estPrice: number | null }>>();
  for (const m of matches) {
    const year = m.bid.postedAt.getFullYear();
    if (!bidsByYear.has(year)) bidsByYear.set(year, new Map());
    const yearMap = bidsByYear.get(year)!;
    // a bid can appear via multiple product matches (only possible when
    // productId isn't set); applied/estPrice are the same either way, so
    // dedup by bid id keeps it from being double-counted.
    yearMap.set(m.bid.id, {
      applied: m.applied,
      estPrice: m.bid.estPrice != null ? Number(m.bid.estPrice) : null,
    });
  }

  const rows: YearlyReportRow[] = Array.from(bidsByYear.entries())
    .map(([year, bidMap]) => {
      const entries = Array.from(bidMap.values());
      const matchedBidCount = entries.length;
      const appliedEntries = entries.filter((e) => e.applied);
      const appliedBidCount = appliedEntries.length;
      const matchedBudget = entries.reduce((sum, e) => sum + (e.estPrice ?? 0), 0);
      const appliedBudget = appliedEntries.reduce((sum, e) => sum + (e.estPrice ?? 0), 0);
      return {
        year,
        matchedBidCount,
        appliedBidCount,
        appliedRate: matchedBidCount === 0 ? 0 : (appliedBidCount / matchedBidCount) * 100,
        matchedBudget,
        appliedBudget,
        appliedBudgetRate: matchedBudget === 0 ? 0 : (appliedBudget / matchedBudget) * 100,
      };
    })
    .sort((a, b) => a.year - b.year);

  return NextResponse.json(rows);
}
