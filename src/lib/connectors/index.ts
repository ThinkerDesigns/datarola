// ponytail: connector registry — each type exports a sync function and config schema.
import type { ConnectorType, DataRow } from '@/lib/schema';

export interface ConnectorDef {
  name: string;
  fields: Array<{ key: string; label: string; type: 'text' | 'password' | 'select' }>;
  selector?: string;
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
      { key: 'accessToken', label: 'OAuth Access Token', type: 'password' },
      { key: 'datasetId', label: 'Dataset ID', type: 'text' },
      { key: 'query', label: 'SQL Query', type: 'text' },
    ],
  },
  'snowflake': {
    name: 'Snowflake',
    fields: [
      { key: 'account', label: 'Account URL (e.g. abc12345.snowflakecomputing.com)', type: 'text' },
      { key: 'user', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'schema', label: 'Schema', type: 'text' },
      { key: 'warehouse', label: 'Warehouse', type: 'text' },
      { key: 'query', label: 'SQL Query', type: 'text' },
    ],
  },
  'postgresql': {
    name: 'PostgreSQL',
    fields: [
      { key: 'host', label: 'Host', type: 'text' },
      { key: 'port', label: 'Port', type: 'text' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'user', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'query', label: 'SQL Query', type: 'text' },
    ],
  },
  'mysql': {
    name: 'MySQL',
    fields: [
      { key: 'host', label: 'Host', type: 'text' },
      { key: 'port', label: 'Port', type: 'text' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'user', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'query', label: 'SQL Query', type: 'text' },
    ],
  },
  'redshift': {
    name: 'Redshift',
    fields: [
      { key: 'host', label: 'Cluster endpoint', type: 'text' },
      { key: 'port', label: 'Port', type: 'text' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'schema', label: 'Schema', type: 'text' },
      { key: 'user', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'query', label: 'SQL Query', type: 'text' },
    ],
  },
  'airtable': {
    name: 'Airtable',
    fields: [
      { key: 'accessToken', label: 'Personal Access Token', type: 'password' },
      { key: 'baseId', label: 'Base ID', type: 'text' },
      { key: 'tableName', label: 'Table Name', type: 'text' },
    ],
  },
};
