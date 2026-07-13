"use client";

import { MatchDTO } from "@/lib/types";
import { daysLeft, fmtDate, fmtPrice } from "@/lib/format";
import { DDayBadge } from "@/components/DDayBadge";

export function DetailPanel({
  match,
  onClose,
  onDismiss,
  onToggleMute,
  onToggleApplied,
}: {
  match: MatchDTO;
  onClose: () => void;
  onDismiss: () => void;
  onToggleMute: () => void;
  onToggleApplied: () => void;
}) {
  const days = daysLeft(match.bid.deadline);
  const scorePct = Math.round(match.score * 100);

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(17,24,39,0.25)] z-40"
      />
      <div className="fixed top-0 right-0 bottom-0 w-[440px] bg-surface shadow-[-8px_0_24px_rgba(0,0,0,0.08)] z-50 p-7 overflow-y-auto flex flex-col gap-[18px]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[17px] font-bold m-0 leading-[1.4]">{match.bid.title}</h2>
          <span
            onClick={onClose}
            className="cursor-pointer text-text-muted text-xl leading-none p-0.5"
          >
            ×
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DDayBadge days={days} size="md" />
          <span className="bg-brand-bg text-brand text-[12.5px] font-semibold px-[10px] py-1 rounded-[6px]">
            {match.bid.category}
          </span>
        </div>

        <div className="grid grid-cols-[88px_1fr] gap-y-[10px] gap-x-3 text-[13px]">
          <span className="text-text-muted">공고기관</span>
          <span className="text-text-primary">{match.bid.agency}</span>
          <span className="text-text-muted">수요기관</span>
          <span className="text-text-primary">{match.bid.demandOrg}</span>
          <span className="text-text-muted">품명</span>
          <span className="text-text-primary">{match.bid.itemName}</span>
          <span className="text-text-muted">추정가격</span>
          <span className="text-text-primary tabular-nums">{fmtPrice(match.bid.estPrice)}</span>
          <span className="text-text-muted">공고일시</span>
          <span className="text-text-primary tabular-nums">{fmtDate(match.bid.postedAt)}</span>
          <span className="text-text-muted">마감일시</span>
          <span className="text-text-primary tabular-nums">{fmtDate(match.bid.deadline)}</span>
        </div>

        <div className="border-t border-border-hairline pt-4">
          <div className="flex justify-between text-[13px] mb-[6px]">
            <span className="text-text-secondary-2 font-semibold">매칭 점수</span>
            <span className="text-brand font-bold">{scorePct}%</span>
          </div>
          <div className="h-[6px] bg-border-hairline rounded-[3px] overflow-hidden">
            <div className="h-full bg-brand" style={{ width: `${scorePct}%` }} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-[10px]">
            {match.matchedKeywords.map((kw) => (
              <span
                key={kw}
                className="bg-brand-bg text-brand text-xs font-semibold px-[9px] py-1 rounded-[6px]"
              >
                {kw}
              </span>
            ))}
          </div>
          <div className="text-[12.5px] text-text-muted mt-2">담당 제품: {match.product.name}</div>
        </div>

        <div className="border-t border-border-hairline pt-4 flex items-center justify-between">
          <span className="text-[13px] text-text-secondary-2 font-semibold">우리 회사 입찰 여부</span>
          <div className="flex items-center gap-2">
            <span
              className={
                "text-xs font-semibold px-[9px] py-1 rounded-md " +
                (match.applied ? "text-success bg-success-bg" : "text-text-muted bg-neutral-bg")
              }
            >
              {match.applied ? "입찰함" : "입찰 안함"}
            </span>
            <button
              onClick={onToggleApplied}
              className="border border-border bg-surface text-text-secondary-2 text-xs px-[9px] py-[5px] rounded-md cursor-pointer"
            >
              전환
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-auto pt-2">
          <a
            href={match.bid.docUrl}
            target="_blank"
            rel="noopener"
            className="flex-1 text-center bg-brand text-white text-[13px] font-bold py-[11px] rounded-lg no-underline"
          >
            원문 보기
          </a>
          <button
            onClick={onDismiss}
            className="border border-border bg-surface text-text-secondary-2 text-[13px] font-semibold px-[14px] py-[11px] rounded-lg cursor-pointer"
          >
            관심없음
          </button>
          <button
            onClick={onToggleMute}
            className="border border-border bg-surface text-text-secondary-2 text-[13px] font-semibold px-[14px] py-[11px] rounded-lg cursor-pointer whitespace-nowrap"
          >
            {match.muted ? "알림 다시 받기" : "알림 안보기"}
          </button>
        </div>
      </div>
    </>
  );
}
