// Shared types for data sources, synced rows, and queries.

export interface DataSource {
  id: string;       // doc ID in Firestore (equals provider connection id)
  name: string;
  type: ConnectorType;
  status: 'connected' | 'error' | 'syncing';
  createdAt: number;
  updatedAt: number;
  // Provider-specific config (never store secrets here — use Firebase Functions)
  config?: Record<string, string>;
}

export type ConnectorType =
  | 'google-sheets'
  | 'csv-upload'
  | 'bigquery'
  | 'snowflake'
  | 'postgresql'
  | 'mysql'
  | 'redshift';

// Synced rows are stored as one Firestore doc per row, under /users/{uid}/dataSources/{dsId}/rows/{rowId}
export interface DataRow {
  columns: string[];   // header names
  values: (string | number | boolean | null)[];
}

// Query result cache — text-to-SQL answers go here
export interface QueryResult {
  id: string;
  uid: string;
  dsIds: string[];
  query: string;         // the natural-language query
  sql?: string;          // generated SQL (for audit)
  columns: string[];
  values: (string | number | boolean | null)[][];
  createdAt: number;
}
