import type { DenialCode } from "@/lib/types";

/** The description without its "Usage: ..." tail (that tail is long and rarely needed in a table). */
export function shortDescription(description: string): string {
  const i = description.indexOf("Usage:");
  return (i === -1 ? description : description.slice(0, i)).trim();
}

/**
 * A key that sorts codes the way people expect: numbers first in numeric order (1, 2, ... 306), then
 * letter codes in natural order (B1, B7, B9, B10, ... Y4). The leading "a" / "b" (letters, not digits) keeps
 * the two groups apart even under numeric collation, which would otherwise merge a "1" prefix into the digits.
 */
export function codeSortKey(code: string): string {
  const c = code.trim();
  if (/^\d+$/.test(c)) return `a${c.padStart(12, "0")}`;
  return `b${c.toUpperCase().replace(/\d+/g, (d) => d.padStart(12, "0"))}`;
}

export const compareCodes = (a: string, b: string) => codeSortKey(a).localeCompare(codeSortKey(b));

/** "16 · Claim/service lacks information..." — how a code reads in a picker. */
export const codeLabel = (c: Pick<DenialCode, "code" | "description">) => `${c.code} · ${shortDescription(c.description)}`;
