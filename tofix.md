# DataRola — Fixes Needed

## 1. ~~Model provider setting does not affect queries~~ ✅ FIXED
**Fix applied:** `runQuery` in `actions.ts` now reads the user's stored `modelProvider` from Firestore before making LLM calls. Honors the toggle choice from Settings.

## 2. ~~Settings API key has no validation~~ ✅ FIXED
**Fix applied:** Added "Test Key" button on the Anthropic API key input. Sends a minimal prompt to verify the key works and shows ✓ Valid / ✗ Invalid result.

## 3. PostgreSQL / MySQL / Redshift always fail (High)
**Status:** Error message improved from cryptic `"requires a Firebase Function"` to clear `"not yet implemented — use Google Sheets or CSV upload"`.  
**Remaining:** These connectors need real implementations (`node-postgres`, `mysql2`, `@aws-sdk/client-redshift-data`) when ready.

## 4. Schema introspection
**Fix applied:** Created `src/lib/connectors/introspect.ts` with `introspectGoogleSheet`, `introspectAirtable`, `introspectBigQuery`, `introspectSnowflake`. Added `INTROSPECTORS` registry to `index.ts`.  
**Remaining:** Needs wiring into the connections-view UI (a "View schema" button per source).

## 5. ~~No scheduled cron trigger for anomaly detection~~ ✅ FIXED
**Fix applied:** Created `vercel.json` with cron schedule `0 */6 * * *` (every 6 hours) pointing to `/api/cron/anomaly-detect`.

## 6. ~~Stripe usage metering is all stubs~~ partially fixed
**Fix applied:** Added `getCustomerPortalUrl()` server action and wired it into the billing page (replaced "#" with real portal button).  
**Remaining:** Actual query counting and source limit enforcement need to be added to `runQuery`/`connectDataSource`. The plan in Firestore (`users/{uid}` → `plan` field) is correctly updated by the webhook.

## 7. ~~Email alerts never sent~~
**Status:** Not yet implemented. Would require adding a resend/nodemailer dependency and calling it from the cron route when anomalies are detected. Deferred to P1.

## 8. ~~Dev mode silently hides missing Firebase config~~ ✅ FIXED
**Fix applied:** Settings page now shows a visible amber banner: `"⚠ Dev mode active — using local mock accounts (Firebase not configured)"` when `firebaseAuth` is unavailable.

## 9. ~~Token refresh for Airtable missing~~
**Status:** Not yet implemented. Would require storing `refreshToken` from the Airtable OAuth callback and implementing a token refresh flow. Deferred to P1.

---

# Remaining critical items

| Priority | Item | Effort | Notes |
|----------|------|--------|-------|
| High | Wire schema introspection into UI | Medium | Add "View schema" button in connections-view |
| High | Implement query counting + source limit enforcement | Medium | Check `plan` from Firestore, enforce limits in actions |
| Medium | Email alert dispatch via Resend/nodemailer | Medium | Add to cron route |
| Low | Airtable token refresh flow | Small | Store + use refresh token on expired access tokens |
