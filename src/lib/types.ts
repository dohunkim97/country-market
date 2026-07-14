export type ProductDTO = {
  id: string;
  name: string;
  itemCode: string | null;
  priceMin: number | null;
  priceMax: number | null;
};

export type CompanyDTO = {
  id: string;
  name: string;
  alertEmail: string | null;
  emailConnected: boolean;
  webhookUrl: string | null;
  webhookConnected: boolean;
  scoreThreshold: number;
  reminderD7: boolean;
  reminderD3: boolean;
  reminderD1: boolean;
  products: ProductDTO[];
};

export type BidDTO = {
  id: string;
  title: string;
  agency: string;
  demandOrg: string;
  itemName: string;
  estPrice: number | null;
  postedAt: string;
  bidBeginDt: string | null;
  deadline: string;
  docUrl: string;
  category: string;
};

export type MatchDTO = {
  id: string;
  score: number;
  matchedKeywords: string[];
  notified: boolean;
  muted: boolean;
  dismissedAt: string | null;
  applied: boolean;
  appliedAt: string | null;
  bid: BidDTO;
  product: { id: string; name: string };
};

export type YearlyReportRow = {
  year: number;
  matchedBidCount: number;
  appliedBidCount: number;
  appliedRate: number; // 0~100
};
