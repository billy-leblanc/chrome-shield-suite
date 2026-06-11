#!/usr/bin/env zsh
# Finish Phase 0.1: set new RELAY_AUTH_TOKEN secret + deploy shield-relay.
# PREREQ: `wrangler login` completed (read-only token now disabled in ../.env).
set -e
cd "$(dirname "$0")"
echo "→ Verifying write-capable auth…"
if ! npx wrangler whoami 2>&1 | grep -qi "logged in"; then
  echo "✘ Not authenticated. Run:  wrangler login   then re-run this script."; exit 1
fi
TOK=$(grep '^VITE_RELAY_AUTH_TOKEN=' ../.env | cut -d= -f2)
echo "→ Setting RELAY_AUTH_TOKEN secret (preview ${TOK:0:6}…${TOK: -4})…"
printf '%s' "$TOK" | npx wrangler secret put RELAY_AUTH_TOKEN
echo "→ Deploying shield-relay (header auth + locked CORS + IP/geo logging)…"
npx wrangler deploy
echo "✓ Phase 0 deployed. Next: re-enter the new token in the extension popup + dashboard prompt."
