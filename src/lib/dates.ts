const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const pad = (n: number | string) => String(n).padStart(2, "0");
const iso = (y: number | string, m: number | string, d: number | string) => `${y}-${pad(m)}-${pad(d)}`;

/**
 * Normalizes assorted date inputs to yyyy-mm-dd: ISO strings, m/d/yyyy, "Jan 19, 2026",
 * "19-Jan-2026" and Excel serial numbers (e.g. 46041). Anything unrecognised is returned as typed.
 */
export function normalizeDate(value: string | undefined): string {
  const v = value?.trim();
  if (!v) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);

  const us = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (us) {
    const [, m, d, y] = us;
    return iso(y.length === 2 ? `20${y}` : y, m, d);
  }

  // Excel serial day numbers (1900 date system), with or without a time fraction.
  if (/^\d{4,6}(\.\d+)?$/.test(v)) {
    const serial = Math.floor(Number(v));
    if (serial >= 1 && serial < 2_958_466) {
      return new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000).toISOString().slice(0, 10);
    }
  }

  // "Jan 19, 2026", "January 19 2026", "19 Jan 2026", "19-Jan-2026"
  const named =
    v.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/) ??
    v.match(/^(\d{1,2})[\s-]([A-Za-z]{3,9})\.?[\s-,]+(\d{4})$/);
  if (named) {
    const [, a, b, y] = named;
    const [monthName, day] = /^\d/.test(a) ? [b, a] : [a, b];
    const month = MONTHS.indexOf(monthName.slice(0, 3).toLowerCase());
    if (month !== -1) return iso(y, month + 1, day);
  }

  return v;
}
