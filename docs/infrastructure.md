# Safety Intercept — Infrastructure Reference
# Keep this file updated. This is the single source of truth for all tokens, URLs, and IDs.

## Tokens & Secrets
- **Relay auth token:** `shieldrelay2026abc`
  - Stored in Chrome extension: `chrome.storage.local` → `relay_auth_token`
  - Must match Cloudflare secret: `RELAY_AUTH_TOKEN` on both workers

## Cloudflare Workers

### Fraud Relay (shield-relay)
- **URL:** https://shield-relay.bleblanc.workers.dev/analyze
- **Method:** POST
- **Deploy:** `cd cloudflare && npx wrangler deploy`

### Log Viewer (shield-logs-viewer)
- **Stats URL:** https://shield-logs-viewer.bleblanc.workers.dev/stats?auth_token=shieldrelay2026abc
- **Logs URL:** https://shield-logs-viewer.bleblanc.workers.dev/logs?auth_token=shieldrelay2026abc
- **Deploy:** `cd cloudflare && npx wrangler deploy -c wrangler.logs.toml`
- **Set secret:** `npx wrangler secret put RELAY_AUTH_TOKEN -c wrangler.logs.toml`

## KV Namespace
- **Name:** shield-logs
- **ID:** `c0532a48ef81423ba9d9fbaa40b55cde`

## GitHub
- **Repo:** https://github.com/billy-leblanc/chrome-shield-suite
- **Main branch:** main

## Anthropic
- **Model used:** claude-haiku-4-5-20251001
- **API key:** stored as Cloudflare secret `ANTHROPIC_API_KEY` (never paste here)
- **Credits:** $10 loaded

## Chrome Extension
- **Load from:** `/Users/billyleblanc/chrome-shield-suite/extension`
- **Rebuild:** `cd /Users/billyleblanc/chrome-shield-suite && npm run build`
- **Reload:** chrome://extensions → refresh Safety Intercept

## Useful Commands
```bash
# Rebuild extension
cd /Users/billyleblanc/chrome-shield-suite && npm run build

# Deploy fraud relay
cd /Users/billyleblanc/chrome-shield-suite/cloudflare && npx wrangler deploy

# Deploy log viewer
cd /Users/billyleblanc/chrome-shield-suite/cloudflare && npx wrangler deploy -c wrangler.logs.toml

# Set secret on log viewer
cd /Users/billyleblanc/chrome-shield-suite/cloudflare && npx wrangler secret put RELAY_AUTH_TOKEN -c wrangler.logs.toml

# Watch relay logs live
cd /Users/billyleblanc/chrome-shield-suite/cloudflare && npx wrangler tail --format pretty

# Check fraud stats
curl "https://shield-logs-viewer.bleblanc.workers.dev/stats?auth_token=shieldrelay2026abc"

# Push to GitHub
cd /Users/billyleblanc/chrome-shield-suite && git add -A && git commit -m "your message" && git push origin main
```
