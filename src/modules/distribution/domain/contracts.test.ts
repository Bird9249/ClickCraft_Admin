import { describe, expect, test } from "bun:test";
import { CreateReleaseSchema, ReplaceReleaseFileSchema } from "./contracts";

describe("CreateReleaseSchema", () => {
  test("accepts android apk release", () => {
    const parsed = CreateReleaseSchema.parse({
      appId: "clickcraft",
      version: "1.0.0",
      buildNumber: "1",
      fileKey: "uploads/distribution/clickcraft/android/1.0.0-1/app.apk",
      fileName: "app-release.apk",
      fileSize: 12_345_678,
    });
    expect(parsed.platform).toBe("android");
    expect(parsed.fileName).toBe("app-release.apk");
  });

  test("accepts file platform zip release", () => {
    const parsed = CreateReleaseSchema.parse({
      appId: "clickcraft",
      platform: "file",
      version: "1.0.0",
      buildNumber: "1",
      fileKey: "uploads/distribution/clickcraft/files/1.0.0-1/assets.zip",
      fileName: "assets.zip",
      fileSize: 1000,
    });
    expect(parsed.platform).toBe("file");
  });

  test("rejects non-apk fileName on android", () => {
    const result = CreateReleaseSchema.safeParse({
      appId: "clickcraft",
      version: "1.0.0",
      buildNumber: "1",
      fileKey: "uploads/distribution/clickcraft/android/1.0.0-1/app.ipa",
      fileName: "app.ipa",
      fileSize: 1000,
    });
    expect(result.success).toBe(false);
  });

  test("rejects blocked file on file platform", () => {
    const result = CreateReleaseSchema.safeParse({
      appId: "clickcraft",
      platform: "file",
      version: "1.0.0",
      buildNumber: "1",
      fileKey: "uploads/distribution/clickcraft/files/1.0.0-1/run.exe",
      fileName: "run.exe",
      fileSize: 1000,
    });
    expect(result.success).toBe(false);
  });

  test("rejects unknown platform", () => {
    const result = CreateReleaseSchema.safeParse({
      appId: "clickcraft",
      platform: "ios",
      version: "1.0.0",
      buildNumber: "1",
      fileKey: "uploads/distribution/clickcraft/ios/1.0.0-1/app.apk",
      fileName: "app.apk",
      fileSize: 1000,
    });
    expect(result.success).toBe(false);
  });
});

describe("ReplaceReleaseFileSchema", () => {
  test("accepts file payload with name", () => {
    const parsed = ReplaceReleaseFileSchema.parse({
      fileKey: "uploads/distribution/clickcraft/files/1.0.0-1/app.zip",
      fileName: "bundle.zip",
      fileSize: 12_345_678,
    });
    expect(parsed.fileName).toBe("bundle.zip");
  });
});
