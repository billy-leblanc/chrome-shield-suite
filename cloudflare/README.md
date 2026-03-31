# Chrome Shield Suite — API Relay Enclave

A Cloudflare Worker that acts as a secure relay between the Chrome extension and the Anthropic API. The worker holds the Anthropic API key server-side so it never touches the user's browser.

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)
- Node.js 18+

## Deployment Steps

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser window. Approve the authorization request.

### 3. Deploy the Worker

From the `cloudflare/` directory:

```bash
wrangler deploy relay-worker.js --name chrome-shield-relay --compatibility-date 2024-01-01
```

Wrangler will output a URL like:
```
https://chrome-shield-relay.<your-subdomain>.workers.dev
```

Copy this URL — you will need it in step 5.

### 4. Set environment secrets

Set your Anthropic API key (never committed to source control):

```bash
wrangler secret put ANTHROPIC_API_KEY
```

Paste your `sk-ant-...` key when prompted.

Set a relay auth token (a random string at least 16 characters long — generate one with `openssl rand -hex 24`):

```bash
wrangler secret put RELAY_AUTH_TOKEN
```

Paste the token when prompted. Keep a copy — you will enter the same token in the extension popup.

### 5. Update `risk_engine.ts`

Open `src/background/risk_engine.ts` and replace the placeholder:

```ts
// TODO: replace with your deployed Worker URL
const RELAY_URL = 'https://your-relay.workers.dev/analyze';
```

with your actual Worker URL, e.g.:

```ts
const RELAY_URL = 'https://chrome-shield-relay.your-subdomain.workers.dev/analyze';
```

Rebuild the extension: `npm run build`

### 6. Configure the extension

Open the Chrome Shield Suite popup, paste your `RELAY_AUTH_TOKEN` into the "Shield Relay token" field, and click **Save**.

## Re-deploying after changes

```bash
wrangler deploy relay-worker.js --name chrome-shield-relay --compatibility-date 2024-01-01
```

Secrets persist across re-deploys and do not need to be reset unless you want to rotate them.
