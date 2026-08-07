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
    expect(tree[0]?.children).toEqual([
      {
        description: "UI Design",
        quantity: 1,
        unitPrice: 0,
        sortOrder: 0,
      },
      {
        description: "Frontend",
        quantity: 1,
        unitPrice: 0,
        sortOrder: 1,
      },
    ]);
    expect(tree[1]?.children).toEqual([]);
  });

  it("preserves children pricing mode", () => {
    const tree = buildLineTree([
      {
        id: "p1",
        description: "ERP Modules",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        sortOrder: 0,
        parentLineId: null,
        priceOn: "children",
      },
      {
        id: "c1",
        description: "Inventory",
        quantity: 1,
        unitPrice: 8_000_000,
        amount: 8_000_000,
        sortOrder: 0,
        parentLineId: "p1",
      },
      {
        id: "c2",
        description: "Sales",
        quantity: 1,
        unitPrice: 10_000_000,
        amount: 10_000_000,
        sortOrder: 1,
        parentLineId: "p1",
      },
    ]);

    expect(tree[0]?.priceOn).toBe("children");
    expect(tree[0]?.children[0]?.unitPrice).toBe(8_000_000);
  });
});

describe("linesToPdfRows", () => {
  it("renders group header followed by indented sub-items", () => {
    const rows = linesToPdfRows([
      {
        id: "p1",
        description: "Web Development",
        quantity: 1,
        unitPrice: 10_000_000,
        amount: 10_000_000,
        sortOrder: 0,
        priceOn: "parent",
        children: [
          {
            description: "UI Design",
            quantity: 1,
            unitPrice: 0,
            sortOrder: 0,
          },
        ],
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      description: "Web Development",
      isGroup: true,
      isSubItem: false,
      amount: 10_000_000,
    });
    expect(rows[1]).toMatchObject({
      description: "UI Design",
      isSubItem: true,
      depth: 1,
      showSubItemPrice: false,
    });
  });

  it("shows sub-item prices when priceOn is children", () => {
    const rows = linesToPdfRows([
      {
        id: "p1",
        description: "ERP Modules",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        sortOrder: 0,
        priceOn: "children",
        children: [
          {
            description: "Inventory",
            quantity: 1,
            unitPrice: 8_000_000,
            sortOrder: 0,
          },
        ],
      },
    ]);

    expect(rows[0]?.amount).toBe(8_000_000);
    expect(rows[1]).toMatchObject({
      description: "Inventory",
      amount: 8_000_000,
      showSubItemPrice: true,
    });
  });
});
