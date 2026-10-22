/**
 * RFC 4180 compliant CSV generator with UTF-8 Byte Order Mark (BOM)
 * Ensures perfect compatibility with Microsoft Excel, Google Sheets, and Numbers.
 */

export function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCSV(rows: (unknown[])[]): string {
  const content = rows.map((row) => row.map(escapeCSVCell).join(',')).join('\r\n');
  return `\uFEFF${content}`;
}
