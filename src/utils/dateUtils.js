import { APP_CONFIG } from "../config/appConfig";

/** ISO (yyyy-mm-dd) -> dd-mm-yyyy */
export function isoToDdMmYyyy(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return String(iso);
  return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
}

/** dd-mm-yyyy -> Date */
export function ddMmYyyyToDate(s) {
  if (!s) return null;
  const parts = String(s).split("-");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map((x) => Number(x));
  if (!d || !m || !y) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

/** ISO (yyyy-mm-dd) -> Date */
export function isoToDate(iso) {
  if (!iso) return null;
  const d = new Date(String(iso));
  return isNaN(d.getTime()) ? null : d;
}

/** Date -> dd-mm-yyyy (display) */
export function dateToDdMmYyyy(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

/** Build a consistent "Period" string for UI/print */
export function formatPeriod(fromIso, toIso) {
  const f = isoToDdMmYyyy((fromIso || "").trim());
  const t = isoToDdMmYyyy((toIso || "").trim());

  if (!f && !t) return "All Dates";
  if (f && !t) return `From ${f}`;
  if (!f && t) return `Up to ${t}`;
  return `${f} to ${t}`;
}

/**
 * Universal display formatter:
 * - If value looks like ISO date (yyyy-mm-dd...), show dd-mm-yyyy
 * - If value looks like dd-mm-yyyy already, keep it
 * - Otherwise return as-is
 */
export function formatDateDisplay(value) {
  if (!value) return "";
  const s = String(value).trim();

  // Already dd-mm-yyyy
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;

  // ISO date or ISO datetime
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // Date object
  if (value instanceof Date) return dateToDdMmYyyy(value);

  return s;
}
