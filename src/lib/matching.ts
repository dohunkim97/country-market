type MatchableProduct = {
  id: string;
  name: string;
  priceMin: number | null;
  priceMax: number | null;
};

type MatchableBid = {
  title: string;
  itemName: string;
  estPrice: number | null;
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

/**
 * Substring match of 제품명 against 공고명+품명, with a small price-range bonus.
 * Mirrors the scoring shown in the design prototype (roughly 0.6~0.97 range).
 */
export function computeMatch(
  bid: MatchableBid,
  product: MatchableProduct
): { score: number; matchedKeywords: string[] } | null {
  const haystack = normalize(bid.title + " " + bid.itemName);

  if (!product.name || !haystack.includes(normalize(product.name))) return null;

  let score = 0.7;

  const inPriceRange =
    bid.estPrice != null &&
    (product.priceMin == null || bid.estPrice >= product.priceMin) &&
    (product.priceMax == null || bid.estPrice <= product.priceMax);
  if (inPriceRange) score += 0.05;

  score = Math.max(0, Math.min(1, score));

  return { score, matchedKeywords: [product.name] };
}
