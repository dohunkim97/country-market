"use client";

import { useEffect, useState } from "react";
import { CompanyDTO } from "@/lib/types";

export default function NotificationsPage() {
  const [company, setCompany] = useState<CompanyDTO | null>(null);

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then(setCompany);
  }, []);

  async function patch(body: Partial<CompanyDTO>) {
    setCompany((c) => (c ? { ...c, ...body } : c));
    const res = await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const updated: CompanyDTO = await res.json();
    setCompany(updated);
  }

  if (!company) {
    return <div className="px-9 pt-8 pb-12 text-text-muted text-[13px]">불러오는 중…</div>;
  }

  const scoreThresholdPct = Math.round(company.scoreThreshold * 100);

  return (
    <div className="px-9 pt-8 pb-12 max-w-[720px]">
      <h1 className="text-[21px] font-bold mb-[22px] tracking-[-0.01em]">알림 설정</h1>

      <div className="text-[13px] font-bold text-text-secondary-2 mb-[10px]">연동 상태</div>
      <div className="bg-surface border border-border rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
        <div className="text-[13.5px] font-semibold">{company.name}</div>
        <div className="flex gap-2.5 items-center">
          <StatusPill connected={company.emailConnected} labelOn="이메일 연결됨" labelOff="이메일 미연결" />
          <button
            onClick={() => patch({ emailConnected: !company.emailConnected })}
            className="border border-border bg-surface text-xs px-[9px] py-[5px] rounded-md cursor-pointer text-text-secondary-2"
          >
            전환
          </button>

          <StatusPill connected={company.webhookConnected} labelOn="슬랙 연결됨" labelOff="슬랙 미연결" />
          <button
            onClick={() => patch({ webhookConnected: !company.webhookConnected })}
            className="border border-border bg-surface text-xs px-[9px] py-[5px] rounded-md cursor-pointer text-text-secondary-2"
          >
            전환
          </button>
        </div>
      </div>

      <div className="text-[13px] font-bold text-text-secondary-2 mt-[22px] mb-[10px]">알림 조건</div>
      <div className="bg-surface border border-border rounded-xl px-6 py-5 flex flex-col gap-[18px]">
        <div>
          <div className="flex justify-between text-[13px] mb-2">
            <span className="text-text-secondary-2 font-semibold">매칭 점수 임계값</span>
            <span className="text-brand font-bold">{scoreThresholdPct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={company.scoreThreshold}
            onChange={(e) => patch({ scoreThreshold: Number(e.target.value) })}
            className="w-full"
          />
          <div className="text-xs text-text-muted mt-1">이 점수 이상인 공고만 알림 발송</div>
        </div>

        <div className="flex flex-col gap-2.5">
          <ReminderToggle
            label="마감 D-7 리마인더"
            on={company.reminderD7}
            onToggle={() => patch({ reminderD7: !company.reminderD7 })}
          />
          <ReminderToggle
            label="마감 D-3 리마인더"
            on={company.reminderD3}
            onToggle={() => patch({ reminderD3: !company.reminderD3 })}
          />
          <ReminderToggle
            label="마감 D-1 리마인더"
            on={company.reminderD1}
            onToggle={() => patch({ reminderD1: !company.reminderD1 })}
          />
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  connected,
  labelOn,
  labelOff,
}: {
  connected: boolean;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <span
      className={
        "text-xs font-semibold px-[9px] py-1 rounded-md " +
        (connected ? "text-success bg-success-bg" : "text-text-muted bg-neutral-bg")
      }
    >
      {connected ? labelOn : labelOff}
    </span>
  );
}

function ReminderToggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-text-secondary-2">{label}</span>
      <button
        onClick={onToggle}
        className={
          "border-none text-white text-xs font-semibold px-[14px] py-[6px] rounded-[14px] cursor-pointer " +
          (on ? "bg-brand" : "bg-[#d1d5db]")
        }
      >
        {on ? "ON" : "OFF"}
      </button>
    </div>
  );
}
