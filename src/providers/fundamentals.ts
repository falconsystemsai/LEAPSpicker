
/**
 * Optional fundamentals via Financial Modeling Prep (FMP) or similar.
 * These functions return undefined gracefully if no FMP_KEY is set.
 */

export async function getFundamentals(env: any, symbol: string) {
  if (!env.FMP_KEY) return undefined;
  try {
    const key = env.FMP_KEY;
    const profileUrl = `https://site.financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${key}`;
    const metricsUrl = `https://site.financialmodelingprep.com/api/v3/key-metrics-ttm/${symbol}?apikey=${key}`;
    const [pRes, mRes] = await Promise.all([fetch(profileUrl), fetch(metricsUrl)]);
    const profile = await pRes.json();
    const metrics = await mRes.json();
    return { profile, metrics };
  } catch {
    return undefined;
  }
}

export function deriveQualityMetrics(_data: any) {
  // Placeholder derivations. Replace with real fields if you enable fundamentals.
  const revCagr3y = undefined as number | undefined;
  const fcfPositive = true;
  const netDebtToEbitda = undefined as number | undefined;
  const marginTrendOk = true;
  return { revCagr3y, fcfPositive, netDebtToEbitda, marginTrendOk };
}
