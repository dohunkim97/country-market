import { dDayLabel } from "@/lib/format";

export function DDayBadge({ days, size = "sm" }: { days: number; size?: "sm" | "md" }) {
  const urgent = days <= 3;
  const label = dDayLabel(days);
  const padding = size === "md" ? "px-[10px] py-1" : "px-2 py-[3px]";
  const fontSize = size === "md" ? "text-[12.5px]" : "text-xs";

  return (
    <span
      className={
        `inline-block ${padding} rounded-[5px] ${fontSize} font-bold whitespace-nowrap ` +
        (urgent ? "bg-urgent-bg text-urgent" : "bg-neutral-bg text-neutral font-semibold")
      }
    >
      {label}
    </span>
  );
}
