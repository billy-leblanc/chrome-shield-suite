// Cloudflare Logs Viewer — Safety Intercept
// Deploy to Cloudflare Workers. Set RELAY_AUTH_TOKEN as an environment secret.
// Bind SHIELD_LOGS KV namespace to this worker.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/logs' || request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Auth check
    const auth_token = url.searchParams.get('auth_token') || request.headers.get('Authorization');
    if (!auth_token || auth_token !== env.RELAY_AUTH_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Limit check
    let limit = parseInt(url.searchParams.get('limit') || '50');
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 200) limit = 200;

    try {
      if (!env.SHIELD_LOGS) {
        throw new Error('KV namespace SHIELD_LOGS not bound');
      }

      // List keys with prefix 'log:'
      const list = await env.SHIELD_LOGS.list({ prefix: 'log:', limit });
      const entries = [];

      for (const key of list.keys) {
        const val = await env.SHIELD_LOGS.get(key.name);
        if (val) {
          try {
            entries.push(JSON.parse(val));
          } catch {
            // Ignore corrupted entries
          }
        }
      }

      // Sort by timestamp descending
      entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return new Response(JSON.stringify({ logs: entries, count: entries.length }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal error', details: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};
