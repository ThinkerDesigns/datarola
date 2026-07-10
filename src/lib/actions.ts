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

  // Execute against synced rows (SQL interpreter with aggregations)
  try {
    return executeOnRows(allRows, maxCols, generatedSql);
  } catch {
    return { columns: [], values: [], rowCount: 0, sql: generatedSql, error: 'The generated query could not be parsed. Try rephrasing your question.' };
  }
}

// SQL interpreter supporting WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, and aggregates (COUNT/SUM/AVG/MIN/MAX).
function executeOnRows(rows: Array<{ columns: string[]; values: unknown[] }>, cols: string[], sql: string): Record<string, unknown> {
  if (rows.length === 0) return { columns: [], values: [], rowCount: 0, sql };

  // Parse clauses
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  const limitVal = limitMatch ? parseInt(limitMatch[1]) : Infinity;

  const groupByMatch = sql.match(/\bGROUP\s+BY\s+(.+)/i);
  const havingMatch = sql.match(/\bHAVING\s+(.+)/i);
  const orderByMatch = sql.match(/\bORDER\s+BY\s+(\w+)(\s+(ASC|DESC))?/i);
  const selectMatch = sql.match(/\bSELECT\s+(.+)/i);

  // Detect if this is an aggregate query
  const isAggregate = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(sql);

  // Parse WHERE conditions (everything before GROUP BY / HAVING / ORDER BY)
  let whereClause: string | null = null;
  const selectPos = selectMatch ? sql.indexOf('SELECT') + 6 : -1;
  const groupPos = groupByMatch ? sql.indexOf('GROUP', Math.max(selectPos >= 0 ? selectPos : 0)) : sql.length;
  const wherePart = sql.slice(Math.max(0, selectPos), groupPos);
  const wm = wherePart.match(/\bWHERE\s+(.+)/i);
  if (wm) whereClause = wm[1];

  let baseRows: unknown[][];
  if (whereClause) {
    const parts = splitWhereClause(whereClause);
    const conds = parts.map(parseCond).filter(Boolean) as Array<{ col: string; op: string; val: string | number }>;
    baseRows = rows.map((r) => r.values).filter((row) => conds.every((c) => {
      const idx = cols.indexOf(c.col); if (idx < 0) return true;
      const a = row[idx], v = c.val;
      switch (c.op) {
        case '=': return String(a) === String(v);
        case '!=': return String(a) !== String(v);
        case '>': return Number(a) > Number(v);
        case '>=': return Number(a) >= Number(v);
        case '<': return Number(a) < Number(v);
        case '<=': return Number(a) <= Number(v);
        case 'LIKE': {
          const likeVal = String(v).replace(/%/g, '').replace(/_/g, '');
          if (String(v).startsWith('%') && String(v).endsWith('%')) return String(a).includes(likeVal);
          if (String(v).startsWith('%')) return String(a).endsWith(likeVal);
          if (String(v).endsWith('%')) return String(a).startsWith(likeVal);
          return String(a) === likeVal;
        }
        default: return true;
      }
    }));
  } else {
    baseRows = rows.map((r) => r.values);
  }

  // If no aggregates, apply ORDER BY and LIMIT directly
  if (!isAggregate) {
    const result = [...baseRows];
    if (orderByMatch) {
      const ci = cols.indexOf(orderByMatch[1]);
      if (ci >= 0) result.sort((a: unknown[], b: unknown[]) => {
        const av = Number(a[ci]), bv = Number(b[ci]);
        return orderByMatch[3]?.toUpperCase() === 'DESC' ? bv - av : av - bv;
      });
    }
    return { columns: cols, values: result.slice(0, limitVal), rowCount: result.length, sql, error: null };
  }

  // Aggregate path: group rows by specified columns
  const groupCols = groupByMatch ? groupByMatch[1].split(/\s*,\s*/).map((c) => c.trim()) : null;

  // Parse aggregate expressions from SELECT: "COUNT(*), SUM(col), AVG(val)"
  const aggExprs: Array<{ func: 'count' | 'sum' | 'avg' | 'min' | 'max'; colIndex: number }> = [];
  if (selectMatch) {
    const selectBody = selectMatch[1];
    const aggRegex = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(\*|[a-zA-Z_]\w*)\s*\)/gi;
    let m: RegExpExecArray | null;
    while ((m = aggRegex.exec(selectBody)) !== null) {
      const func = m[1].toLowerCase() as 'count' | 'sum' | 'avg' | 'min' | 'max';
      if (m[2] === '*') {
        // COUNT(*) doesn't need column index — handled specially
      } else {
        const ci = cols.indexOf(m[2]);
        if (ci >= 0) aggExprs.push({ func, colIndex: ci });
      }
    }
  }

  if (!groupCols || groupCols.length === 0) {
    // No GROUP BY — aggregate over all rows as one group
    const aggRow = isCountOnly(sql) ? { count: baseRows.length } : computeAggregates(baseRows, cols, sql);
    let finalRow = Object.values(aggRow);

    // HAVING check on the aggregated row
    if (havingMatch) {
      const havingConds = parseHaving(havingMatch[1], cols);
      const pass = havingConds.every((c) => compareHaving(finalRow, c, cols));
      if (!pass) finalRow = [];
    }

    return { columns: Object.keys(aggRow), values: [finalRow], rowCount: finalRow.length ? 1 : 0, sql, error: null };
  }

  // Group by specified columns
  const groups = new Map<string, unknown[][]>();
  for (const row of baseRows) {
    const key = groupCols.map((gc, gi) => {
      const ci = cols.indexOf(gc);
      return ci >= 0 ? String(row[ci]) : '';
    }).join('\x00');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  // Parse HAVING conditions (reference aggregated columns)
  const havingConds = havingMatch ? parseHaving(havingMatch[1], cols) : [];

  const resultRows: unknown[][] = [];
  let totalRows = 0;

  for (const [key, groupRows] of groups) {
    const aggValues = computeAggregates(groupRows, cols, sql);

    // Check HAVING
    if (!havingConds.every((c) => compareHavingGroup(aggValues, c))) continue;

    // Build result row: GROUP BY columns + aggregate results
    const keyParts = key.split('\x00');
    const aggRow = [...keyParts, ...Object.values(aggValues)];
    resultRows.push(aggRow);
    totalRows++;
  }

  // Build result column names: GROUP BY columns + aggregate column names from SQL
  const aggColNames: string[] = [];
  if (selectMatch) {
    const aggRegex2 = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(\*|[a-zA-Z_]\w*)\s*\)/gi;
    let m2: RegExpExecArray | null;
    while ((m2 = aggRegex2.exec(selectMatch[1])) !== null) {
      if (m2[2] !== '*') aggColNames.push(m2[2]);
    }
  }
  const resultCols = [...groupCols, ...aggColNames];
  if (orderByMatch) {
    const orderByColName = orderByMatch[1];
    let ci = cols.indexOf(orderByColName);
    // If not found in source columns, try index into aggregated result
    if (ci < 0) {
      for (let i = 0; i < aggColNames.length; i++) {
        if (aggColNames[i].toLowerCase() === orderByColName.toLowerCase()) { ci = groupCols.length + i; break; }
      }
    }
    if (ci >= 0 && resultRows[0]) {
      const dir = orderByMatch[3]?.toUpperCase() === 'DESC' ? -1 : 1;
      resultRows.sort((a, b) => {
        const av = Number(a[ci]), bv = Number(b[ci]);
        return (bv - av) * dir;
      });
    }
  }

  return { columns: resultCols, values: resultRows.slice(0, limitVal), rowCount: totalRows, sql, error: null };
}

// ── SQL parsing helpers ────────────────────────────────────────

function splitWhereClause(clause: string): string[] {
  const parts: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < clause.length; i++) {
    if (clause[i] === '(') depth++;
    else if (clause[i] === ')') depth--;
    else if (depth === 0 && clause.substring(i, i + 3).toUpperCase() === 'AND' && i > 0 && clause[i - 1] !== '(') {
      parts.push(clause.slice(start, i).trim());
      start = i + 3;
    }
  }
  parts.push(clause.slice(start).trim());
  return parts.filter(Boolean);
}

function parseCond(part: string): { col: string; op: string; val: string | number } | null {
  // LIKE first (contains %)
  const likeMatch = part.match(/^(\w+)\s+LIKE\s+(.*)/i);
  if (likeMatch) return { col: likeMatch[1], op: 'LIKE', val: likeMatch[2] };

  // Standard operators
  const m = part.match(/^(\w+)\s*(>=?|<=?|=|!=)\s*(['"]?)(.+?)\3\s*$/);
  if (!m) return null;
  const rawVal = m[4];
  const numVal = Number(rawVal);
  return { col: m[1], op: m[2], val: !isNaN(numVal) && /^-?\d+(\.\d+)?$/.test(rawVal) ? numVal : rawVal };
}

function computeAggregates(rows: unknown[][], cols: string[], sql: string): Record<string, number> {
  const result: Record<string, number> = { count: rows.length };
  const funcs = ['SUM', 'AVG', 'MIN', 'MAX'];
  for (const fn of funcs) {
    const regex = new RegExp(`\\b${fn}\\s*\\(\\s*(\\w+)\\s*\\)`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = regex.exec(sql)) !== null) {
      const ci = cols.indexOf(m[1]);
      if (ci >= 0) {
        const vals = rows.map((r) => Number(r[ci])).filter((v) => !isNaN(v));
        switch (fn) {
          case 'SUM': result[m[1]] = vals.reduce((a, b) => a + b, 0); break;
          case 'AVG': result[m[1]] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; break;
          case 'MIN': result[m[1]] = Math.min(...vals); break;
          case 'MAX': result[m[1]] = Math.max(...vals); break;
        }
      }
    }
  }
  return result;
}

function isCountOnly(sql: string): boolean {
  return /^\s*SELECT\s+COUNT\s*\(\s*\*\s*\)\s*$/.test(sql.trim());
}

function parseHaving(having: string, cols: string[]): Array<{ name: string; op: string; val: number }> {
  const parts = splitWhereClause(having);
  return parts.map((p) => {
    const m = p.match(/^(\w+)\s*(>=?|<=?|=|!=)\s*([\d.]+)/);
    if (!m) return null;
    return { name: m[1], op: m[2], val: Number(m[3]) };
  }).filter(Boolean) as Array<{ name: string; op: string; val: number }>;
}

function compareHaving(values: unknown[], cond: { name: string; op: string; val: number }, cols: string[]): boolean {
  const idx = cols.indexOf(cond.name);
  if (idx >= 0 && values[idx] !== undefined) return compareVal(values[idx], cond.op, cond.val);
  // If column not found, try matching against aggregated alias names in the result row
  // For simple cases like "count" or "SUM(revenue)" this may be ambiguous — pass through
  return true;
}

function compareHavingGroup(aggValues: Record<string, number>, cond: { name: string; op: string; val: number }): boolean {
  const actual = aggValues[cond.name] ?? aggValues[cond.name.toLowerCase()] ?? 0;
  return compareVal(actual, cond.op, cond.val);
}

function compareVal(a: unknown, op: string, b: number): boolean {
  const n = Number(a);
  switch (op) {
    case '=': return n === b;
    case '!=': return n !== b;
    case '>': return n > b;
    case '>=': return n >= b;
    case '<': return n < b;
    case '<=': return n <= b;
    default: return true;
  }
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
