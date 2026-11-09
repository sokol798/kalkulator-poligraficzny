/** Formatowanie liczb po polsku. */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('pl-PL').replace(/ /g, ' ');
}
export function fmtDec(n: number, digits = 1): string {
  return n.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}
export function dayBucket(ts: number, now = Date.now()): 'today' | 'yesterday' | 'earlier' {
  const d = new Date(ts);
  const n = new Date(now);
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, n)) return 'today';
  const y = new Date(now - 86_400_000);
  if (sameDay(d, y)) return 'yesterday';
  return 'earlier';
}
