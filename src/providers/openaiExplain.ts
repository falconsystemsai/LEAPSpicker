/**
 * Optional: use the OpenAI API to generate a concise, risk-aware rationale for each pick.
 * Falls back to a templated explanation if OPENAI_API_KEY is not set.
 */
import OpenAI from 'openai';

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

async function callGPTWithRetry(client: OpenAI, body: any, maxAttempts = 5) {
  let backoff = 1000;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await client.responses.create(body);
    } catch (err: any) {
      if (err.status === 429) {
        await sleep(backoff);
        backoff *= 2;
        continue;
      }
      throw err;
    }
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
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
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
        model: 'gpt-5-mini',
        input: [
          { role: 'system', content: sys },
          { role: 'user', content: `Explain this candidate: ${user}` },
        ],
        temperature: 0.3,
        max_output_tokens: 150,
      };
      const json: any = await callGPTWithRetry(client, body);
      const text = json.output_text ?? '';
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
