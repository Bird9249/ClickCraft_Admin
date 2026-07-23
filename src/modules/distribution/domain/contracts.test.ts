import { describe, expect, test } from "bun:test";
import { CreateReleaseSchema } from "./contracts";

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

  test("rejects non-apk fileName", () => {
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

  test("rejects ios platform", () => {
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
