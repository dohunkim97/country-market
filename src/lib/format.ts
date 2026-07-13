export function fmtPrice(n: number | null | undefined): string {
  if (n === null || n === undefined) return "미정";
  return n.toLocaleString("ko-KR") + "원";
}

export function fmtDate(iso: string | Date): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd} ${hh}:${mi}`;
}

export function daysLeft(deadline: string | Date): number {
  const now = new Date();
  const dl = new Date(deadline);
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function dDayLabel(days: number): string {
  if (days < 0) return "마감";
  if (days === 0) return "D-day";
  return "D-" + days;
}
