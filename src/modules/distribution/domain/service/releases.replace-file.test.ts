import { beforeEach, describe, expect, it, mock } from "bun:test";

const deleteObjectFromS3 = mock(async () => true);
const getReleaseById = mock(async () => null as Awaited<
  ReturnType<typeof import("../repo/releases/get-by-id").getReleaseById>
>);
const updateRelease = mock(async () => null as Awaited<
  ReturnType<typeof import("../repo/releases/update").updateRelease>
>);

mock.module("@/server/utils/s3-delete-object", () => ({
  deleteObjectFromS3,
}));
mock.module("../repo/releases/get-by-id", () => ({ getReleaseById }));
mock.module("../repo/releases/update", () => ({ updateRelease }));

const { replaceReleaseFileService, ReleaseValidationError } = await import(
  "./releases"
);

const newFile = {
  fileKey: "uploads/distribution/app/android/1.0.0-1/new.apk",
  fileName: "new.apk",
  fileSize: 2_000_000,
  contentType: "application/vnd.android.package-archive",
  checksumSha256: "abc123",
};

describe("replaceReleaseFileService", () => {
  beforeEach(() => {
    deleteObjectFromS3.mockReset();
    deleteObjectFromS3.mockResolvedValue(true);
    getReleaseById.mockReset();
    updateRelease.mockReset();
  });

  it("returns null when release not found", async () => {
    getReleaseById.mockResolvedValue(null);
    const result = await replaceReleaseFileService({} as never, "missing", newFile);
    expect(result).toBeNull();
    expect(updateRelease).not.toHaveBeenCalled();
  });

  it("rejects archived release", async () => {
    getReleaseById.mockResolvedValue({
      id: "rel1",
      status: "archived",
      fileKey: "old.apk",
    } as never);

    await expect(
      replaceReleaseFileService({} as never, "rel1", newFile),
    ).rejects.toBeInstanceOf(ReleaseValidationError);
    expect(updateRelease).not.toHaveBeenCalled();
  });

  it("updates database then deletes old storage object", async () => {
    getReleaseById
      .mockResolvedValueOnce({
        id: "rel1",
        status: "draft",
        fileKey: "uploads/distribution/app/android/1.0.0-1/old.apk",
      } as never)
      .mockResolvedValueOnce({
        id: "rel1",
        status: "draft",
        fileKey: newFile.fileKey,
        fileName: newFile.fileName,
      } as never);
    updateRelease.mockResolvedValue({ id: "rel1" } as never);

    const result = await replaceReleaseFileService({} as never, "rel1", newFile);

    expect(updateRelease).toHaveBeenCalledWith(
      "rel1",
      {
        fileKey: newFile.fileKey,
        fileName: newFile.fileName,
        fileSize: newFile.fileSize,
        contentType: newFile.contentType,
        checksumSha256: newFile.checksumSha256,
      },
      {},
    );
    expect(deleteObjectFromS3).toHaveBeenCalledWith(
      "uploads/distribution/app/android/1.0.0-1/old.apk",
    );
    expect(result?.fileKey).toBe(newFile.fileKey);
  });

  it("skips storage delete when key unchanged", async () => {
    getReleaseById
      .mockResolvedValueOnce({
        id: "rel1",
        status: "published",
        fileKey: newFile.fileKey,
      } as never)
      .mockResolvedValueOnce({
        id: "rel1",
        status: "published",
        fileKey: newFile.fileKey,
      } as never);
    updateRelease.mockResolvedValue({ id: "rel1" } as never);

    await replaceReleaseFileService({} as never, "rel1", newFile);

    expect(deleteObjectFromS3).not.toHaveBeenCalled();
  });
});
