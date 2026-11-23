import { describe, expect, test } from "bun:test";
import {
  distributionStorageSegment,
  validateDistributionFileName,
} from "./release-file-policy";

describe("validateDistributionFileName", () => {
  test("accepts apk for android", () => {
    expect(validateDistributionFileName("android", "app.apk")).toBeNull();
  });

  test("rejects zip for android", () => {
    expect(validateDistributionFileName("android", "bundle.zip")).not.toBeNull();
  });

  test("accepts zip for file platform", () => {
    expect(validateDistributionFileName("file", "assets.zip")).toBeNull();
  });

  test("accepts general files for file platform", () => {
    expect(validateDistributionFileName("file", "manual.pdf")).toBeNull();
  });

  test("rejects blocked extensions on file platform", () => {
    expect(validateDistributionFileName("file", "virus.exe")).not.toBeNull();
  });
});

describe("distributionStorageSegment", () => {
  test("maps platforms to storage folders", () => {
    expect(distributionStorageSegment("android")).toBe("android");
    expect(distributionStorageSegment("file")).toBe("files");
  });
});
