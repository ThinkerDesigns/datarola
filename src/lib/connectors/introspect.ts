'use server';

// ponytail: Schema introspection for connected data sources.
import { refreshAccessToken } from '@/lib/google-oauth';
import { syncBigQuery, syncSnowflake } from './external';

export interface IntrospectResult {
  tables?: Array<{ name: string; columns: string[] }>;
  columns?: string[];
  rowCount?: number;
}

export async function introspectSource(uid: string, dsId: string): Promise<IntrospectResult> {
  // Fetch source metadata from Firestore to determine type
  // This is called from client with the uid + dsId, we need to read the source config.
  // Since this is a server action, we use env for now and rely on the caller passing ds info.
  // In production, this would read from Firebase; for simplicity, callers should pass type.
  return { columns: [], tables: [] };
}

export async function introspectGoogleSheet(spreadsheetId: string, accessToken: string): Promise<IntrospectResult> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(title,properties(sheetType),data[columns])`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!metaRes.ok) return { columns: [] };
  const json = await metaRes.json() as { sheets?: Array<{ title: string; properties?: { sheetType: string }; data?: { columns?: string[] } }> };

  const tables: Array<{ name: string; columns: string[] }> = [];
  for (const sheet of json.sheets ?? []) {
    if (sheet.properties?.sheetType === 'GRID') {
      // Get actual column names from first row
      const rangeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet.title)}!1:1`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (rangeRes.ok) {
        const rangeData = await rangeRes.json() as { values?: string[][] };
        tables.push({ name: sheet.title, columns: rangeData.values?.[0] ?? [] });
      } else {
        tables.push({ name: sheet.title, columns: [] });
      }
    }
  }

  // Also get row count
  const valRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tables[0]?.name ?? 'Sheet1')!}?majorDimension=ROWS`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  let rowCount = 0;
  if (valRes.ok) {
    const vd = await valRes.json() as { range?: string };
    if (vd.range) {
      const parts = vd.range.split('!');
      if (parts[1]) {
        const [, , rowEnd] = parts[1].match(/^(\d+):(\d+)$/)?.slice(1) ?? [];
        rowCount = Number(rowEnd) - 1; // minus header row
      }
    }
  }

  return { tables, rowCount };
}

export async function introspectAirtable(accessToken: string, baseId: string): Promise<IntrospectResult> {
  const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${encodeURIComponent(baseId)}/tables`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!tablesRes.ok) return { columns: [] };
  const json = await tablesRes.json() as { tables?: Array<{ id: string; name: string; fields: Array<{ name: string }> }> };

  const tables: Array<{ name: string; columns: string[] }> = [];
  for (const t of json.tables ?? []) {
    tables.push({ name: t.name, columns: t.fields?.map(f => f.name) ?? [] });
  }
  return { tables };
}

export async function introspectBigQuery(projectId: string, accessToken: string, datasetId: string): Promise<IntrospectResult> {
  const res = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${encodeURIComponent(datasetId)}/tables`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return { columns: [] };
  const json = await res.json() as { tables?: { tableReference: { tableId: string }; schema: { fields?: Array<{ name: string; type: string }> }[] }[] } | null;
  const tables: Array<{ name: string; columns: string[] }> = [];
  for (const t of json.tables ?? []) {
    tables.push({
      name: t.tableReference?.tableId ?? '?',
      columns: t.schema?.fields?.map(f => f.name) ?? [],
    });
  }
  return { tables };
}

export async function introspectSnowflake(params: { account: string; user: string; password: string; database: string; schema: string }): Promise<IntrospectResult> {
  // Snowflake: use SHOW TABLES + INFORMATION_SCHEMA.COLUMNS via SQL
  const query = `SELECT TABLE_NAME, COLUMN_NAME FROM ${params.database}.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${params.schema}'`;
  try {
    const result = await syncSnowflake({ ...params, warehouse: params.warehouse ?? '', query });
    const tables = new Map<string, string[]>();
    for (const row of result.rows) {
      const tableName = String(row[0] ?? '');
      const colName = String(row[1] ?? '');
      if (!tables.has(tableName)) tables.set(tableName, []);
      tables.get(tableName)?.push(colName);
    }
    return { tables: [...tables.entries()].map(([name, columns]) => ({ name, columns })) };
  } catch {
    return { columns: [] };
  }
}
