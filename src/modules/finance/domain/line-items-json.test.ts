import { describe, expect, test } from "bun:test";
import {
  LINE_ITEMS_JSON_TEMPLATE,
  parseLineItemsJson,
  parseLineItemsJsonText,
  toFormLinesFromJson,
} from "./line-items-json";

describe("line-items-json", () => {
  test("template parses and maps to form lines", () => {
    const doc = parseLineItemsJson(LINE_ITEMS_JSON_TEMPLATE);
    const lines = toFormLinesFromJson(doc);
    expect(lines).toHaveLength(3);
    expect(lines[0]?.priceOn).toBe("parent");
    expect(lines[0]?.children).toEqual([]);
    expect(lines[1]?.priceOn).toBe("children");
    expect(lines[1]?.children).toHaveLength(2);
    expect(lines[1]?.children[0]?.unitPrice).toBe(500_000);
    expect(lines[2]?.children[0]?.children).toHaveLength(2);
    expect(lines[2]?.children[0]?.children[0]?.unitPrice).toBe(300_000);
  });

  test("accepts bare lines array", () => {
    const doc = parseLineItemsJson([
      {
        description: "Solo",
        quantity: 2,
        unitPrice: 100,
        priceOn: "parent",
        children: [],
      },
    ]);
    expect(doc.version).toBe(1);
    expect(doc.lines[0]?.description).toBe("Solo");
  });

  test("rejects empty lines", () => {
    expect(() => parseLineItemsJson({ version: 1, lines: [] })).toThrow();
  });

  test("rejects invalid json text", () => {
    expect(() => parseLineItemsJsonText("{")).toThrow("Invalid JSON");
  });

  test("rejects nesting deeper than max", () => {
    expect(() =>
      parseLineItemsJson({
        version: 1,
        lines: [
          {
            description: "root",
            quantity: 1,
            unitPrice: 0,
            priceOn: "children",
            children: [
              {
                description: "l1",
                quantity: 1,
                unitPrice: 0,
                children: [
                  {
                    description: "l2",
                    quantity: 1,
                    unitPrice: 0,
                    children: [
                      {
                        description: "l3",
                        quantity: 1,
                        unitPrice: 10,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toThrow();
  });
});
