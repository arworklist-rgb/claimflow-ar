import { describe, expect, it } from "vitest";
import { calculateAgeDays, getAgingBucketLabel } from "@/server/services/claims";

describe("claims aging helpers", () => {
  it("maps age in days to standard AR aging buckets", () => {
    expect(getAgingBucketLabel(0)).toBe("0-30");
    expect(getAgingBucketLabel(30)).toBe("0-30");
    expect(getAgingBucketLabel(31)).toBe("31-60");
    expect(getAgingBucketLabel(60)).toBe("31-60");
    expect(getAgingBucketLabel(61)).toBe("61-90");
    expect(getAgingBucketLabel(90)).toBe("61-90");
    expect(getAgingBucketLabel(91)).toBe("91-120");
    expect(getAgingBucketLabel(120)).toBe("91-120");
    expect(getAgingBucketLabel(121)).toBe("120+");
  });

  it("returns 0 for invalid dates and non-negative days for past dates", () => {
    expect(calculateAgeDays("not-a-date")).toBe(0);
    expect(calculateAgeDays("2020-01-01")).toBeGreaterThan(100);
  });
});
