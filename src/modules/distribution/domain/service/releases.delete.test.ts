import { beforeEach, describe, expect, it, mock } from "bun:test";

const deleteObjectFromS3 = mock(async () => true);
const getReleaseById = mock(async () => null as Awaited<
  ReturnType<typeof import("../repo/releases/get-by-id").getReleaseById>
>);
const deleteRelease = mock(async () => null as Awaited<
  ReturnType<typeof import("../repo/releases/delete").deleteRelease>
>);

mock.module("@/server/utils/s3-delete-object", () => ({
  deleteObjectFromS3,
}));
mock.module("../repo/releases/get-by-id", () => ({ getReleaseById }));
mock.module("../repo/releases/delete", () => ({ deleteRelease }));

const { deleteReleaseService, ReleaseValidationError } = await import(
  "./releases"
);

describe("deleteReleaseService", () => {
  beforeEach(() => {
    deleteObjectFromS3.mockReset();
    deleteObjectFromS3.mockResolvedValue(true);
    getReleaseById.mockReset();
    deleteRelease.mockReset();
  });

  it("returns null when release not found", async () => {
    getReleaseById.mockResolvedValue(null);
    const result = await deleteReleaseService({} as never, "missing");
    expect(result).toBeNull();
    expect(deleteObjectFromS3).not.toHaveBeenCalled();
  });

  it("deletes storage object then database row", async () => {
    getReleaseById.mockResolvedValue({
      id: "rel1",
      fileKey: "uploads/distribution/app/android/1-1/file.apk",
    } as never);
    deleteRelease.mockResolvedValue({ id: "rel1" } as never);

    const result = await deleteReleaseService({} as never, "rel1");

    expect(deleteObjectFromS3).toHaveBeenCalledWith(
      "uploads/distribution/app/android/1-1/file.apk",
    );
    expect(deleteRelease).toHaveBeenCalledWith("rel1", {});
    expect(result?.deleted.id).toBe("rel1");
  });

  it("throws when storage delete fails", async () => {
    getReleaseById.mockResolvedValue({
      id: "rel1",
      fileKey: "uploads/distribution/app/android/1-1/file.apk",
    } as never);
    deleteObjectFromS3.mockResolvedValue(false);

    await expect(deleteReleaseService({} as never, "rel1")).rejects.toBeInstanceOf(
      ReleaseValidationError,
    );
    expect(deleteRelease).not.toHaveBeenCalled();
  });
});
