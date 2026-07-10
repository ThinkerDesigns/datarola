'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { CONNECTORS, type ConnectorDef } from '@/lib/connectors';
import { connectDataSource, syncSource as doSyncSource } from '@/lib/connectors/server-actions';
import { parseCSVRaw, parseXLSX } from '@/lib/connectors/csv';
import { generateAuthUrl } from '@/lib/google-oauth';
import type { ConnectorType } from '@/lib/schema';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db as firebaseDb } from '@/lib/firebase';

// ponytail: client-side db reference for direct Firestore writes — avoids server SDK edge runtime issue.
const clientDb = firebaseDb;

interface ConnectSourceModalProps {
  onClose: () => void;
  onConnected: (id: string) => void;
  initialType?: ConnectorType;
}

export function ConnectSourceModal({ onClose, onConnected, initialType }: ConnectSourceModalProps) {
  const [step, setStep] = useState<'picker' | 'config'>(initialType ? 'config' : 'picker');
  const [selectedType, setSelectedType] = useState<ConnectorType | null>(initialType ?? null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFile, setHasFile] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  const def = selectedType ? CONNECTORS[selectedType] : null;

  // Parsed columns/values from CSV/XLSX upload
  const [parsedColumns, setParsedColumns] = useState<string[]>([]);
  const [parsedValues, setParsedValues] = useState<(string | number | boolean | null)[][]>([]);

  const handleSelect = (type: ConnectorType) => {
    setSelectedType(type);
    setStep('config');
    setHasFile(false);
  };

  /** Write CSV/XLSX data directly to Firestore from the client side. */
  const writeCSVData = async (uid: string, fileName: string): Promise<string> => {
    if (!clientDb) throw new Error(
      'Firebase is not configured. In dev mode, sign in with Google first to enable real Firebase Auth, then CSV uploads will work.'
    );
    const id = `csv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await setDoc(doc(clientDb, 'users', uid, 'dataSources', id), {
      name: fileName, type: 'csv-upload' as const, status: 'connected' as const,
      createdAt: Date.now(), updatedAt: Date.now(), rowCount: parsedValues.length,
    });

    for (const row of parsedValues) {
      await addDoc(collection(clientDb, 'users', uid, 'dataSources', id, 'rows'), {
        columns: parsedColumns, values: row, syncedAt: Date.now(),
      });
    }

    return id;
  };

  const handleSubmit = async () => {
    if (!selectedType || !user) return;
    setError('');
    setLoading(true);

    try {
      // For CSV/XLSX, we write directly from client (data already parsed), so skip server-side row upload
      let dsId: string;
      if (selectedType === 'csv-upload' && parsedColumns.length > 0) {
        dsId = await writeCSVData(user.uid, def!.name);
        onConnected(dsId);
      } else {
        const ds = await connectDataSource(user.uid, {
          name: def!.name,
          type: selectedType,
          status: 'connected',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config: { ...fields },
        });

        if (selectedType === 'google-sheets') {
          await doSyncSource(user.uid, ds.id, { ...fields, type: selectedType });
        }

        dsId = ds.id;
        onConnected(dsId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { authUrl } = await generateAuthUrl(user.uid);
      window.sessionStorage.setItem('oauth-connect', user.uid);
      window.location.href = authUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OAuth failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const info = window.sessionStorage.getItem('oauth-connect-info');
    if (info) {
      try {
        const parsed = JSON.parse(info) as { spreadsheetId: string; name: string };
        setFields((prev) => ({ ...prev, spreadsheetId: parsed.spreadsheetId }));
        if (parsed.name) setSelectedType('google-sheets');
        window.sessionStorage.removeItem('oauth-connect-info');
      } catch { /* ignore */ }
    }
  }, []);

  const handleParsed = (cols: string[], vals: (string | number | boolean | null)[][]) => {
    setParsedColumns(cols);
    setParsedValues(vals);
    setHasFile(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#161b22] p-6 space-y-4 mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {step === 'picker' ? 'Connect a Data Source' : def?.name ?? ''}
          </h2>
          <button onClick={step === 'config' ? () => setStep('picker') : onClose}
            className="text-slate-500 hover:text-white transition-colors text-lg">
            {step === 'config' ? '← Back' : '✕'}
          </button>
        </div>

        {/* Step 1: Connector picker */}
        {step === 'picker' && (
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {(Object.entries(CONNECTORS) as [ConnectorType, ConnectorDef][]).map(([type, def]) => (
              <button key={type} onClick={() => handleSelect(type)}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-4 text-sm font-medium text-slate-300 hover:border-brand-500/40 hover:text-brand-400 transition-all">
                <div className="h-10 w-10 rounded-lg bg-brand-600/20 flex items-center justify-center text-sm font-bold text-brand-400">
                  {def.name[0]}
                </div>
                {def.name}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Config form */}
        {step === 'config' && def && (
          <>
            <p className="text-xs text-slate-500">Fill in the credentials for {def.name}.</p>

            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
            )}

            {/* File upload for CSV/XLSX */}
            {selectedType === 'csv-upload' && (
              <FileUploadField hasFile={hasFile} onParsed={handleParsed} />
            )}

            {/* Standard config fields */}
            {def.fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-medium text-slate-400">{field.label}</label>
                {field.type === 'text' && (
                  <input type="text" value={fields[field.key] ?? ''}
                    onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-slate-600" />
                )}
              </div>
            ))}

            {/* Google Sheets range selector (only set after OAuth) */}
            {selectedType === 'google-sheets' && fields.spreadsheetId ? (
              <input type="text" value={fields.range ?? ''}
                onChange={(e) => setFields({ ...fields, range: e.target.value })}
                placeholder={`Range (default: ${def.selector || 'A1:Z10000'})`}
                className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-slate-600" />
            ) : null}

            {/* Google Sheets OAuth button */}
            {selectedType === 'google-sheets' && !fields.accessToken && (
              <div className="rounded-lg border border-dashed border-slate-700 bg-white/[0.02] px-4 py-6 text-center">
                <button onClick={handleGoogleOAuth}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-white transition-colors disabled:opacity-50">
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                  Connect with Google
                </button>
              </div>
            )}

            {/* Airtable OAuth button */}
            {selectedType === 'airtable' && (
              <div className="rounded-lg border border-dashed border-slate-700 bg-white/[0.02] px-4 py-6 text-center">
                <a href={`/api/auth/airtable/start?uid=${user.uid}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
                  Connect with Airtable
                </a>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={onClose} disabled={loading}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
                {loading ? 'Connecting…' : `Connect ${def.name}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FileUploadField({ hasFile, onParsed }: { hasFile: boolean; onParsed: (cols: string[], vals: (string | number | boolean | null)[][]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-400">Upload a CSV or XLSX file</label>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (ev) => {
            const buffer = ev.target?.result as ArrayBuffer;
            const isXlsx = file.name.toLowerCase().endsWith('.xlsx');

            let cols: string[];
            let vals: (string | number | boolean | null)[][];

            if (isXlsx) {
              ({ columns: cols, values: vals } = parseXLSX(buffer));
            } else {
              const text = new TextDecoder().decode(buffer);
              ({ columns: cols, values: vals } = parseCSVRaw(text));
            }

            onParsed(cols, vals);
          };
          reader.readAsArrayBuffer(file);
        }}
        className="hidden" />
      <label onClick={() => fileRef.current?.click()}
        className="flex h-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-all">
        {hasFile ? '✓ File uploaded — click to change' : '+ Click or drag a CSV / XLSX file here'}
      </label>
    </div>
  );
}
