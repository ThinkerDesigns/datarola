// Google Sheets sync — reads a sheet range and stores rows in Firestore.
// Uses the Sheets API via fetch (OAuth2 access token stored in Firestore per user).

import type { DataRow } from '@/lib/schema';

export async function syncGoogleSheet(params: {
  uid: string;
  spreadsheetId: string;
  range: string;
  accessToken: string;
}): Promise<{ columns: string[]; rows: (string | number | boolean | null)[][]; rowCount: number }> {
  if (!params.spreadsheetId) throw new Error('spreadsheetId is required');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadsheetId}/values/${params.range}?access_token=${encodeURIComponent(params.accessToken)}`;

  console.log('[sheets] fetching:', url.replace(params.accessToken, '[TOKEN]'));
  const res = await fetch(url, { next: { revalidate: 300 } }); // 5 min cache
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Sheets API error ${res.status}: ${body}. Make sure the Google Sheets API is enabled in your Cloud Console.`);
  }

  const json = await res.json() as { values?: unknown[][] };
  const raw: unknown[][] = json.values ?? [];

  if (raw.length === 0) return { columns: [], rows: [], rowCount: 0 };

  const columns = (raw[0] as string[]).map((c) => c?.toString() ?? '');
  const rows = raw.slice(1).map((row) => row.map((v) => v == null ? null : typeof v === 'number' ? v : v.toString()));

  return { columns, rows, rowCount: rows.length };
}
