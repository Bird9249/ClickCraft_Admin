import { describe, expect, it } from "bun:test";
import {
  lineGroupAmount,
  resolvePriceOn,
  scaleLineForMilestone,
} from "./line-pricing";

describe("lineGroupAmount", () => {
  it("uses parent pricing when priceOn is parent", () => {
    expect(
      lineGroupAmount({
        description: "Group",
        quantity: 1,
        unitPrice: 10_000_000,
        sortOrder: 0,
        priceOn: "parent",
        children: [
          {
            description: "Detail",
            quantity: 1,
            unitPrice: 0,
            sortOrder: 0,
          },
        ],
      }),
    ).toBe(10_000_000);
  });

  it("uses child pricing when priceOn is children", () => {
    expect(
      lineGroupAmount({
        description: "Group",
        quantity: 1,
        unitPrice: 0,
        sortOrder: 0,
        priceOn: "children",
        children: [
          {
            description: "Part A",
            quantity: 1,
            unitPrice: 4_000_000,
            sortOrder: 0,
          },
          {
            description: "Part B",
            quantity: 2,
            unitPrice: 3_000_000,
            sortOrder: 1,
          },
        ],
      }),
    ).toBe(10_000_000);
  });
});

describe("resolvePriceOn", () => {
  it("detects children pricing from amounts when price_on is missing", () => {
    expect(
      resolvePriceOn(
        0,
        [{ amount: 5_000_000 }, { amount: 3_000_000 }],
        null,
      ),
    ).toBe("children");
  });
});

describe("scaleLineForMilestone", () => {
  it("scales child unit prices when priceOn is children", () => {
    const scaled = scaleLineForMilestone(
      {
        description: "Group",
        quantity: 1,
        unitPrice: 0,
        sortOrder: 0,
        priceOn: "children",
        children: [
          {
            description: "Part A",
            quantity: 1,
            unitPrice: 10_000_000,
            sortOrder: 0,
          },
        ],
      },
      40,
    );

    expect(scaled.unitPrice).toBe(0);
    expect(scaled.children[0]?.unitPrice).toBe(4_000_000);
  });
});
