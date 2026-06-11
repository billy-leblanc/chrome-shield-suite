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

    // Header-only auth. Query-param tokens leak into request logs / browser
    // history, so a token in the URL is rejected outright (not silently accepted).
    if (url.searchParams.has('auth_token')) {
      return new Response(JSON.stringify({ error: 'Token must be sent in the Authorization header, not the URL' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    const auth_token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!auth_token || auth_token !== env.RELAY_AUTH_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    try {
      if (!env.SHIELD_LOGS) throw new Error('KV namespace SHIELD_LOGS not bound');

      if (url.pathname === '/logs') {
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
              // ignore
            }
          }
        }
        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return new Response(JSON.stringify({ logs: entries, count: entries.length }), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      if (url.pathname === '/stats') {
        let cursor = undefined;
        const stats = {
          total: 0,
          highRisk: 0,
          critical: 0,
          safe: 0,
          intercepted: 0,
          proceeded: 0,
          byPlatform: {},
          topFlags: {},
          byAmountRange: { low: 0, medium: 0, high: 0, unknown: 0 },
        };

        // Scan ALL keys (logs and events)
        do {
          const list = await env.SHIELD_LOGS.list({ cursor });
          for (const key of list.keys) {
            const val = await env.SHIELD_LOGS.get(key.name);
            if (!val) continue;

            try {
              const data = JSON.parse(val);
              
              if (key.name.startsWith('log:')) {
                stats.total++;
                if (data.riskScore >= 80) stats.critical++;
                else if (data.riskScore >= 50) stats.highRisk++;
                else if (data.riskScore < 20) stats.safe++;

                const platform = data.platform || 'unknown';
                stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;

                (data.flags || []).forEach((flag) => {
                  stats.topFlags[flag] = (stats.topFlags[flag] || 0) + 1;
                });

                const range = data.amountRange || 'unknown';
                if (range in stats.byAmountRange) stats.byAmountRange[range]++;
              } else if (key.name.startsWith('event:')) {
                if (data.event === 'intercepted') stats.intercepted++;
                else if (data.event === 'proceeded') stats.proceeded++;
              }
            } catch {
              // ignore
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
