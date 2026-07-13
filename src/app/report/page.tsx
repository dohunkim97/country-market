"use client";

import { useEffect, useState } from "react";
import { YearlyReportRow } from "@/lib/types";

export default function ReportPage() {
  const [rows, setRows] = useState<YearlyReportRow[] | null>(null);

  useEffect(() => {
    fetch("/api/report")
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  if (!rows) {
    return <div className="px-9 pt-8 pb-12 text-text-muted text-[13px]">불러오는 중…</div>;
  }

  const totalMatched = rows.reduce((sum, r) => sum + r.matchedBidCount, 0);
  const totalApplied = rows.reduce((sum, r) => sum + r.appliedBidCount, 0);
  const totalRate = totalMatched === 0 ? 0 : (totalApplied / totalMatched) * 100;

  return (
    <div className="px-9 pt-8 pb-12">
      <h1 className="text-[21px] font-bold mb-[6px] tracking-[-0.01em]">연간 리포트</h1>
      <div className="text-[13px] text-text-tertiary mb-[22px]">
        매칭된 공고(관심없음 포함) 대비 실제 입찰한 공고 비율 · 연도는 공고 게시일 기준
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatTile label="누적 매칭 공고" value={`${totalMatched.toLocaleString("ko-KR")}건`} />
        <StatTile label="누적 입찰 건수" value={`${totalApplied.toLocaleString("ko-KR")}건`} />
        <StatTile label="전체 입찰률" value={`${totalRate.toFixed(1)}%`} accent />
      </div>

      {rows.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl px-6 py-12 text-center text-[13px] text-text-muted">
          아직 매칭된 공고가 없습니다.
        </div>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-xl px-6 pt-6 pb-4 mb-6">
            <div className="text-[13px] font-bold text-text-secondary-2 mb-5">연도별 입찰률</div>
            <YearlyBarChart rows={rows} />
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f9fafb]">
                  <th className="text-left px-[14px] py-[10px] text-[11.5px] text-text-tertiary font-semibold border-b border-border">
                    연도
                  </th>
                  <th className="text-right px-[14px] py-[10px] text-[11.5px] text-text-tertiary font-semibold border-b border-border">
                    매칭 공고
                  </th>
                  <th className="text-right px-[14px] py-[10px] text-[11.5px] text-text-tertiary font-semibold border-b border-border">
                    입찰 건수
                  </th>
                  <th className="text-right px-[14px] py-[10px] text-[11.5px] text-text-tertiary font-semibold border-b border-border">
                    입찰률
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.year} className="border-b border-border-hairline last:border-b-0">
                    <td className="px-[14px] py-[11px] font-medium">{r.year}년</td>
                    <td className="px-[14px] py-[11px] text-right tabular-nums text-text-secondary-2">
                      {r.matchedBidCount.toLocaleString("ko-KR")}건
                    </td>
                    <td className="px-[14px] py-[11px] text-right tabular-nums text-text-secondary-2">
                      {r.appliedBidCount.toLocaleString("ko-KR")}건
                    </td>
                    <td className="px-[14px] py-[11px] text-right tabular-nums font-semibold text-brand">
                      {r.appliedRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl px-5 py-4">
      <div className="text-xs text-text-muted mb-1.5">{label}</div>
      <div className={"text-2xl font-semibold " + (accent ? "text-brand" : "text-text-primary")}>
        {value}
      </div>
    </div>
  );
}

const GRID_STEPS = [0, 25, 50, 75, 100];
const PLOT_HEIGHT = 200;

function YearlyBarChart({ rows }: { rows: YearlyReportRow[] }) {
  return (
    <div className="flex">
      <div
        className="flex flex-col justify-between text-[11px] text-text-muted pr-2 shrink-0"
        style={{ height: PLOT_HEIGHT }}
      >
        {[...GRID_STEPS].reverse().map((step) => (
          <span key={step}>{step}%</span>
        ))}
      </div>

      <div className="flex-1">
        <div className="relative" style={{ height: PLOT_HEIGHT }}>
          {GRID_STEPS.map((step) => (
            <div
              key={step}
              className="absolute left-0 right-0 border-t border-border-hairline"
              style={{ bottom: `${step}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
            {rows.map((r) => (
              <div key={r.year} className="group relative flex flex-col items-center h-full justify-end">
                <span className="text-[11.5px] font-semibold text-text-secondary-2 mb-1">
                  {r.appliedRate.toFixed(0)}%
                </span>
                <div
                  className="w-6 rounded-t-[4px] bg-brand transition-[filter] group-hover:brightness-110"
                  style={{ height: `${Math.max(r.appliedRate, 1.5)}%` }}
                />

                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap rounded-md bg-[#111827] px-2.5 py-1.5 text-[12px] text-white shadow-lg z-10">
                  <span className="font-semibold">{r.appliedRate.toFixed(1)}%</span>
                  <span className="text-[#9ca3af]">
                    {" "}
                    · 매칭 {r.matchedBidCount}건 중 입찰 {r.appliedBidCount}건
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-around gap-2 px-2 mt-2">
          {rows.map((r) => (
            <span key={r.year} className="text-[12px] text-text-tertiary w-6 text-center">
              {r.year}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
