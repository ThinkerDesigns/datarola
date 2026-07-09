'use client';

// Download data as CSV file — used for query result export.

export function downloadCSV(columns: string[], values: unknown[][], filename?: string) {
  const rows = [columns, ...values.map((row) => row.map((v) => {
    if (v == null || v === '') return '';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    const s = String(v);
    // Escape fields containing commas or quotes
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }))];

  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `datarola-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
