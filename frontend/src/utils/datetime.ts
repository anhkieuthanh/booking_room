export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromLocal(value: string): Date {
  // value: "YYYY-MM-DDTHH:mm" treated as local time
  return new Date(value);
}

/** Convert a local Date to a naive (no offset) ISO string the backend can parse. */
export function toNaiveIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}:00`;
}

export function parseNaiveIso(s: string): Date {
  // Backend returns naive ISO like "2026-05-01T09:00:00". new Date() treats this as local in modern browsers.
  return new Date(s);
}

const LOCALE = "vi-VN";

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short" });
}

export function fmtDateLong(d: Date): string {
  return d.toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
