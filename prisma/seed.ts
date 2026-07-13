import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeMatch } from "../src/lib/matching";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "seed-company" },
    update: {},
    create: {
      id: "seed-company",
      name: "대한정밀",
      alertEmail: "bidding@daehanjeongmil.co.kr",
      emailConnected: true,
      webhookConnected: true,
    },
  });

  const productSeeds = [
    { id: "seed-p1", name: "유압실린더", itemCode: "3120.11", priceMin: 5_000_000, priceMax: 50_000_000 },
    { id: "seed-p2", name: "정밀베어링", itemCode: "3130.04", priceMin: 1_000_000, priceMax: 20_000_000 },
    { id: "seed-p3", name: "감속기어", itemCode: "3140.02", priceMin: 3_000_000, priceMax: 30_000_000 },
    { id: "seed-p4", name: "배전반", itemCode: "3910.01", priceMin: 10_000_000, priceMax: 100_000_000 },
    { id: "seed-p5", name: "차단기", itemCode: "3920.07", priceMin: 500_000, priceMax: 15_000_000 },
    { id: "seed-p6", name: "케이블트레이", itemCode: "3930.03", priceMin: 2_000_000, priceMax: 25_000_000 },
  ];

  const products = [];
  for (const p of productSeeds) {
    products.push(
      await prisma.product.upsert({
        where: { id: p.id },
        update: {},
        create: { ...p, companyId: company.id },
      })
    );
  }

  const onDate = (y: number, m: number, d: number) => new Date(y, m - 1, d, 9, 0, 0);

  type BidSeed = {
    id: string;
    title: string;
    agency: string;
    demandOrg: string;
    itemName: string;
    estPrice: number;
    postedAt: Date;
    deadline: Date;
    category: string;
    docUrl: string;
    applied?: boolean;
  };

  // 지난 연도 마감 공고 (연간 리포트 데모용 — applied로 입찰률을 재현).
  // 현재 열려있는 공고는 일부러 시드하지 않는다 — 실제 스크래퍼(`npm run scrape`)가
  // 채워야 할 자리이고, 가짜 원문 링크를 대시보드에 노출시키지 않기 위함.
  const historicalBidSeeds: BidSeed[] = [
    { id: "seed-h24-1", title: "유압실린더 정기납품", agency: "조달청", demandOrg: "한국철도공사", itemName: "유압실린더", estPrice: 30_000_000, postedAt: onDate(2024, 2, 10), deadline: onDate(2024, 2, 20), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h24-1", applied: true },
    { id: "seed-h24-2", title: "정밀베어링 교체 구매", agency: "조달청", demandOrg: "한국수자원공사", itemName: "베어링", estPrice: 8_500_000, postedAt: onDate(2024, 4, 5), deadline: onDate(2024, 4, 15), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h24-2", applied: true },
    { id: "seed-h24-3", title: "수배전반 증설 공사", agency: "조달청", demandOrg: "한국전력공사", itemName: "배전반", estPrice: 78_000_000, postedAt: onDate(2024, 6, 18), deadline: onDate(2024, 6, 28), category: "공사", docUrl: "https://www.g2b.go.kr/bid/h24-3" },
    { id: "seed-h24-4", title: "감속기어 부품 구매", agency: "조달청", demandOrg: "한국조폐공사", itemName: "기어박스", estPrice: 17_000_000, postedAt: onDate(2024, 8, 2), deadline: onDate(2024, 8, 12), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h24-4" },
    { id: "seed-h24-5", title: "배선용차단기 납품", agency: "조달청", demandOrg: "서울교통공사", itemName: "차단기", estPrice: 5_800_000, postedAt: onDate(2024, 9, 20), deadline: onDate(2024, 9, 30), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h24-5", applied: true },
    { id: "seed-h24-6", title: "케이블트레이 설치용역", agency: "조달청", demandOrg: "한국도로공사", itemName: "케이블트레이", estPrice: 16_000_000, postedAt: onDate(2024, 11, 8), deadline: onDate(2024, 11, 18), category: "용역", docUrl: "https://www.g2b.go.kr/bid/h24-6" },

    { id: "seed-h25-1", title: "유압장비 교체분 구매", agency: "조달청", demandOrg: "한국공항공사", itemName: "유압장비", estPrice: 38_000_000, postedAt: onDate(2025, 1, 15), deadline: onDate(2025, 1, 25), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h25-1", applied: true },
    { id: "seed-h25-2", title: "정밀기어 구매", agency: "조달청", demandOrg: "한국원자력연구원", itemName: "정밀기어", estPrice: 24_000_000, postedAt: onDate(2025, 3, 4), deadline: onDate(2025, 3, 14), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h25-2", applied: true },
    { id: "seed-h25-3", title: "ELB 차단기 교체", agency: "조달청", demandOrg: "한국가스공사", itemName: "ELB", estPrice: 3_900_000, postedAt: onDate(2025, 4, 22), deadline: onDate(2025, 5, 2), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h25-3" },
    { id: "seed-h25-4", title: "정밀베어링 부속품 구매", agency: "조달청", demandOrg: "한국지역난방공사", itemName: "베어링", estPrice: 9_200_000, postedAt: onDate(2025, 5, 30), deadline: onDate(2025, 6, 9), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h25-4", applied: true },
    { id: "seed-h25-5", title: "수배전반 신규설치 공사", agency: "조달청", demandOrg: "인천국제공항공사", itemName: "수배전반", estPrice: 91_000_000, postedAt: onDate(2025, 7, 11), deadline: onDate(2025, 7, 21), category: "공사", docUrl: "https://www.g2b.go.kr/bid/h25-5" },
    { id: "seed-h25-6", title: "케이블트레이 자재 공급", agency: "조달청", demandOrg: "한국토지주택공사", itemName: "전선관", estPrice: 11_800_000, postedAt: onDate(2025, 9, 3), deadline: onDate(2025, 9, 13), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h25-6" },
    { id: "seed-h25-7", title: "감속기 정밀부품 구매", agency: "조달청", demandOrg: "한국남동발전", itemName: "감속기", estPrice: 18_500_000, postedAt: onDate(2025, 10, 27), deadline: onDate(2025, 11, 6), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h25-7" },
    { id: "seed-h25-8", title: "차단기 대량 구매", agency: "조달청", demandOrg: "한국중부발전", itemName: "차단기", estPrice: 10_500_000, postedAt: onDate(2025, 12, 5), deadline: onDate(2025, 12, 15), category: "물품", docUrl: "https://www.g2b.go.kr/bid/h25-8", applied: true },
  ];

  const bidSeeds = historicalBidSeeds;

  const bids = [];
  for (const b of bidSeeds) {
    const created = await prisma.bid.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        bidNtceNo: b.id,
        title: b.title,
        agency: b.agency,
        demandOrg: b.demandOrg,
        itemName: b.itemName,
        estPrice: BigInt(b.estPrice),
        postedAt: b.postedAt,
        deadline: b.deadline,
        docUrl: b.docUrl,
        category: b.category,
      },
    });
    bids.push({ ...created, applied: b.applied ?? false });
  }

  let matchCount = 0;
  for (const product of products) {
    for (const bid of bids) {
      const result = computeMatch(
        { title: bid.title, itemName: bid.itemName, estPrice: Number(bid.estPrice) },
        { id: product.id, name: product.name, priceMin: product.priceMin, priceMax: product.priceMax }
      );
      if (!result) continue;
      await prisma.match.upsert({
        where: { bidId_productId: { bidId: bid.id, productId: product.id } },
        update: {
          score: result.score,
          matchedKeywords: result.matchedKeywords,
          applied: bid.applied,
          appliedAt: bid.applied ? bid.postedAt : null,
        },
        create: {
          bidId: bid.id,
          productId: product.id,
          companyId: company.id,
          score: result.score,
          matchedKeywords: result.matchedKeywords,
          applied: bid.applied,
          appliedAt: bid.applied ? bid.postedAt : null,
        },
      });
      matchCount += 1;
    }
  }

  console.log(`Seeded: 1 company, ${products.length} products, ${bids.length} bids, ${matchCount} matches.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
