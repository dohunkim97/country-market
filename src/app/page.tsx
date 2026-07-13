"use client";

import { useEffect, useMemo, useState } from "react";
import { MatchDTO } from "@/lib/types";
import { daysLeft, fmtDate, fmtPrice } from "@/lib/format";
import { DDayBadge } from "@/components/DDayBadge";
import { DetailPanel } from "@/components/DetailPanel";

type SortBy = "deadline" | "newest";

export default function DashboardPage() {
  const [matches, setMatches] = useState<MatchDTO[] | null>(null);
  const [closedMatches, setClosedMatches] = useState<MatchDTO[] | null>(null);
  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("deadline");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/matches?status=open")
      .then((r) => r.json())
      .then(setMatches)
      .catch(() => setMatches([]));
    fetch("/api/matches?status=closed")
      .then((r) => r.json())
      .then(setClosedMatches)
      .catch(() => setClosedMatches([]));
  }, []);

  const productOptions = useMemo(() => {
    if (!matches) return [];
    const map = new Map<string, string>();
    for (const m of matches) map.set(m.product.id, m.product.name);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [matches]);

  const rows = useMemo(() => {
    if (!matches) return [];
    let list = matches;

    if (filterProduct !== "all") list = list.filter((m) => m.product.id === filterProduct);
    if (filterCategory !== "all") list = list.filter((m) => m.bid.category === filterCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.bid.title.toLowerCase().includes(q) ||
          m.bid.demandOrg.toLowerCase().includes(q)
      );
    }

    list = [...list];
    if (sortBy === "deadline") {
      list.sort((a, b) => daysLeft(a.bid.deadline) - daysLeft(b.bid.deadline));
    } else {
      list.sort((a, b) => new Date(b.bid.postedAt).getTime() - new Date(a.bid.postedAt).getTime());
    }
    return list;
  }, [matches, search, filterProduct, filterCategory, sortBy]);

  const urgentCount = rows.filter((r) => daysLeft(r.bid.deadline) <= 3).length;
  const selected =
    matches?.find((m) => m.id === selectedMatchId) ??
    closedMatches?.find((m) => m.id === selectedMatchId) ??
    null;

  function patchBothLists(updater: (m: MatchDTO) => MatchDTO, predicate: (m: MatchDTO) => boolean) {
    setMatches((prev) => (prev ? prev.map((m) => (predicate(m) ? updater(m) : m)) : prev));
    setClosedMatches((prev) => (prev ? prev.map((m) => (predicate(m) ? updater(m) : m)) : prev));
  }

  async function dismissMatch(id: string) {
    setMatches((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));
    setClosedMatches((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));
    if (selectedMatchId === id) setSelectedMatchId(null);
    await fetch(`/api/matches/${id}/dismiss`, { method: "POST" });
  }

  async function toggleMute(id: string) {
    patchBothLists((m) => ({ ...m, muted: !m.muted }), (m) => m.id === id);
    await fetch(`/api/matches/${id}/mute`, { method: "POST" });
  }

  async function toggleApplied(id: string) {
    const target = matches?.find((m) => m.id === id) ?? closedMatches?.find((m) => m.id === id);
    if (!target) return;
    const nextApplied = !target.applied;
    patchBothLists((m) => ({ ...m, applied: nextApplied }), (m) => m.bid.id === target.bid.id);
    await fetch(`/api/matches/${id}/apply`, { method: "POST" });
  }

  return (
    <div className="px-9 pt-8 pb-12">
      <div className="flex items-baseline justify-between mb-[22px]">
        <div>
          <h1 className="text-[21px] font-bold m-0 tracking-[-0.01em]">매칭 대시보드</h1>
          <div className="text-[13px] text-text-tertiary mt-[5px]">
            진행중인 공고 {rows.length}건 · 마감 D-3 이내{" "}
            <span className="text-urgent font-semibold">{urgentCount}건</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          placeholder="공고명·수요기관 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-border rounded-lg px-3 py-[9px] text-[13px] w-[240px] bg-surface outline-none"
        />
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="border border-border rounded-lg px-[10px] py-[9px] text-[13px] bg-surface text-text-secondary-2"
        >
          <option value="all">전체 제품</option>
          {productOptions.map((po) => (
            <option key={po.id} value={po.id}>
              {po.name}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-border rounded-lg px-[10px] py-[9px] text-[13px] bg-surface text-text-secondary-2"
        >
          <option value="all">전체 업무구분</option>
          <option value="물품">물품</option>
          <option value="용역">용역</option>
          <option value="공사">공사</option>
        </select>
        <div className="flex gap-0.5 bg-[#f1f2f4] rounded-lg p-0.5 ml-auto">
          <button
            onClick={() => setSortBy("deadline")}
            className={`border-none text-[12.5px] font-semibold px-3 py-[7px] rounded-md cursor-pointer ${
              sortBy === "deadline" ? "bg-white text-brand" : "bg-transparent text-text-tertiary"
            }`}
          >
            마감임박순
          </button>
          <button
            onClick={() => setSortBy("newest")}
            className={`border-none text-[12.5px] font-semibold px-3 py-[7px] rounded-md cursor-pointer ${
              sortBy === "newest" ? "bg-white text-brand" : "bg-transparent text-text-tertiary"
            }`}
          >
            최신순
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#f9fafb]">
              <Th w={70}>D-day</Th>
              <Th w={260}>공고명</Th>
              <Th w={150}>수요기관</Th>
              <Th w={110} align="right">추정가격</Th>
              <Th w={130}>마감일시</Th>
              <Th w={80} align="right">매칭점수</Th>
              <Th w={160}>매칭키워드</Th>
              <Th w={130}>제품</Th>
              <Th w={60} align="center">원문</Th>
            </tr>
          </thead>
          <tbody>
            {matches === null && (
              <tr>
                <td colSpan={9} className="text-center text-text-muted py-10 text-[13px]">
                  불러오는 중…
                </td>
              </tr>
            )}
            {matches !== null && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-text-muted py-10 text-[13px]">
                  매칭된 공고가 없습니다.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const days = daysLeft(row.bid.deadline);
              const scorePct = Math.round(row.score * 100);
              const isSelected = row.id === selectedMatchId;
              return (
                <tr
                  key={row.id}
                  onClick={() => setSelectedMatchId(row.id)}
                  className={`border-b border-border-hairline cursor-pointer ${
                    isSelected ? "bg-brand-bg" : "bg-white"
                  }`}
                >
                  <td className="px-[14px] py-[11px] whitespace-nowrap">
                    <DDayBadge days={days} />
                  </td>
                  <td className="px-[14px] py-[11px] font-medium">{row.bid.title}</td>
                  <td className="px-[14px] py-[11px] text-text-secondary whitespace-nowrap">
                    {row.bid.demandOrg}
                  </td>
                  <td className="px-[14px] py-[11px] text-right tabular-nums text-text-secondary-2 whitespace-nowrap">
                    {fmtPrice(row.bid.estPrice)}
                  </td>
                  <td className="px-[14px] py-[11px] text-text-secondary whitespace-nowrap tabular-nums">
                    {fmtDate(row.bid.deadline)}
                  </td>
                  <td className="px-[14px] py-[11px] text-right tabular-nums font-semibold text-brand whitespace-nowrap">
                    {scorePct}%
                  </td>
                  <td className="px-[14px] py-[11px] text-text-tertiary whitespace-nowrap">
                    {row.matchedKeywords.join(", ")}
                  </td>
                  <td className="px-[14px] py-[11px] text-text-secondary-2 whitespace-nowrap">
                    {row.product.name}
                  </td>
                  <td className="px-[14px] py-[11px] text-center whitespace-nowrap">
                    <a
                      href={row.bid.docUrl}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => e.stopPropagation()}
                      className="text-brand text-[12.5px] no-underline font-semibold"
                    >
                      원문
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h2 className="text-[16px] font-bold m-0 mb-[6px] tracking-[-0.01em]">완료된 공고</h2>
        <div className="text-[13px] text-text-tertiary mb-3">
          마감이 지난 매칭 {closedMatches?.length ?? 0}건 · 지난 입찰 이력을 확인하고 입찰 여부를 표시할 수 있어요
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#f9fafb]">
                <Th w={260}>공고명</Th>
                <Th w={150}>수요기관</Th>
                <Th w={110} align="right">추정가격</Th>
                <Th w={130}>마감일시</Th>
                <Th w={80} align="right">매칭점수</Th>
                <Th w={130}>제품</Th>
                <Th w={90} align="center">입찰여부</Th>
                <Th w={60} align="center">원문</Th>
              </tr>
            </thead>
            <tbody>
              {closedMatches === null && (
                <tr>
                  <td colSpan={8} className="text-center text-text-muted py-10 text-[13px]">
                    불러오는 중…
                  </td>
                </tr>
              )}
              {closedMatches !== null && closedMatches.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-text-muted py-10 text-[13px]">
                    완료된 공고가 없습니다.
                  </td>
                </tr>
              )}
              {closedMatches?.map((row) => {
                const scorePct = Math.round(row.score * 100);
                const isSelected = row.id === selectedMatchId;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedMatchId(row.id)}
                    className={`border-b border-border-hairline cursor-pointer ${
                      isSelected ? "bg-brand-bg" : "bg-white"
                    }`}
                  >
                    <td className="px-[14px] py-[11px] font-medium">{row.bid.title}</td>
                    <td className="px-[14px] py-[11px] text-text-secondary whitespace-nowrap">
                      {row.bid.demandOrg}
                    </td>
                    <td className="px-[14px] py-[11px] text-right tabular-nums text-text-secondary-2 whitespace-nowrap">
                      {fmtPrice(row.bid.estPrice)}
                    </td>
                    <td className="px-[14px] py-[11px] text-text-secondary whitespace-nowrap tabular-nums">
                      {fmtDate(row.bid.deadline)}
                    </td>
                    <td className="px-[14px] py-[11px] text-right tabular-nums font-semibold text-brand whitespace-nowrap">
                      {scorePct}%
                    </td>
                    <td className="px-[14px] py-[11px] text-text-secondary-2 whitespace-nowrap">
                      {row.product.name}
                    </td>
                    <td className="px-[14px] py-[11px] text-center whitespace-nowrap">
                      <span
                        className={
                          "text-xs font-semibold px-[9px] py-1 rounded-md " +
                          (row.applied ? "text-success bg-success-bg" : "text-text-muted bg-neutral-bg")
                        }
                      >
                        {row.applied ? "입찰함" : "입찰 안함"}
                      </span>
                    </td>
                    <td className="px-[14px] py-[11px] text-center whitespace-nowrap">
                      <a
                        href={row.bid.docUrl}
                        target="_blank"
                        rel="noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="text-brand text-[12.5px] no-underline font-semibold"
                      >
                        원문
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <DetailPanel
          match={selected}
          onClose={() => setSelectedMatchId(null)}
          onDismiss={() => dismissMatch(selected.id)}
          onToggleMute={() => toggleMute(selected.id)}
          onToggleApplied={() => toggleApplied(selected.id)}
        />
      )}
    </div>
  );
}

function Th({
  children,
  w,
  align = "left",
}: {
  children: React.ReactNode;
  w: number;
  align?: "left" | "right" | "center";
}) {
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th
      style={{ width: w }}
      className={`px-[14px] py-[10px] text-[11.5px] text-text-tertiary font-semibold border-b border-border whitespace-nowrap ${alignClass}`}
    >
      {children}
    </th>
  );
}
