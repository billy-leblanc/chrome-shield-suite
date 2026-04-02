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
    if (!['/logs', '/stats'].includes(url.pathname) || request.method !== 'GET') {
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

    try {
      if (!env.SHIELD_LOGS) {
        throw new Error('KV namespace SHIELD_LOGS not bound');
      }

      if (url.pathname === '/logs') {
        // Limit check for logs list
        let limit = parseInt(url.searchParams.get('limit') || '50');
        if (isNaN(limit) || limit < 1) limit = 50;
        if (limit > 200) limit = 200;

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
      }

      if (url.pathname === '/stats') {
        // Collect all logs (paginated)
        let cursor = undefined;
        const stats = {
          total: 0,
          highRisk: 0,
          critical: 0,
          safe: 0,
          byPlatform: {},
          topFlags: {},
        };

        do {
          const list = await env.SHIELD_LOGS.list({ prefix: 'log:', cursor });
          for (const key of list.keys) {
            const val = await env.SHIELD_LOGS.get(key.name);
            if (!val) continue;

            try {
              const entry = JSON.parse(val);
              stats.total++;

              // Score categories
              if (entry.riskScore >= 80) stats.critical++;
              else if (entry.riskScore >= 50) stats.highRisk++;
              else if (entry.riskScore < 20) stats.safe++;

              // Platforms
              const platform = entry.platform || 'unknown';
              stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;

              // Flags
              (entry.flags || []).forEach((flag) => {
                stats.topFlags[flag] = (stats.topFlags[flag] || 0) + 1;
              });
            } catch {
              // Skip corrupted
            }
          }
          cursor = list.list_complete ? undefined : list.cursor;
        } while (cursor);

        return new Response(JSON.stringify(stats), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal error', details: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};
