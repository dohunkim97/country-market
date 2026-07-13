import { prisma } from "@/lib/prisma";
import { computeMatch } from "@/lib/matching";

/**
 * 조달청_나라장터 입찰공고정보서비스 (data.go.kr, serviceId 15129394)
 * https://www.data.go.kr/data/15129394/openapi.do
 * Endpoint + field names below verified against a live response on 2026-07-13.
 */

const BASE_URL = "https://apis.data.go.kr/1230000/ad/BidPublicInfoService";

const OPERATIONS = {
  물품: "getBidPblancListInfoThngPPSSrch",
  용역: "getBidPblancListInfoServcPPSSrch",
  공사: "getBidPblancListInfoCnstwkPPSSrch",
} as const;

type Category = keyof typeof OPERATIONS;

const DEBUG_RAW = process.env.G2B_DEBUG === "1";

/** Concurrent DB writes for bid/match upserts — a sequential loop takes ~40min for a 30-day backfill (20k+ rows). */
const UPSERT_CONCURRENCY = 20;

/**
 * The API rejects a single request spanning more than ~30 days with
 * resultCode "07" (입력범위값 초과 에러) — confirmed empirically (45 days fails,
 * 30 days succeeds). Stay a little under that so a wider `hoursBack` still
 * works, split into sequential chunks.
 */
const MAX_CHUNK_HOURS = 24 * 29;

type RawItem = Record<string, unknown>;

function pick(item: RawItem, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = item[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return null;
}

function toNumber(s: string | null): number | null {
  if (s == null) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseKDate(raw: string | null): Date | null {
  if (!raw) return null;
  // "yyyy-MM-dd HH:mm" or "yyyy-MM-dd HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(raw.replace(" ", "T"));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // "yyyyMMddHHmm"
  if (/^\d{12}$/.test(raw)) {
    const y = raw.slice(0, 4);
    const mo = raw.slice(4, 6);
    const da = raw.slice(6, 8);
    const h = raw.slice(8, 10);
    const mi = raw.slice(10, 12);
    const d = new Date(`${y}-${mo}-${da}T${h}:${mi}:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function fmtInqryDt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes())
  );
}

async function fetchCategory(
  category: Category,
  bgnDt: Date,
  endDt: Date
): Promise<RawItem[]> {
  const serviceKey = process.env.G2B_SERVICE_KEY;
  if (!serviceKey) throw new Error("G2B_SERVICE_KEY 환경변수가 설정되어 있지 않습니다.");

  const operation = OPERATIONS[category];
  const items: RawItem[] = [];
  let pageNo = 1;
  const numOfRows = 500;

  while (true) {
    const url = new URL(`${BASE_URL}/${operation}`);
    url.searchParams.set("serviceKey", serviceKey);
    url.searchParams.set("pageNo", String(pageNo));
    url.searchParams.set("numOfRows", String(numOfRows));
    url.searchParams.set("inqryDiv", "1");
    url.searchParams.set("inqryBgnDt", fmtInqryDt(bgnDt));
    url.searchParams.set("inqryEndDt", fmtInqryDt(endDt));
    url.searchParams.set("type", "json");

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`G2B API HTTP ${res.status} (${category}, page ${pageNo})`);
    }
    const json = await res.json();

    // Out-of-range / malformed requests come back in a completely different
    // envelope (no top-level "response" key), e.g. resultCode "07" "입력범위값
    // 초과 에러" when the date range is too wide — must be checked separately
    // or it silently looks like "0 items" instead of an error.
    const errorHeader = json?.["nkoneps.com.response.ResponseError"]?.header;
    if (errorHeader) {
      throw new Error(
        `G2B API 오류 (${category}): ${errorHeader.resultCode} ${errorHeader.resultMsg ?? ""}`
      );
    }

    const header = json?.response?.header;
    if (header && header.resultCode !== "00") {
      throw new Error(
        `G2B API 오류 (${category}): ${header.resultCode} ${header.resultMsg ?? ""}`
      );
    }

    const body = json?.response?.body;
    const rawItems = body?.items;
    const pageItems: RawItem[] = Array.isArray(rawItems)
      ? rawItems
      : rawItems && typeof rawItems === "object"
        ? [rawItems]
        : [];

    if (DEBUG_RAW && pageItems.length > 0 && pageNo === 1) {
      console.log(`[g2b] ${category} sample item keys:`, Object.keys(pageItems[0]));
      console.log(`[g2b] ${category} sample item:`, pageItems[0]);
    }

    items.push(...pageItems);

    const totalCount = Number(body?.totalCount ?? pageItems.length);
    if (pageItems.length < numOfRows || items.length >= totalCount) break;
    pageNo += 1;
    if (pageNo > 40) break; // safety cap (40 * 500 = 20,000 rows/category)
  }

  return items;
}

/** Splits [bgnDt, endDt] into ≤29-day windows (newest first). */
function splitWindows(bgnDt: Date, endDt: Date): [Date, Date][] {
  const windows: [Date, Date][] = [];
  let chunkEnd = endDt;
  while (chunkEnd > bgnDt) {
    const chunkStart = new Date(
      Math.max(bgnDt.getTime(), chunkEnd.getTime() - MAX_CHUNK_HOURS * 60 * 60 * 1000)
    );
    windows.push([chunkStart, chunkEnd]);
    chunkEnd = chunkStart;
  }
  return windows;
}

type MappedBid = {
  bidNtceNo: string;
  title: string;
  agency: string;
  demandOrg: string;
  itemName: string;
  itemCode: string | null;
  estPrice: bigint | null;
  postedAt: Date;
  deadline: Date;
  docUrl: string;
  category: Category;
  bidMethod: string | null;
};

function mapItem(item: RawItem, category: Category): MappedBid | null {
  const bidNtceNo = pick(item, "bidNtceNo");
  const bidNtceOrd = pick(item, "bidNtceOrd") ?? "00";
  const title = pick(item, "bidNtceNm");
  const deadline = parseKDate(
    pick(item, "bidClseDt", "opengDt") ??
      [pick(item, "bidClseDate"), pick(item, "bidClseTm")].filter(Boolean).join(" ")
  );
  const postedAt = parseKDate(pick(item, "bidNtceDt", "rgstDt"));

  if (!bidNtceNo || !title || !deadline || !postedAt) return null;

  const agency = pick(item, "ntceInsttNm") ?? "조달청";
  const demandOrg = pick(item, "dminsttNm") ?? agency;
  // Verified against a live response per category (2026-07-13):
  // 물품 -> dtilPrdctClsfcNoNm, 용역 -> pubPrcrmntClsfcNm/srvceDivNm, 공사 -> mainCnsttyNm.
  const itemName =
    pick(item, "dtilPrdctClsfcNoNm", "pubPrcrmntClsfcNm", "mainCnsttyNm", "srvceDivNm") ??
    title;
  // Paired code, where the category exposes one (공사 has no such code field).
  const itemCode = pick(item, "dtilPrdctClsfcNo", "pubPrcrmntClsfcNo");
  const estPriceNum = toNumber(pick(item, "presmptPrce", "asignBdgtAmt"));
  // Prefer the URL the API itself returns; the g2b.go.kr#PNPE027_01 deep-link
  // format only works reliably in browsers with the "나라장터 딥링크" extension,
  // so it's a last-resort fallback, not a guaranteed-working link.
  const docUrl =
    pick(item, "bidNtceDtlUrl", "bidNtceUrl") ??
    `https://www.g2b.go.kr#PNPE027_01?bidPbancNo=${bidNtceNo}&bidPbancOrd=${bidNtceOrd}`;
  const bidMethod = pick(item, "sucsfbidMthdNm");

  return {
    bidNtceNo: `${bidNtceNo}-${bidNtceOrd}`,
    title,
    agency,
    demandOrg,
    itemName,
    itemCode,
    estPrice: estPriceNum != null ? BigInt(Math.round(estPriceNum)) : null,
    postedAt,
    deadline,
    docUrl,
    category,
    bidMethod,
  };
}

export type ScrapeResult = {
  fetched: number;
  upserted: number;
  matchesCreatedOrUpdated: number;
  errors: string[];
};

/** How many (category × 29-day window) requests run at once — sequential was ~50min for 90 days. */
const FETCH_CONCURRENCY = 6;

// 90일 = "지금 열려있는 공고"를 놓치지 않을 만큼 넉넉하고(입찰기간은 길어야
// 30~40일), 동시에 완료된 공고 이력을 몇 달치 확인할 수 있는 실질적 최대치.
// 한 번의 API 호출은 ~30일까지만 허용돼서(resultCode 07) 여러 창(window)으로
// 나누고, 창×카테고리 조합을 병렬로 fetch한다 (하나씩 순차로 하면 90일 기준
// ~50분 걸림 — 실제로 관찰된 수치).
export async function runScrape(hoursBack = 24 * 90): Promise<ScrapeResult> {
  const endDt = new Date();
  const bgnDt = new Date(endDt.getTime() - hoursBack * 60 * 60 * 1000);

  const tasks = (Object.keys(OPERATIONS) as Category[]).flatMap((category) =>
    splitWindows(bgnDt, endDt).map(([s, e]) => ({ category, bgn: s, end: e }))
  );

  const errors: string[] = [];
  const mapped: MappedBid[] = [];

  const results = await mapConcurrent(tasks, FETCH_CONCURRENCY, async (task) => {
    try {
      return await fetchCategory(task.category, task.bgn, task.end);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      return [] as RawItem[];
    }
  });

  for (let i = 0; i < tasks.length; i++) {
    for (const item of results[i]) {
      const m = mapItem(item, tasks[i].category);
      if (m) mapped.push(m);
    }
  }

  const upserted = (
    await mapConcurrent(mapped, UPSERT_CONCURRENCY, (bid) =>
      prisma.bid.upsert({
        where: { bidNtceNo: bid.bidNtceNo },
        create: bid,
        update: {
          title: bid.title,
          agency: bid.agency,
          demandOrg: bid.demandOrg,
          itemName: bid.itemName,
          itemCode: bid.itemCode,
          estPrice: bid.estPrice,
          postedAt: bid.postedAt,
          deadline: bid.deadline,
          docUrl: bid.docUrl,
          category: bid.category,
          bidMethod: bid.bidMethod,
        },
      })
    )
  ).length;

  const matchesCreatedOrUpdated = await recomputeMatches();

  return { fetched: mapped.length, upserted, matchesCreatedOrUpdated, errors };
}

/** Bounded-concurrency map — a plain sequential loop is too slow once `items` is in the thousands (each iteration is a network round trip). */
async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

/**
 * Recomputes match score/matchedKeywords for every bid x every product —
 * open AND already-closed bids, so 완료된 공고(지난 이력) also gets populated,
 * not just currently-open ones.
 */
export async function recomputeMatches(): Promise<number> {
  const [allBids, products] = await Promise.all([
    prisma.bid.findMany({
      where: { OR: [{ bidMethod: null }, { NOT: { bidMethod: { contains: "수의시담" } } }] },
    }),
    prisma.product.findMany(),
  ]);

  const hits: { bid: (typeof allBids)[number]; product: (typeof products)[number]; result: NonNullable<ReturnType<typeof computeMatch>> }[] = [];
  for (const product of products) {
    for (const bid of allBids) {
      const result = computeMatch(
        { title: bid.title, itemName: bid.itemName, estPrice: bid.estPrice != null ? Number(bid.estPrice) : null },
        { id: product.id, name: product.name, priceMin: product.priceMin, priceMax: product.priceMax }
      );
      if (result) hits.push({ bid, product, result });
    }
  }

  await mapConcurrent(hits, UPSERT_CONCURRENCY, ({ bid, product, result }) =>
    prisma.match.upsert({
      where: { bidId_productId: { bidId: bid.id, productId: product.id } },
      create: {
        bidId: bid.id,
        productId: product.id,
        companyId: product.companyId,
        score: result.score,
        matchedKeywords: result.matchedKeywords,
      },
      update: {
        score: result.score,
        matchedKeywords: result.matchedKeywords,
      },
    })
  );

  // Prune matches that no longer qualify (e.g. the product was renamed away
  // from a term the bid contains).
  const hitKeys = new Set(hits.map((h) => `${h.bid.id}:${h.product.id}`));
  const existing = await prisma.match.findMany({
    where: { productId: { in: products.map((p) => p.id) } },
    select: { id: true, bidId: true, productId: true },
  });
  const staleIds = existing
    .filter((m) => !hitKeys.has(`${m.bidId}:${m.productId}`))
    .map((m) => m.id);
  if (staleIds.length > 0) {
    await prisma.match.deleteMany({ where: { id: { in: staleIds } } });
  }

  return hits.length;
}
