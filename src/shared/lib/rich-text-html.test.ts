import { describe, expect, it } from "bun:test";
import {
  formatDescriptionForPdf,
  isRichTextEmpty,
  stripRichText,
} from "./rich-text-html";

describe("rich-text-html", () => {
  it("detects empty editor html", () => {
    expect(isRichTextEmpty("<p></p>")).toBe(true);
    expect(isRichTextEmpty("<p><br></p>")).toBe(true);
    expect(isRichTextEmpty("<p>Hello</p>")).toBe(false);
  });

  it("strips tags for plain text", () => {
    expect(stripRichText("<p><strong>Hello</strong></p>")).toBe("Hello");
  });

  it("keeps allowed html for pdf output", () => {
    const html = formatDescriptionForPdf(
      '<p><strong>Hotel PMS</strong></p><ul><li>Front desk</li></ul>',
    );
    expect(html).toContain("<strong>Hotel PMS</strong>");
    expect(html).toContain("<ul>");
    expect(html).not.toContain("<script");
  });
});
