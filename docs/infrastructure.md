# Safety Intercept — Infrastructure Reference

## Cloudflare Workers

### Fraud Relay (shield-relay)
- **URL:** https://shield-relay.bleblanc.workers.dev/analyze
- **Method:** POST
- **Auth:** `auth_token` in request body
- **Purpose:** Calls Anthropic API to score payment memos for fraud

### Log Viewer (shield-logs-viewer)
- **URL:** https://shield-logs-viewer.bleblanc.workers.dev
- **Auth:** `?auth_token=` query param or header
- **Endpoints:**
  - `GET /logs?limit=50` — recent fraud log entries
  - `GET /stats` — aggregate fraud stats for YC pitch

## KV Namespace
- **Name:** shield-logs
- **ID:** c0532a48ef81423ba9d9fbaa40b55cde
- **Purpose:** Stores anonymized analysis logs (riskScore, flags, platform, timestamp)

## Auth Token
- Stored in `chrome.storage.local` as `relay_auth_token`
- Must match `RELAY_AUTH_TOKEN` secret in Cloudflare dashboard
- Current value: shieldrelay2026abc

## Deploy Commands
```bash
# Deploy fraud relay
cd cloudflare && npx wrangler deploy

# Deploy log viewer
cd cloudflare && npx wrangler deploy -c wrangler.logs.toml
```
