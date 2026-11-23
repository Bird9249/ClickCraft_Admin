import { describe, expect, test } from "bun:test";
import { evaluateShareAccess, generateShareToken, computeExtendedExpiry, computeIncreasedMaxDownloads } from "./share-access";

describe("evaluateShareAccess", () => {
  const now = new Date("2026-07-23T12:00:00.000Z");

  test("allows published non-expired link", () => {
    expect(
      evaluateShareAccess(
        {
          revokedAt: null,
          expiresAt: new Date("2026-07-30T12:00:00.000Z"),
          releaseStatus: "published",
        },
        now,
      ),
    ).toBeNull();
  });

  test("rejects missing link", () => {
    expect(evaluateShareAccess(null, now)).toBe("NOT_FOUND");
  });

  test("rejects revoked", () => {
    expect(
      evaluateShareAccess(
        {
          revokedAt: new Date("2026-07-22T12:00:00.000Z"),
          expiresAt: new Date("2026-07-30T12:00:00.000Z"),
          releaseStatus: "published",
        },
        now,
      ),
    ).toBe("REVOKED");
  });

  test("rejects expired", () => {
    expect(
      evaluateShareAccess(
        {
          revokedAt: null,
          expiresAt: new Date("2026-07-22T12:00:00.000Z"),
          releaseStatus: "published",
        },
        now,
      ),
    ).toBe("EXPIRED");
  });

  test("rejects archived/unpublished release", () => {
    expect(
      evaluateShareAccess(
        {
          revokedAt: null,
          expiresAt: new Date("2026-07-30T12:00:00.000Z"),
          releaseStatus: "archived",
        },
        now,
      ),
    ).toBe("UNAVAILABLE");
  });

  test("rejects when download quota reached", () => {
    expect(
      evaluateShareAccess(
        {
          revokedAt: null,
          expiresAt: new Date("2026-07-30T12:00:00.000Z"),
          releaseStatus: "published",
          maxDownloads: 3,
          downloadCount: 3,
        },
        now,
      ),
    ).toBe("QUOTA");
  });

  test("allows when under download quota", () => {
    expect(
      evaluateShareAccess(
        {
          revokedAt: null,
          expiresAt: new Date("2026-07-30T12:00:00.000Z"),
          releaseStatus: "published",
          maxDownloads: 3,
          downloadCount: 2,
        },
        now,
      ),
    ).toBeNull();
  });
});

describe("generateShareToken", () => {
  test("returns long opaque token", () => {
    const token = generateShareToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(token).not.toContain("+");
    expect(token).not.toContain("/");
  });
});

describe("computeExtendedExpiry", () => {
  const now = new Date("2026-07-23T12:00:00.000Z");

  test("extends from current expiry when still active", () => {
    const current = new Date("2026-07-30T12:00:00.000Z");
    const next = computeExtendedExpiry(current, 7, now);
    expect(next.toISOString()).toBe("2026-08-06T12:00:00.000Z");
  });

  test("extends from now when already expired", () => {
    const current = new Date("2026-07-20T12:00:00.000Z");
    const next = computeExtendedExpiry(current, 7, now);
    expect(next.toISOString()).toBe("2026-07-30T12:00:00.000Z");
  });
});

describe("computeIncreasedMaxDownloads", () => {
  test("adds to existing quota", () => {
    expect(computeIncreasedMaxDownloads(10, 8, 5)).toBe(15);
  });

  test("uses download count as base for unlimited links", () => {
    expect(computeIncreasedMaxDownloads(null, 12, 8)).toBe(20);
  });
});
