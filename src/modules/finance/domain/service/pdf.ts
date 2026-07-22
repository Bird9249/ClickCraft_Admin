import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { normalizePaymentSchedule } from "../payment-schedule";
// Bundled beside out/server/main.js on `bun run compile` (production PDF print)
import logoFile from "../../../../assets/brand/logo-clickcraft-transparant.webp" with {
  type: "file",
};

/** Bun emits a cwd-relative path in the bundle; resolve against this module dir. */
function resolveBundledAsset(file: string): string {
  if (isAbsolute(file)) return file;
  return join(import.meta.dir, file);
}

const BRAND_TEAL = "#00A896";
const CONTACT_EMAIL = "bkeonavong@gmail.com";
const CONTACT_WHATSAPP = "+856 20 924 91117";
const CONTACT_FACEBOOK = "ClickCraft";
const BRAND_TAGLINE = "ຄຣາຟຊອບແວໃຫ້ທຸລະກິດຂອງທ່ານ: ເວົ້າລົມງ່າຍ, ໄດ້ວຽກໄວ, ໃນລາຄາທີ່ເໝາະສົມ";

const LAO_MONTHS = [
  "ມັງກອນ",
  "ກຸມພາ",
  "ມີນາ",
  "ເມສາ",
  "ພຶດສະພາ",
  "ມິຖຸນາ",
  "ກໍລະກົດ",
  "ສິງຫາ",
  "ກັນຍາ",
  "ຕຸລາ",
  "ພະຈິກ",
  "ທັນວາ",
] as const;

const logoDataUri = (() => {
  try {
    const bytes = readFileSync(resolveBundledAsset(logoFile));
    return `data:image/webp;base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
})();

export interface PdfLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PdfDocBase {
  number: string;
  issueDate: Date | string;
  customerName: string;
  /** When false, hide the signature block on print. Default true. */
  showSignature?: boolean;
  customerAddress?: string | null;
  customerTaxId?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerContactName?: string | null;
  currency: string;
  lines: PdfLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  taxNote?: string | null;
  notes?: string | null;
  preparedBy?: string | null;
  paymentSchedule?: unknown;
}

type DocKind = "quotation" | "invoice" | "receipt";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatLaoDate(value: Date | string): string {
  const date = toDate(value);
  return `${date.getDate()} ${LAO_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** e.g. "22,000,000 LAK" — matches Website quotation print */
function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

function sharedStyles(): string {
  return `
  :root {
    --brand-teal: ${BRAND_TEAL};
    --brand-dark: #1A1A1A;
    --brand-gray: #6B7280;
    --brand-light: #F4F4F6;
    --brand-border: #E5E5E5;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f3f4f6;
    color: var(--brand-dark);
    font-family: 'Noto Sans Lao', 'Inter', ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    line-height: 1.55;
  }
  .toolbar {
    position: sticky;
    top: 0;
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 14px;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--brand-border);
    z-index: 10;
  }
  .toolbar button {
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    border-radius: 8px;
    padding: 10px 20px;
    border: 1px solid var(--brand-border);
    background: #fff;
    color: var(--brand-dark);
    transition: all .2s ease;
  }
  .toolbar button.primary {
    background: var(--brand-teal);
    border-color: var(--brand-teal);
    color: #fff;
  }
  .toolbar button:hover { transform: translateY(-1px); }
  .page {
    background: #fff;
    max-width: 820px;
    margin: 28px auto;
    padding: 48px 52px;
    border-radius: 16px;
    box-shadow: 0 24px 60px -30px rgba(26,26,26,0.25);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 22px;
    border-bottom: 2px solid var(--brand-dark);
  }
  .brand-block { display: flex; align-items: center; gap: 18px; }
  .brand-logo {
    display: block;
    height: 64px;
    width: auto;
    flex-shrink: 0;
    object-fit: contain;
    object-position: left center;
  }
  .brand-wordmark {
    font-size: 22px;
    font-weight: 700;
    color: var(--brand-dark);
    letter-spacing: -0.02em;
  }
  .brand-sub {
    color: var(--brand-gray);
    font-size: 12px;
    line-height: 1.5;
    max-width: 260px;
    margin: 0;
  }
  .company-contact { text-align: right; font-size: 11px; color: var(--brand-gray); }
  .company-contact strong { color: var(--brand-dark); display: block; font-size: 13px; margin-bottom: 3px; }
  .doc-title { margin: 26px 0 22px; font-size: 20px; font-weight: 700; }
  .doc-title span { color: var(--brand-teal); }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
    font-size: 13px;
  }
  @media (max-width: 640px) { .info-grid { grid-template-columns: 1fr; } }
  .info-box { background: var(--brand-light); border-radius: 12px; padding: 16px; }
  .info-label { font-size: 11px; color: var(--brand-gray); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin: 0; }
  .info-name { font-weight: 700; font-size: 15px; margin: 6px 0 4px; }
  .muted { color: var(--brand-gray); }
  .meta-row { display: flex; justify-content: space-between; border-bottom: 1px solid var(--brand-border); padding: 6px 0; gap: 12px; }
  .meta-row:last-child { border-bottom: none; }
  .mono { font-family: ui-monospace, 'SF Mono', Menlo, monospace; }
  .teal { color: var(--brand-teal); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px; }
  thead tr { background: var(--brand-dark); color: #fff; }
  thead th { padding: 12px 14px; text-align: left; font-weight: 600; }
  thead th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
  thead th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
  .cell { padding: 12px 14px; border-bottom: 1px solid var(--brand-border); vertical-align: top; }
  .center { text-align: center; }
  .right { text-align: right; }
  .summary {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 24px;
    border-top: 1px solid var(--brand-border);
    padding-top: 24px;
    margin-bottom: 32px;
  }
  .milestones { flex: 1 1 320px; font-size: 12px; color: var(--brand-gray); }
  .milestones h4 { color: var(--brand-dark); font-size: 13px; margin: 0 0 10px; }
  .milestone { display: flex; gap: 8px; margin-bottom: 6px; }
  .milestone b { color: var(--brand-teal); white-space: nowrap; }
  .note { color: #ef4444; font-size: 11px; margin-top: 10px; font-weight: 500; }
  .bank-block {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px dashed var(--brand-border);
  }
  .bank-block h4 { color: var(--brand-dark); font-size: 13px; margin: 0 0 10px; }
  .bank-qr {
    display: block;
    width: 120px;
    height: 120px;
    object-fit: contain;
    margin-top: 10px;
    border: 1px solid var(--brand-border);
    border-radius: 8px;
    background: #fff;
  }
  .totals {
    flex: 0 1 280px;
    background: var(--brand-light);
    border-radius: 12px;
    padding: 16px;
    font-size: 13px;
    height: fit-content;
  }
  .totals .row {
    display: flex;
    justify-content: space-between;
    color: var(--brand-gray);
    padding: 4px 0;
    gap: 12px;
  }
  .totals .grand {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    font-size: 17px;
    color: var(--brand-dark);
    border-top: 1px solid var(--brand-border);
    padding-top: 10px;
    margin-top: 6px;
    gap: 12px;
  }
  .signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    text-align: center;
    font-size: 12px;
    color: var(--brand-gray);
    margin-top: 16px;
  }
  .sign-line { font-weight: 700; color: var(--brand-dark); margin-top: 64px; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none; }
    .page { box-shadow: none; margin: 0; max-width: none; border-radius: 0; padding: 24px; }
  }`;
}

function renderLineRows(lines: PdfLine[], currency: string, showQty: boolean): string {
  return lines
    .map((line, i) => {
      const qtyCell = showQty
        ? `<td class="cell center muted">${line.quantity}</td>`
        : "";
      return `
        <tr>
          <td class="cell center muted">${i + 1}</td>
          <td class="cell">${escapeHtml(line.description)}</td>
          ${qtyCell}
          <td class="cell right mono">${formatMoney(line.amount, currency)}</td>
        </tr>`;
    })
    .join("");
}

function renderTable(doc: PdfDocBase, showQty: boolean): string {
  const qtyHeader = showQty
    ? '<th style="width:72px;text-align:center;">Qty</th>'
    : "";
  return `
    <table>
      <thead>
        <tr>
          <th style="width:48px;text-align:center;">#</th>
          <th>ລາຍການ / Description</th>
          ${qtyHeader}
          <th style="width:150px;text-align:right;">ມູນຄ່າ / Price (${escapeHtml(doc.currency)})</th>
        </tr>
      </thead>
      <tbody>${renderLineRows(doc.lines, doc.currency, showQty)}</tbody>
    </table>`;
}

function renderClientBox(doc: PdfDocBase): string {
  const contactBits: string[] = [];
  if (doc.customerContactName) {
    contactBits.push(`ຜູ້ຕິດຕໍ່ ${escapeHtml(doc.customerContactName)}`);
  }
  if (doc.customerPhone) {
    contactBits.push(`ໂທ ${escapeHtml(doc.customerPhone)}`);
  }
  if (doc.customerEmail) {
    contactBits.push(`Email: ${escapeHtml(doc.customerEmail)}`);
  }
  return `
    <div class="info-box">
      <p class="info-label">ຂໍ້ມູນລູກຄ້າ / CLIENT INFO</p>
      <p class="info-name">${escapeHtml(doc.customerName)}</p>
      ${contactBits.length ? `<p class="muted">${contactBits.join(" | ")}</p>` : ""}
      ${doc.customerAddress ? `<p class="muted">ທີ່ຢູ່ ${escapeHtml(doc.customerAddress)}</p>` : ""}
      ${doc.customerTaxId ? `<p class="muted">Tax ID: ${escapeHtml(doc.customerTaxId)}</p>` : ""}
    </div>`;
}

function renderMetaRows(
  rows: Array<{ label: string; value: string; mono?: boolean; teal?: boolean }>,
): string {
  return rows
    .map((row) => {
      const cls = [row.mono ? "mono" : "", row.teal ? "teal" : ""].filter(Boolean).join(" ");
      return `<div class="meta-row"><span class="muted">${row.label}</span><span class="${cls}">${row.value}</span></div>`;
    })
    .join("");
}

function renderTotals(doc: PdfDocBase): string {
  const taxLabel = doc.taxNote?.trim() ? escapeHtml(doc.taxNote) : "ພາສີມູນຄ່າເພີ່ມ / VAT (0%)";
  return `
    <div class="totals">
      <div class="row"><span>ລວມມູນຄ່າທັງໝົດ / Subtotal</span><span>${formatMoney(doc.subtotal, doc.currency)}</span></div>
      <div class="row"><span>${taxLabel}</span><span>${formatMoney(doc.taxAmount, doc.currency)}</span></div>
      <div class="grand"><span>ສຸດທິ / Grand Total</span><span class="teal">${formatMoney(doc.total, doc.currency)}</span></div>
    </div>`;
}

function renderQuotationSidePanel(doc: PdfDocBase & { validUntil?: Date | string | null }): string {
  const schedule = normalizePaymentSchedule(doc.paymentSchedule);
  const rows = schedule
    .map(
      (item) =>
        `<div class="milestone"><b>${escapeHtml(item.label)}:</b><span>${escapeHtml(item.condition)}</span></div>`,
    )
    .join("");
  return `
    <div class="milestones">
      <h4>ເງື່ອນໄຂການຊຳລະເງິນ (Payment Milestones):</h4>
      ${rows}
      ${doc.notes ? `<p class="note">* ໝາຍເຫດ: ${escapeHtml(doc.notes)}</p>` : ""}
    </div>`;
}

export type InvoiceBankSettings = {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  /** data URI for QR image (already loaded from storage) */
  qrDataUri?: string | null;
};

function renderBankPaymentBlock(bank?: InvoiceBankSettings | null): string {
  if (!bank) return "";
  const hasText =
    !!bank.bankName?.trim() ||
    !!bank.accountName?.trim() ||
    !!bank.accountNumber?.trim();
  const hasQr = !!bank.qrDataUri;
  if (!hasText && !hasQr) return "";

  const bankNameRow = bank.bankName?.trim()
    ? `<div class="milestone"><b>ທະນາຄານ / Bank:</b><span>${escapeHtml(bank.bankName)}</span></div>`
    : "";
  const accountNameRow = bank.accountName?.trim()
    ? `<div class="milestone"><b>ຊື່ບັນຊີ / Account name:</b><span>${escapeHtml(bank.accountName)}</span></div>`
    : "";
  const accountNumberRow = bank.accountNumber?.trim()
    ? `<div class="milestone"><b>ເລກບັນຊີ / Account no.:</b><span class="mono">${escapeHtml(bank.accountNumber)}</span></div>`
    : "";
  const qrRow = hasQr
    ? `<img src="${bank.qrDataUri}" alt="Bank QR" class="bank-qr" />`
    : "";

  return `
    <div class="bank-block">
      <h4>ບັນຊີທະນາຄານ / Bank Transfer</h4>
      ${bankNameRow}
      ${accountNameRow}
      ${accountNumberRow}
      ${qrRow}
    </div>`;
}

function renderInvoiceSidePanel(
  doc: PdfDocBase & {
    dueDate?: Date | string | null;
    milestoneLabel?: string | null;
    amountPaid?: number;
    bank?: InvoiceBankSettings | null;
  },
): string {
  const amountPaid = doc.amountPaid ?? 0;
  const balance = Math.max(0, doc.total - amountPaid);
  return `
    <div class="milestones">
      <h4>Invoice details</h4>
      ${doc.milestoneLabel ? `<div class="milestone"><b>Milestone:</b><span>${escapeHtml(doc.milestoneLabel)}</span></div>` : ""}
      ${doc.dueDate ? `<div class="milestone"><b>Due:</b><span>${formatLaoDate(doc.dueDate)}</span></div>` : ""}
      <div class="milestone"><b>Paid:</b><span>${formatMoney(amountPaid, doc.currency)}</span></div>
      <div class="milestone"><b>Balance:</b><span>${formatMoney(balance, doc.currency)}</span></div>
      ${doc.notes ? `<p class="note">* ໝາຍເຫດ: ${escapeHtml(doc.notes)}</p>` : ""}
      ${renderBankPaymentBlock(doc.bank)}
    </div>`;
}

function renderReceiptSidePanel(
  doc: PdfDocBase & { paymentMethod?: string; reference?: string | null },
): string {
  return `
    <div class="milestones">
      <h4>Payment details</h4>
      ${doc.paymentMethod ? `<div class="milestone"><b>Method:</b><span>${escapeHtml(doc.paymentMethod)}</span></div>` : ""}
      ${doc.reference ? `<div class="milestone"><b>Reference:</b><span class="mono">${escapeHtml(doc.reference)}</span></div>` : ""}
      ${doc.notes ? `<p class="note">* ໝາຍເຫດ: ${escapeHtml(doc.notes)}</p>` : ""}
    </div>`;
}

function renderSignatures(kind: DocKind): string {
  const left =
    kind === "quotation"
      ? { title: "ສະເໜີລາຄາໂດຍ / Proposed by", name: "( ທີມງານພັດທະນາ ClickCraft )" }
      : { title: "ອອກເອກະສານໂດຍ / Issued by", name: "( ທີມງານບັນຊີ ClickCraft )" };
  const right =
    kind === "quotation"
      ? { title: "ອະນຸມັດ ແລະ ຕົກລົງຈ້າງ / Approved by", name: "( ຕົວແທນຈາກຜູ້ວ່າຈ້າງ )" }
      : kind === "invoice"
        ? { title: "ຜູ້ຮັບເອກະສານ / Received by", name: "( ຕົວແທນຈາກລູກຄ້າ )" }
        : { title: "ຜູ້ຊຳລະເງິນ / Paid by", name: "( ຕົວແທນຈາກລູກຄ້າ )" };
  return `
    <div class="signatures">
      <div>
        <p>${left.title}</p>
        <p class="sign-line">......................................................</p>
        <p style="color:var(--brand-dark);font-weight:500;">${left.name}</p>
        <p>ວັນທີ: ...... / ...... / ......</p>
      </div>
      <div>
        <p>${right.title}</p>
        <p class="sign-line">......................................................</p>
        <p style="color:var(--brand-dark);font-weight:500;">${right.name}</p>
        <p>ວັນທີ: ...... / ...... / ......</p>
      </div>
    </div>`;
}

function buildDocumentHtml(options: {
  kind: DocKind;
  laoTitle: string;
  enTitle: string;
  titleSuffix?: string;
  doc: PdfDocBase;
  metaRows: Array<{ label: string; value: string; mono?: boolean; teal?: boolean }>;
  sidePanel: string;
  showQty: boolean;
}): string {
  const { kind, laoTitle, enTitle, titleSuffix, doc, metaRows, sidePanel, showQty } = options;
  const pageTitle = `${laoTitle} ${doc.number}`;
  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="ClickCraft" class="brand-logo" />`
    : `<div class="brand-wordmark">ClickCraft</div>`;
  return `<!DOCTYPE html>
<html lang="lo">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(pageTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>${sharedStyles()}</style>
</head>
<body>
  <div class="toolbar">
    <button class="primary" onclick="window.print()">ພິມ / ບັນທຶກເປັນ PDF</button>
  </div>
  <div class="page">
    <div class="header">
      <div class="brand-block">
        ${logoHtml}
        <p class="brand-sub">${BRAND_TAGLINE}</p>
      </div>
      <div class="company-contact">
        <strong>ClickCraft · Software Studio for SME</strong>
        <div>WhatsApp: ${escapeHtml(CONTACT_WHATSAPP)}</div>
        <div>Facebook: ${escapeHtml(CONTACT_FACEBOOK)}</div>
        <div>Email: ${escapeHtml(CONTACT_EMAIL)}</div>
      </div>
    </div>
    <h1 class="doc-title">${laoTitle} <span>${enTitle}</span>${titleSuffix ? ` — ${escapeHtml(titleSuffix)}` : ""}</h1>
    <div class="info-grid">
      ${renderClientBox(doc)}
      <div>${renderMetaRows(metaRows)}</div>
    </div>
    ${renderTable(doc, showQty)}
    <div class="summary">
      ${sidePanel}
      ${renderTotals(doc)}
    </div>
    ${doc.showSignature === false ? "" : renderSignatures(kind)}
  </div>
</body>
</html>`;
}

export function renderQuotationHtml(
  doc: PdfDocBase & { validUntil?: Date | string | null },
): string {
  const validityValue = doc.validUntil
    ? formatLaoDate(doc.validUntil)
    : "30 ວັນ (30 Days)";
  return buildDocumentHtml({
    kind: "quotation",
    laoTitle: "ໃບສະເໜີລາຄາ",
    enTitle: "Quotation",
    doc,
    showQty: doc.lines.some((l) => l.quantity !== 1),
    metaRows: [
      { label: "ເລກທີເອກະສານ / Document No.", value: escapeHtml(doc.number), mono: true },
      { label: "ວັນທີອອກ / Issue Date", value: formatLaoDate(doc.issueDate) },
      { label: "ກຳນົດຢືນລາຄາ / Validity", value: validityValue },
      {
        label: "ຜູ້ຮັບຜິດຊອບ / Prepared by",
        value: escapeHtml(doc.preparedBy ?? "ClickCraft Account Team"),
        teal: true,
      },
    ],
    sidePanel: renderQuotationSidePanel(doc),
  });
}

export function renderInvoiceHtml(
  doc: PdfDocBase & {
    dueDate?: Date | string | null;
    milestoneLabel?: string | null;
    amountPaid?: number;
    bank?: InvoiceBankSettings | null;
  },
): string {
  return buildDocumentHtml({
    kind: "invoice",
    laoTitle: "ໃບເກັບເງິນ",
    enTitle: "Invoice",
    titleSuffix: doc.milestoneLabel ?? undefined,
    doc,
    showQty: doc.lines.some((l) => l.quantity !== 1),
    metaRows: [
      { label: "ເລກທີເອກະສານ / Document No.", value: escapeHtml(doc.number), mono: true },
      { label: "ວັນທີອອກ / Issue Date", value: formatLaoDate(doc.issueDate) },
      {
        label: "ກຳນົດຊຳລະ / Due Date",
        value: doc.dueDate ? formatLaoDate(doc.dueDate) : "—",
      },
      {
        label: "ຜູ້ຮັບຜິດຊອບ / Prepared by",
        value: escapeHtml(doc.preparedBy ?? "ClickCraft Account Team"),
        teal: true,
      },
    ],
    sidePanel: renderInvoiceSidePanel(doc),
  });
}

export function renderReceiptHtml(
  doc: PdfDocBase & { paymentMethod?: string; reference?: string | null },
): string {
  return buildDocumentHtml({
    kind: "receipt",
    laoTitle: "ໃບຮັບເງິນ",
    enTitle: "Receipt",
    doc,
    showQty: false,
    metaRows: [
      { label: "ເລກທີເອກະສານ / Document No.", value: escapeHtml(doc.number), mono: true },
      { label: "ວັນທີອອກ / Issue Date", value: formatLaoDate(doc.issueDate) },
      {
        label: "ວິທີຊຳລະ / Method",
        value: escapeHtml(doc.paymentMethod ?? "—"),
      },
      {
        label: "ຜູ້ຮັບຜິດຊອບ / Prepared by",
        value: escapeHtml(doc.preparedBy ?? "ClickCraft Account Team"),
        teal: true,
      },
    ],
    sidePanel: renderReceiptSidePanel(doc),
  });
}
