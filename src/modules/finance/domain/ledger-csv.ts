import type { LedgerTypeDTO } from "./contracts";

export type ParsedLedgerRow = {
  type: LedgerTypeDTO;
  entryDate: Date;
  category: string;
  amount: number;
  relatedParty: string | null;
  notes: string | null;
};

export type ParseLedgerCsvResult = {
  rows: ParsedLedgerRow[];
  skipped: number;
  errors: string[];
};

/** Marker prefix stored in `notes` for CSV-imported rows. */
export const LEDGER_CSV_IMPORT_MARKER = "CSV_IMPORT";

export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function parseDate(value: string): Date {
  const [d, m, y] = value.split("/").map((v) => Number.parseInt(v, 10));
  if (!d || !m || !y) throw new Error(`Invalid date: ${value}`);
  return new Date(y, m - 1, d);
}

function parseAmount(value: string): number {
  const n = Number.parseInt(value.replace(/,/g, ""), 10);
  if (Number.isNaN(n)) throw new Error(`Invalid amount: ${value}`);
  return n;
}

function mapType(value: string): LedgerTypeDTO {
  const v = value.trim();
  if (v === "รายรับ") return "income";
  if (v === "รายจ่าย") return "expense";
  throw new Error(`Unknown type: ${value}`);
}

/**
 * Parse ClickCraft ledger CSV export.
 * Expected columns: วันที่, ประเภท, รายการ, จำนวนเงิน, ผู้เกี่ยวข้อง, คงเหลือสะสม, (notes)
 */
export function parseLedgerCsv(raw: string): ParseLedgerCsvResult {
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const rows: ParsedLedgerRow[] = [];
  const errors: string[] = [];
  let skipped = 0;

  if (lines.length < 2) {
    return { rows, skipped, errors: ["CSV is empty or has no data rows"] };
  }

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cols = parseCsvLine(lines[i] ?? "");
    if (cols.length < 4) {
      skipped++;
      continue;
    }

    const [dateStr, typeStr, category, amountStr, relatedParty, , noteExtra] =
      cols;

    if (!dateStr?.trim() || !typeStr?.trim() || !category?.trim()) {
      skipped++;
      continue;
    }

    if (!amountStr?.trim()) {
      errors.push(`Line ${lineNo}: missing amount`);
      skipped++;
      continue;
    }

    try {
      const amount = parseAmount(amountStr);
      if (amount <= 0) {
        errors.push(`Line ${lineNo}: amount must be positive`);
        skipped++;
        continue;
      }

      rows.push({
        type: mapType(typeStr),
        entryDate: parseDate(dateStr.trim()),
        category: category.trim(),
        amount,
        relatedParty: relatedParty?.trim() || null,
        notes: noteExtra?.trim() || null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(`Line ${lineNo}: ${message}`);
      skipped++;
    }
  }

  return { rows, skipped, errors };
}

export function buildImportNotes(
  batchId: string,
  rowNote?: string | null,
): string {
  if (rowNote?.trim()) return `${batchId} | ${rowNote.trim()}`;
  return batchId;
}
