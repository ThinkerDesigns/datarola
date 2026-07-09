// ponytail: connector registry — each type exports a sync function and config schema.

import type { ConnectorType, DataRow } from '@/lib/schema';

export interface ConnectorDef {
  name: string;
  fields: Array<{ key: string; label: string; type: 'text' | 'password' | 'select' }>;
  selector?: string;   // sheet range / table selector (e.g. "A1:D100" or "SELECT * FROM ...")
}

export interface SyncResult {
  rows: DataRow[];
  rowCount: number;
}

// Registry of supported connectors (keys match ConnectorType)
export const CONNECTORS: Record<ConnectorType, ConnectorDef> = {
  'google-sheets': {
    name: 'Google Sheets',
    fields: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text' },
      { key: 'range', label: 'Sheet range', type: 'text' },
    ],
    selector: 'A1:Z10000',
  },
  'csv-upload': {
    name: 'CSV Upload',
    fields: [],
  },
  'bigquery': {
    name: 'BigQuery',
    fields: [
      { key: 'projectId', label: 'Project ID', type: 'text' },
      { key: 'datasetId', label: 'Dataset ID', type: 'text' },
      { key: 'query', label: 'Query', type: 'text' },
    ],
  },
  'snowflake': {
    name: 'Snowflake',
    fields: [
      { key: 'account', label: 'Account URL', type: 'text' },
      { key: 'warehouse', label: 'Warehouse', type: 'text' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'schema', label: 'Schema', type: 'text' },
      { key: 'query', label: 'Query', type: 'text' },
    ],
  },
  'postgresql': {
    name: 'PostgreSQL',
    fields: [
      { key: 'host', label: 'Host', type: 'text' },
      { key: 'port', label: 'Port', type: 'text' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'schema', label: 'Schema (optional)', type: 'text' },
      { key: 'query', label: 'Query', type: 'text' },
    ],
  },
  'mysql': {
    name: 'MySQL',
    fields: [
      { key: 'host', label: 'Host', type: 'text' },
      { key: 'port', label: 'Port', type: 'text' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'query', label: 'Query', type: 'text' },
    ],
  },
  'redshift': {
    name: 'Redshift',
    fields: [
      { key: 'host', label: 'Cluster endpoint', type: 'text' },
      { key: 'port', label: 'Port', type: 'text' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'schema', label: 'Schema', type: 'text' },
      { key: 'query', label: 'Query', type: 'text' },
    ],
  },
};
