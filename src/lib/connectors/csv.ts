// CSV sync — parses uploaded CSV text into rows.

export function parseCSVRaw(text: string): { columns: string[]; values: (string | number | boolean | null)[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { columns: [], values: [] };

  const parsed = lines.map(parseCSVLine);
  const columns = parsed[0].map((v) => v ?? '');
  const values = parsed.slice(1).map((row) => row.map((v) => {
    if (v == null || v === '') return null;
    if (/^-?\d+$/.test(v)) return parseInt(v, 10);
    if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
    if (v.toLowerCase() === 'true') return true;
    if (v.toLowerCase() === 'false') return false;
    return v;
  }));

  return { columns, values };
}

// Simple CSV line parser — handles quoted fields and escaped quotes
function parseCSVLine(line: string): (string | null)[] {
  const result: (string | null)[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim() || null);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim() || null);
  return result;
}
