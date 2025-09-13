/**
 * Optional: use the OpenAI API to generate a concise, risk-aware rationale for each pick.
 * Falls back to a templated explanation if OPENAI_API_KEY is not set.
 */

type Result = {
  symbol: string;
  score: number;
  price: number;
  metrics: any;
  options?: any;
  rationale?: string;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function metricsHash(metrics: any): Promise<string> {
  const json = JSON.stringify(metrics);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function callGPTWithRetry(env: any, body: any, maxAttempts = 5) {
  let backoff = 1000;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      let wait = backoff;
      const retryAfter = res.headers.get('Retry-After');
      if (retryAfter) {
        const parsed = parseInt(retryAfter, 10);
        if (!isNaN(parsed)) wait = Math.max(wait, parsed * 1000);
      }
      const reset = res.headers.get('x-ratelimit-reset-requests');
      if (reset) {
        const resetMs = parseFloat(reset) * 1000 - Date.now();
        if (!isNaN(resetMs)) wait = Math.max(wait, resetMs);
      }
      await sleep(wait);
      backoff *= 2;
      continue;
    }
    if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
    return res.json();
  }
  throw new Error('OpenAI rate limit exceeded');
}

export async function explainWithGPT(env: any, results: Result[]): Promise<Result[]> {
  if (!env.OPENAI_API_KEY) {
    return results.map((r) => ({
      ...r,
      rationale:
        `Trend above long-term average with supportive momentum. ` +
        `Volatility and drawdown appear manageable. Options liquidity assumed OK (stub). ` +
        `Caution: verify IV rank and spreads before selecting LEAPS.`,
    }));
  }
  const limit = env.EXPLAIN_TOP_N ? Math.min(parseInt(env.EXPLAIN_TOP_N, 10), 5) : 5;
  const explained: Result[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (i >= limit) {
      explained.push(r);
      continue;
    }
    try {
      const hash = await metricsHash(r.metrics);
      const cacheKey = `rationale:${r.symbol}:${hash}`;
      const cached = await env.leapspicker.get(cacheKey);
      if (cached) {
        explained.push({ ...r, rationale: cached });
        continue;
      }
      const sys =
        'You are a buy-side analyst. Write a ~120-word, risk-aware rationale for a LEAPS entry. ' +
        'Emphasize trend durability, growth/quality if present, volatility context, and an options liquidity note. ' +
        'Include one caution. No hyperbole.';
      const user = JSON.stringify({
        symbol: r.symbol,
        score: r.score,
        metrics: r.metrics,
        options: r.options,
      });
      const body = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `Explain this candidate: ${user}` },
        ],
        temperature: 0.3,
        max_tokens: 150,
      };
      const json: any = await callGPTWithRetry(env, body);
      const text = json.choices?.[0]?.message?.content ?? '';
      explained.push({ ...r, rationale: text });
      await env.leapspicker.put(cacheKey, text, {
        expirationTtl: 30 * 24 * 60 * 60,
      });
    } catch {
      explained.push({
        ...r,
        rationale:
          'Good long-term trend and momentum with reasonable recent volatility. Verify IV rank and option liquidity before entry. Caution: avoid pre-earnings IV spikes.',
      });
    }
  }
  return explained;
}
