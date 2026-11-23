import { beforeEach, describe, expect, it, mock } from "bun:test";

const getShareLinkById = mock(async () => null as Awaited<
  ReturnType<typeof import("../repo/share-links/get-by-id").getShareLinkById>
>);
const getReleaseById = mock(async () => null as Awaited<
  ReturnType<typeof import("../repo/releases/get-by-id").getReleaseById>
>);
const updateShareLink = mock(async () => null as Awaited<
  ReturnType<typeof import("../repo/share-links/update").updateShareLink>
>);

mock.module("../repo/share-links/get-by-id", () => ({ getShareLinkById }));
mock.module("../repo/releases/get-by-id", () => ({ getReleaseById }));
mock.module("../repo/share-links/update", () => ({ updateShareLink }));

const {
  addShareLinkDownloadsService,
  extendShareLinkExpiryService,
  ShareLinkValidationError,
} = await import("./share-links");

describe("extendShareLinkExpiryService", () => {
  beforeEach(() => {
    getShareLinkById.mockReset();
    getReleaseById.mockReset();
    updateShareLink.mockReset();
  });

  it("rejects revoked links", async () => {
    getShareLinkById.mockResolvedValue({
      id: "link1",
      releaseId: "rel1",
      token: "abc",
      revokedAt: new Date(),
      expiresAt: new Date("2026-01-01"),
    } as never);

    await expect(
      extendShareLinkExpiryService({} as never, "link1", { expiresInDays: 7 }),
    ).rejects.toBeInstanceOf(ShareLinkValidationError);
  });

  it("extends expiry for active link", async () => {
    const expiresAt = new Date("2026-08-01T00:00:00.000Z");
    getShareLinkById.mockResolvedValue({
      id: "link1",
      releaseId: "rel1",
      token: "abc",
      revokedAt: null,
      expiresAt,
    } as never);
    getReleaseById.mockResolvedValue({
      id: "rel1",
      status: "published",
    } as never);
    updateShareLink.mockResolvedValue({
      id: "link1",
      token: "abc",
      expiresAt: new Date("2026-08-08T00:00:00.000Z"),
    } as never);

    const result = await extendShareLinkExpiryService({} as never, "link1", {
      expiresInDays: 7,
    });

    expect(updateShareLink).toHaveBeenCalled();
    expect(result?.publicPath).toBe("/d/abc");
  });
});

describe("addShareLinkDownloadsService", () => {
  beforeEach(() => {
    getShareLinkById.mockReset();
    getReleaseById.mockReset();
    updateShareLink.mockReset();
  });

  it("increases max downloads", async () => {
    getShareLinkById.mockResolvedValue({
      id: "link1",
      releaseId: "rel1",
      token: "abc",
      revokedAt: null,
      maxDownloads: 10,
      downloadCount: 10,
    } as never);
    getReleaseById.mockResolvedValue({
      id: "rel1",
      status: "published",
    } as never);
    updateShareLink.mockResolvedValue({
      id: "link1",
      token: "abc",
      maxDownloads: 15,
    } as never);

    const result = await addShareLinkDownloadsService({} as never, "link1", {
      addDownloads: 5,
    });

    expect(updateShareLink).toHaveBeenCalledWith(
      "link1",
      { maxDownloads: 15 },
      {},
    );
    expect(result?.maxDownloads).toBe(15);
  });
});
