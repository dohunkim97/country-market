import "dotenv/config";
import { runScrape } from "../src/lib/g2b";

async function main() {
  // 정기 크론 실행은 SCRAPE_HOURS_BACK으로 짧은 창(예: 최근 3일)만 훑도록 지정.
  // 지정하지 않으면 runScrape()의 기본값(90일)을 그대로 사용한다.
  const hoursBackEnv = process.env.SCRAPE_HOURS_BACK;
  const hoursBack = hoursBackEnv ? Number(hoursBackEnv) : undefined;

  const result = await runScrape(hoursBack);
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
