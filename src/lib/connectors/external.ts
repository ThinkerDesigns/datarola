// ponytail: External data source sync functions — direct API calls using user credentials from Firestore.
'use server';

import type { DataRow } from '@/lib/schema';

interface SyncResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  rowCount: number;
}

// --- BigQuery ---
export async function syncBigQuery(params: {
  projectId: string;
  accessToken: string;
  query: string;
}): Promise<SyncResult> {
  const res = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${params.projectId}/queries`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${params.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: params.query, useLegacySql: false }),
    }
  );
  if (!res.ok) throw new Error(`BigQuery error: ${await res.text()}`);
  const json = (await res.json()) as {
    schema?: { fields?: Array<{ name: string; type: string }> };
    rows?: Array<{ f: Array<{ v: unknown }> }>;
    totalRows?: string;
  };
  const columns = (json.schema?.fields ?? []).map((f) => f.name);
  const values: SyncResult['rows'] = (json.rows ?? []).map((row) =>
    (row.f ?? []).map((f) => f.v == null ? null : f.v as string | number | boolean)
  );
  return { columns, rows: values, rowCount: json.totalRows ? parseInt(json.totalRows) : values.length };
}

// --- Snowflake via REST API ---
export async function syncSnowflake(params: {
  account: string;
  user: string;
  password: string;
  database: string;
  schema: string;
  warehouse: string;
  query: string;
}): Promise<SyncResult> {
  const baseUrl = `https://${params.account}.snowflakecomputing.com`;

  // Authenticate with key-pair or username/password
  const authRes = await fetch(`${baseUrl}/sessions/v1/token-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authenticator: 'USERNAME_PASSWORD',
      userName: params.user,
      password: params.password,
    }),
  });

  if (!authRes.ok) throw new Error(`Snowflake auth failed: ${await authRes.text()}`);
  const authData = await authRes.json() as { token?: string };
  if (!authData.token) throw new Error('Snowflake auth returned no token');

  // Execute query via REST API
  const res = await fetch(`${baseUrl}/queries/v1/query-request?requestId=${Date.now()}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authData.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      databaseName: params.database,
      schemaName: params.schema,
      warehouse: params.warehouse,
      sqlText: params.query,
    }),
  });

  if (!res.ok) throw new Error(`Snowflake query failed: ${await res.text()}`);
  const json = await res.json() as {
    columnMetaData?: Array<{ name: string }>;
    resultStreamUrl?: string;
  };

  // Get columns from metadata
  const columns = (json.columnMetaData ?? []).map((c) => c.name);

  // Fetch rows from stream URL
  let rows: SyncResult['rows'] = [];
  if (json.resultStreamUrl) {
    const streamRes = await fetch(json.resultStreamUrl + '&max_batch_size=10000');
    if (streamRes.ok) {
      const streamData = await streamRes.json() as { result_set?: string[][] };
      rows = (streamData.result_set ?? []).map((r) => r.map((v) => (v === null || v === 'null' ? null : parseSnowflakeValue(v))) as (string | number | boolean | null)[]);
    }
  }

  return { columns, rows, rowCount: rows.length };
}

function parseSnowflakeValue(v: string): unknown {
  if (v === null || v === 'null' || v === '') return null;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+(e[+-]?\d+)?$/.test(v)) return parseFloat(v);
  if (v.toLowerCase() === 'true') return true;
  if (v.toLowerCase() === 'false') return false;
  return v;
}

// --- PostgreSQL via pg driver (Node.js runtime only) ---
export async function syncPostgreSQL(params: {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  query: string;
}): Promise<SyncResult> {
  // Use pg driver - works in Node.js serverless functions but NOT Edge runtime
  // This will be called from Firebase Functions or Cloud Run worker
  throw new Error('PostgreSQL sync requires a backend function. Use the connector extension to deploy.');
}

// --- MySQL via mysql2 ---
export async function syncMySQL(params: {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  query: string;
}): Promise<SyncResult> {
  throw new Error('MySQL sync requires a backend function. Use the connector extension to deploy.');
}

// --- Redshift (compatible with PostgreSQL protocol) ---
export async function syncRedshift(params: {
  host: string;
  port: string;
  database: string;
  schema: string;
  user: string;
  password: string;
  query: string;
}): Promise<SyncResult> {
  throw new Error('Redshift sync requires a backend function. Use the connector extension to deploy.');
}

// --- Airtable via REST API ---
export async function syncAirtable(params: {
  accessToken: string;
  baseId: string;
  tableName: string;
}): Promise<SyncResult> {
  const res = await fetch(
    `https://api.airtable.com/v0/${params.baseId}/${encodeURIComponent(params.tableName)}`,
    { headers: { Authorization: `Bearer ${params.accessToken}` } }
  );
  if (!res.ok) throw new Error(`Airtable error: ${await res.text()}`);
  const json = await res.json() as { records?: Array<{ fields: Record<string, unknown> }> };
  const records = json.records ?? [];
  if (records.length === 0) return { columns: [], rows: [], rowCount: 0 };

  // Collect all unique column names across records
  const colSet = new Set<string>();
  for (const r of records) { for (const k of Object.keys(r.fields)) colSet.add(k); }
  const columns = Array.from(colSet);

  const rows = records.map((r) =>
    columns.map((c) => {
      const val = r.fields[c];
      if (Array.isArray(val)) return val.join(', ') as string;
      if (typeof val === 'object' && val !== null) return JSON.stringify(val) as string;
      return (val ?? '') as string | number | boolean | null;
    })
  ) as (string | number | boolean | null)[][];

  return { columns, rows, rowCount: records.length };
}
