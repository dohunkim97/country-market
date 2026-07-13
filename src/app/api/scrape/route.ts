import { NextRequest, NextResponse } from "next/server";
import { runScrape } from "@/lib/g2b";

/**
 * Manually trigger a G2B scrape + match recompute. Intended to be called by
 * a scheduled job (cron / Windows Task Scheduler hitting this URL). If
 * CRON_SECRET is set, callers must send it as `x-cron-secret`.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScrape();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
