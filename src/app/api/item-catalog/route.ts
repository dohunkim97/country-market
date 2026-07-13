import { NextRequest, NextResponse } from "next/server";
import { getItemCatalog } from "@/lib/itemCatalog";
import { chosungPrefixMatch } from "@/lib/hangul";

/**
 * 제품명 자동완성. 실제 나라장터 스크래핑 데이터에서 뽑은 품명/품목코드 목록을
 * 앞부분 일치(초성 포함)로 필터링해서 반환한다.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const catalog = await getItemCatalog();

  if (!q) {
    return NextResponse.json([]);
  }

  const matches = catalog
    .filter((entry) => chosungPrefixMatch(entry.name, q))
    .slice(0, 20);

  return NextResponse.json(matches);
}
