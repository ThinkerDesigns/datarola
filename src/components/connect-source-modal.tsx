'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { CONNECTORS, type ConnectorDef } from '@/lib/connectors';
import { connectDataSource, uploadCSV, syncSource as doSyncSource } from '@/lib/connectors/server-actions';
import type { ConnectorType } from '@/lib/schema';

interface ConnectSourceModalProps {
  onClose: () => void;
  onConnected: (id: string) => void;
}

export function ConnectSourceModal({ onClose, onConnected }: ConnectSourceModalProps) {
  const [step, setStep] = useState<'picker' | 'config'>('picker');
  const [selectedType, setSelectedType] = useState<ConnectorType | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  if (!user) return null;

  const def = selectedType ? CONNECTORS[selectedType] : null;

  const handleSelect = (type: ConnectorType) => {
    setSelectedType(type);
    setStep('config');
  };

  const handleSubmit = async () => {
    if (!selectedType || !user) return;
    setError('');
    setLoading(true);

    try {
      const ds = await connectDataSource(user.uid, {
        name: def!.name,
        type: selectedType,
        status: 'connected',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: { ...fields },
      });

      // Auto-sync for CSV uploads
      if (selectedType === 'csv-upload' && fields.csvContent) {
        await uploadCSV(user.uid, `${ds.name}.csv`, fields.csvContent, ds.id);
      } else if (selectedType === 'google-sheets') {
        // Sync Google Sheet
        await doSyncSource(user.uid, ds.id, { ...fields, type: selectedType });
      }

      onConnected(ds.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
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

            {/* Special case: CSV upload */}
            {selectedType === 'csv-upload' && (
              <CSVUploadField fields={fields} setFields={setFields} />
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

            {/* Google Sheets range selector */}
            {selectedType === 'google-sheets' && (
              <input type="text" value={fields.range ?? ''}
                onChange={(e) => setFields({ ...fields, range: e.target.value })}
                placeholder={`Range (default: ${def.selector || 'A1:Z10000'})`}
                className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-slate-600" />
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

function CSVUploadField({ fields, setFields }: { fields: Record<string, string>; setFields: (f: Record<string, string>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-400">Upload a CSV file</label>
      <input ref={fileRef} type="file" accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            setFields({ ...fields, csvContent: ev.target?.result as string });
          };
          reader.readAsText(file);
        }}
        className="hidden" />
      <label onClick={() => fileRef.current?.click()}
        className="flex h-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-all">
        {fields.csvContent ? '✓ CSV uploaded — click to change' : '+ Click or drag a CSV file here'}
      </label>
    </div>
  );
}
