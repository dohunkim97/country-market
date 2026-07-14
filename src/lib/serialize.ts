import type { Bid, Company, Match, Product } from "@/generated/prisma/client";
import type { BidDTO, CompanyDTO, MatchDTO, ProductDTO } from "@/lib/types";

export function serializeProduct(p: Product): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    itemCode: p.itemCode,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
  };
}

export function serializeCompany(
  c: Company & { products: Product[] }
): CompanyDTO {
  return {
    id: c.id,
    name: c.name,
    alertEmail: c.alertEmail,
    emailConnected: c.emailConnected,
    webhookUrl: c.webhookUrl,
    webhookConnected: c.webhookConnected,
    scoreThreshold: c.scoreThreshold,
    reminderD7: c.reminderD7,
    reminderD3: c.reminderD3,
    reminderD1: c.reminderD1,
    products: c.products.map(serializeProduct),
  };
}

export function serializeBid(b: Bid): BidDTO {
  return {
    id: b.id,
    title: b.title,
    agency: b.agency,
    demandOrg: b.demandOrg,
    itemName: b.itemName,
    estPrice: b.estPrice != null ? Number(b.estPrice) : null,
    postedAt: b.postedAt.toISOString(),
    bidBeginDt: b.bidBeginDt ? b.bidBeginDt.toISOString() : null,
    deadline: b.deadline.toISOString(),
    docUrl: b.docUrl,
    category: b.category,
  };
}

export function serializeMatch(
  m: Match & { bid: Bid; product: Product }
): MatchDTO {
  return {
    id: m.id,
    score: m.score,
    matchedKeywords: m.matchedKeywords,
    notified: m.notified,
    muted: m.muted,
    dismissedAt: m.dismissedAt ? m.dismissedAt.toISOString() : null,
    applied: m.applied,
    appliedAt: m.appliedAt ? m.appliedAt.toISOString() : null,
    bid: serializeBid(m.bid),
    product: { id: m.product.id, name: m.product.name },
  };
}
