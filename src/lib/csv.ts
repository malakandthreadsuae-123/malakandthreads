/** RFC 4180 CSV helpers with spreadsheet formula-injection protection. */

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);
  // Neutralise formula injection (=, +, -, @, tab, CR) when opened in Excel/Sheets
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\r\n") + "\r\n";
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function csvResponse(filename: string, csv: string) {
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}
