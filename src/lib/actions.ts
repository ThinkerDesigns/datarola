'use server';

// Main server actions for the app

import { db } from '@/lib/firebase';
import { collection, doc, query, orderBy, limit as firestoreLimit, getDocs, getDoc } from 'firebase/firestore';
import type { DataSource } from '@/lib/schema';
import { detectAnomalies } from './anomaly-detection';

// ── Data sources ──────────────────────────────────────────────

export async function getMyDataSources(uid: string): Promise<{ sources: DataSource[]; plan: PlanInfo }> {
  if (!db) return { sources: [], plan: { plan: 'free' as const, queriesPerMonth: 20, sourcesAllowed: 1 } };

  const snap = await getDocs(collection(db, 'users', uid, 'dataSources'));
  const sources = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DataSource));

  return { sources, plan: await getUserPlan(uid) };
}

// ── Queries (text-to-SQL) ────────────────────────────────────

/** Call Ollama's /api/generate endpoint. Returns raw response text or null on failure. */
async function queryOllama(prompt: string): Promise<string | null> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: (process.env.OLLAMA_MODEL || 'phi3:mini') as string,
        prompt,
        stream: false,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json() as { response?: string };
    return json.response?.trim() ?? null;
  } catch {
    return null;
  }
}

/** Call Anthropic API. Returns raw text or null on failure. */
async function queryAnthropic(prompt: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 1024, system: `You are a SQL expert. Return ONLY the SQL query, no explanation, no markdown.`, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) return null;
    const json = await res.json() as { content?: Array<{ text?: string }> };
    return (json.content?.[0]?.text ?? '').replace(/```sql?\n?/gi, '').replace(/```\n?/g, '').trim();
  } catch {
    return null;
  }
}

/** Clean a raw LLM response into a pure SQL string. */
function cleanSql(text: string): string {
  return text.replace(/```sql?\n?/gi, '').replace(/```\n?/g, '').trim();
}

export async function runQuery(uid: string, queryText: string): Promise<Record<string, unknown>> {
  if (!db) throw new Error('Firebase not configured');

  // Fetch user's connected sources and their synced rows
  const dsSnap = await getDocs(collection(db, 'users', uid, 'dataSources'));
  const dsIds: string[] = [];
  for (const docSnap of dsSnap.docs) {
    if ((docSnap.data() as any).status !== 'connected') continue;
    dsIds.push(docSnap.id);
  }

  // Fetch synced rows (up to 500 per source)
  const allRows: Array<{ columns: string[]; values: unknown[] }> = [];
  for (const dsId of dsIds.slice(0, 3)) { // Limit to 3 sources for P0 performance
    const rowSnap = await getDocs(query(collection(db, 'users', uid, 'dataSources', dsId, 'rows'), orderBy('syncedAt', 'desc'), firestoreLimit(500)));
    for (const d of rowSnap.docs) {
      const data = d.data();
      if (data.columns && data.values) {
        allRows.push({ columns: data.columns as string[], values: data.values as unknown[] });
      }
    }
  }

  if (allRows.length === 0) return { columns: [], values: [], sql: '', rowCount: 0, error: 'No connected data sources. Add one in Connections.' };

  // Combine columns from largest row set
  let maxCols: string[] = [];
  for (const r of allRows) { if (r.columns.length > maxCols.length) maxCols = r.columns; }
  const schema = `Columns: ${maxCols.join(', ')}`;
  const sqlPrompt = `Question: "${queryText}"\n${schema}\nGenerate ONLY a valid ANSI SQL query on a table called "data". No explanation, no markdown.`;

  // Try Ollama first (local, free), fall back to Anthropic if configured
  let generatedSql = await queryOllama(sqlPrompt);
  if (!generatedSql) generatedSql = (await queryAnthropic(sqlPrompt)) ?? '';

  if (!generatedSql) return { columns: [], values: [], sql: '', rowCount: 0, error: 'No LLM available. Run Ollama locally (`ollama run phi3:mini`) or set ANTHROPIC_API_KEY.' };

  generatedSql = cleanSql(generatedSql);

  // Execute against synced rows (simple WHERE / ORDER BY / LIMIT interpreter)
  return executeOnRows(allRows, maxCols, generatedSql);
}

// Simple SQL interpreter for P0
function executeOnRows(rows: Array<{ columns: string[]; values: unknown[] }>, cols: string[], sql: string): Record<string, unknown> {
  if (rows.length === 0) return { columns: [], values: [], rowCount: 0, sql };

  let limit = Infinity;
  const lm = sql.match(/LIMIT\s+(\d+)/i); if (lm) limit = parseInt(lm[1]);

  let orderByCol: string | null = null;
  const od = sql.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i);
  if (od) { orderByCol = od[1]; }

  const wm = sql.match(/WHERE\s+(.+)/i);
  let filtered: unknown[][];
  if (wm) {
    // Simple: split on AND, parse "col OP val" conditions
    const parts = wm[1].split(/\s+AND\s+/i);
    const conds = parts.map((p) => { const m = p.match(/^(\w+)\s*(>=?|<=?|=|!=)\s*['"]?(.*?)['"]?\s*$/); return m ? { col: m[1], op: m[2], val: m[3] } : null; }).filter(Boolean) as Array<{ col: string; op: string; val: string }>;
    filtered = rows.map((r) => r.values).filter((row) => conds.every((c) => {
      const idx = cols.indexOf(c.col); if (idx < 0) return true;
      const a = row[idx], v = c.val;
      switch (c.op) {
        case '=': return String(a) === v; case '!=': return String(a) !== v;
        case '>': return Number(a) > Number(v); case '>=': return Number(a) >= Number(v);
        case '<': return Number(a) < Number(v); case '<=': return Number(a) <= Number(v);
        default: return true;
      }
    }));
  } else { filtered = rows.map((r) => r.values); }

  if (orderByCol) {
    const ci = cols.indexOf(orderByCol);
    if (ci >= 0) filtered.sort((a: unknown[], b: unknown[]) => Number(a[ci]) > Number(b[ci]) ? 1 : -1);
  }

  return { columns: cols, values: filtered.slice(0, limit), rowCount: filtered.length, sql, error: null };
}

// ── Anomaly detection ────────────────────────────────────────

export async function checkAnomalies(uid: string): Promise<Array<{ metric: string; severity: string; message: string }>> {
  if (!db) return [];
  const alerts = await detectAnomalies(uid);
  return alerts.map((a) => ({ metric: a.metric, severity: a.severity, message: a.message }));
}

// ── Plan info (Stripe / quota) ──────────────────────────────

interface PlanInfo { plan: 'free' | 'pro'; queriesPerMonth: number; sourcesAllowed: number; }

async function getUserPlan(uid: string): Promise<PlanInfo> {
  if (!db) return { plan: 'free', queriesPerMonth: 20, sourcesAllowed: 1 };
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return { plan: 'free', queriesPerMonth: 20, sourcesAllowed: 1 };
  const d = snap.data() as Record<string, unknown>;
  return { plan: (d.plan === 'pro' ? 'pro' : 'free') as 'free' | 'pro', queriesPerMonth: Number(d.queriesPerMonth) || 20, sourcesAllowed: Number(d.sourcesAllowed) || 1 };
}
