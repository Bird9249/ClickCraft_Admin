/** Strip HTML tags and decode common entities for validation / plain preview. */
export function stripRichText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

export function isRichTextEmpty(html?: string | null): boolean {
  if (!html) return true;
  return stripRichText(html).length === 0;
}

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "a",
  "mark",
  "sub",
  "sup",
  "span",
  "hr",
  "code",
]);

/** Very small allowlist sanitizer for PDF rendering. */
export function sanitizeRichHtml(html: string): string {
  if (!html || !/[<>]/.test(html)) {
    return escapeHtml(html ?? "");
  }

  return html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
    const lowerTag = String(tag).toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) return "";

    if (match.startsWith("</")) {
      return `</${lowerTag}>`;
    }

    if (lowerTag === "br" || lowerTag === "hr") {
      return `<${lowerTag}>`;
    }

    if (lowerTag === "a") {
      const hrefMatch = String(attrs).match(/href="([^"]+)"/i);
      const href = hrefMatch?.[1] ?? "";
      if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
        return "";
      }
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">`;
    }

    if (lowerTag === "span") {
      const styleMatch = String(attrs).match(/style="([^"]*)"/i);
      const style = styleMatch?.[1] ?? "";
      const textAlign = style.match(/text-align:\s*(left|center|right|justify)/i)?.[1];
      if (textAlign) {
        return `<span style="text-align:${textAlign}; display:block;">`;
      }
      return "<span>";
    }

    return `<${lowerTag}>`;
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDescriptionForPdf(description: string): string {
  if (!description) return "";
  if (!/[<>]/.test(description)) {
    return escapeHtml(description).replace(/\n/g, "<br>");
  }
  return sanitizeRichHtml(description);
}
