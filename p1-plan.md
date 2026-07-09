# P1 — "Actually useful"

## 1. Post-signup onboarding
- New signup redirects to `/onboarding` instead of `/app`
- Two-step flow: Welcome → Connector picker → ConnectSourceModal → Dashboard
- Existing users can still go directly to /app

## 2. Recharts charting
- Install `recharts`
- Dashboard revenue chart: replace fake gradient bars with `<AreaChart>` from synced data
- Chat results: show chart alongside result table when query has numeric columns
- Simple auto-chart detection: if 2+ columns and at least 1 numeric → bar chart

## 3. Real dashboard stats
- KPIs calculated from connected source rows (not hardcoded)
- Row counts, column names from useDataSources()
- "No data yet" empty state when sources exist but no rows synced
