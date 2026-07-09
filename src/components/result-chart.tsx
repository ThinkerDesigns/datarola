'use client';

// Render query results as charts — bar, line, or pie.
import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export interface ChartDataPoint { label: string; value: number; color?: string; }

interface ResultChartProps {
  columns: string[];
  values: unknown[][];
  numericColumnIndex: number; // which column is the chart's Y axis
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export function ResultChart({ columns, values, numericColumnIndex }: ResultChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  if (values.length === 0 || !columns[numericColumnIndex]) return null;

  // Build chart data: first column as label, numeric column as value
  const data: ChartDataPoint[] = values.slice(0, 50).map((row) => ({
    label: String(row[0] ?? ''),
    value: Number(row[numericColumnIndex]) || 0,
  }));

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
      {/* Chart type selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Type:</span>
        {(['bar', 'line', 'pie'] as const).map((t) => (
          <button key={t} onClick={() => setChartType(t)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${chartType === t ? 'bg-brand-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            {t === 'bar' ? 'Bar' : t === 'line' ? 'Line' : 'Pie'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" minTickGap={20} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => formatValue(v)} />
              <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #ffffff10', borderRadius: '8px', color: '#e2e8f0' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name={columns[numericColumnIndex]} />
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" minTickGap={20} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => formatValue(v)} />
              <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #ffffff10', borderRadius: '8px', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} name={columns[numericColumnIndex]} />
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100} label={false}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #ffffff10', borderRadius: '8px', color: '#e2e8f0' }} />
              <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{String(value)}</span>} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(v >= 100 ? 0 : 1)}k`;
  return v.toFixed(1);
}
