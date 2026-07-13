"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "매칭 대시보드" },
  { href: "/report", label: "연간 리포트" },
  { href: "/products", label: "My Page" },
  { href: "/notifications", label: "알림 설정" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[224px] shrink-0 bg-surface border-r border-border px-[14px] py-6 flex flex-col gap-7">
      <div className="px-2">
        <div className="text-[15px] font-bold tracking-[-0.01em]">나라장터 매칭</div>
        <div className="text-xs text-text-muted mt-[3px]">전체 워크스페이스</div>
      </div>

      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex items-center gap-2.5 py-[9px] px-3 rounded-lg text-[13px] " +
                (active
                  ? "bg-brand-bg text-brand font-semibold"
                  : "text-text-secondary font-medium")
              }
            >
              <span
                className={
                  "w-1.5 h-1.5 rounded-full " + (active ? "bg-brand" : "bg-[#d1d5db]")
                }
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
