// External data source sync functions.
// These make direct API calls using user-provided credentials stored in Firestore.
// In production, these should run as Firebase Functions to avoid exposing secrets in client-side code.

import type { DataRow } from '@/lib/schema';

interface SyncResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  rowCount: number;
}

// --- BigQuery ---
export async function syncBigQuery(params: { projectId: string; datasetId: string; query: string; accessToken: string }): Promise<SyncResult> {
  const res = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${params.projectId}/queries`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${params.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: params.query, useLegacySql: false }),
  });
  if (!res.ok) throw new Error(`BigQuery error: ${await res.text()}`);
  const json = await res.json() as { schema?: { fields?: Array<{ name: string; type: string }> }; rows?: Array<{ f: Array<{ v: unknown }> }>; totalRows?: string };
  const columns = (json.schema?.fields ?? []).map((f) => f.name);
  const values: SyncResult['rows'] = (json.rows ?? []).map((row) => (row.f ?? []).map((f) => f.v == null ? null : f.v as string | number | boolean));
  return { columns, rows: values, rowCount: json.totalRows ? parseInt(json.totalRows) : values.length };
}

// --- PostgreSQL ---
export async function syncPostgreSQL(params: { host: string; port: string; database: string; user: string; password: string; query: string }): Promise<SyncResult> {
  // In production this would connect to a PostgreSQL instance and run the query.
  // For now we return empty — real implementation needs pg driver which can't run in Next.js Edge runtime.
  throw new Error('PostgreSQL sync requires a Firebase Function or separate worker');
}

// --- MySQL ---
export async function syncMySQL(params: { host: string; port: string; database: string; user: string; password: string; query: string }): Promise<SyncResult> {
  throw new Error('MySQL sync requires a Firebase Function or separate worker');
}

// --- Snowflake ---
export async function syncSnowflake(params: { account: string; warehouse: string; database: string; schema: string; user: string; password: string; query: string }): Promise<SyncResult> {
  throw new Error('Snowflake sync requires a Firebase Function or separate worker');
}

// --- Redshift ---
export async function syncRedshift(params: { host: string; port: string; database: string; schema: string; user: string; password: string; query: string }): Promise<SyncResult> {
  throw new Error('Redshift sync requires a Firebase Function or separate worker');
}
