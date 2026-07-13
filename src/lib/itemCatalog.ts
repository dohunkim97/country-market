import { prisma } from "@/lib/prisma";

export type CatalogEntry = { name: string; code: string | null };

const CACHE_TTL_MS = 10 * 60 * 1000;

let cache: { entries: CatalogEntry[]; fetchedAt: number } | null = null;

/**
 * Distinct 품명/품목코드 pairs seen across scraped G2B bids, used as a stand-in
 * "등록 품목" dictionary for the product-name autocomplete — there's no separate
 * approved data.go.kr service for this, so we reuse what the bid scraper already
 * pulls in. Cached in memory since the underlying set changes slowly (only grows
 * as new scrapes run).
 */
export async function getItemCatalog(): Promise<CatalogEntry[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.entries;

  const rows = await prisma.bid.findMany({
    where: { itemName: { not: "" } },
    distinct: ["itemName"],
    select: { itemName: true, itemCode: true },
    orderBy: { itemName: "asc" },
    take: 5000,
  });

  const entries = rows.map((r) => ({ name: r.itemName, code: r.itemCode }));
  cache = { entries, fetchedAt: Date.now() };
  return entries;
}
