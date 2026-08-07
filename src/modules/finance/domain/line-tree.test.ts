import { describe, expect, it } from "bun:test";
import { buildLineTree, linesToPdfRows } from "./line-tree";

describe("buildLineTree", () => {
  it("groups sub-items under parent lines", () => {
    const tree = buildLineTree([
      {
        id: "p1",
        description: "Web Development",
        quantity: 1,
        unitPrice: 10_000_000,
        amount: 10_000_000,
        sortOrder: 0,
        parentLineId: null,
        priceOn: "parent",
      },
      {
        id: "c1",
        description: "UI Design",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        sortOrder: 0,
        parentLineId: "p1",
      },
      {
        id: "c2",
        description: "Frontend",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        sortOrder: 1,
        parentLineId: "p1",
      },
      {
        id: "p2",
        description: "Hosting",
        quantity: 1,
        unitPrice: 2_000_000,
        amount: 2_000_000,
        sortOrder: 1,
        parentLineId: null,
        priceOn: "parent",
      },
    ]);

    expect(tree).toHaveLength(2);
    expect(tree[0]?.priceOn).toBe("parent");
    expect(tree[0]?.children[0]).toMatchObject({
      description: "UI Design",
      children: [],
    });
  });

  it("builds two-level nested sub-items", () => {
    const tree = buildLineTree([
      {
        id: "p1",
        description: "Platform",
        quantity: 1,
        unitPrice: 10_000_000,
        amount: 10_000_000,
        sortOrder: 0,
        parentLineId: null,
        priceOn: "parent",
      },
      {
        id: "c1",
        description: "Front desk module",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        sortOrder: 0,
        parentLineId: "p1",
      },
      {
        id: "c2",
        description: "Booking calendar",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        sortOrder: 0,
        parentLineId: "c1",
      },
    ]);

    expect(tree[0]?.children[0]?.children[0]?.description).toBe(
      "Booking calendar",
    );
  });
});

describe("linesToPdfRows", () => {
  it("renders nested sub-items with increasing depth", () => {
    const rows = linesToPdfRows([
      {
        id: "p1",
        description: "Platform",
        quantity: 1,
        unitPrice: 10_000_000,
        amount: 10_000_000,
        sortOrder: 0,
        priceOn: "parent",
        children: [
          {
            description: "Front desk module",
            quantity: 1,
            unitPrice: 0,
            sortOrder: 0,
            children: [
              {
                description: "Booking calendar",
                quantity: 1,
                unitPrice: 0,
                sortOrder: 0,
                children: [],
              },
            ],
          },
        ],
      },
    ]);

    expect(rows).toHaveLength(3);
    expect(rows[1]?.depth).toBe(1);
    expect(rows[2]?.depth).toBe(2);
  });
});
