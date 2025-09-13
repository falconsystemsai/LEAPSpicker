
import { getDailyAdjusted, extractCloses } from '../providers/alphaVantage';
import { annualizedHV, maxDrawdown, momentum, rsi, sma } from '../metrics/indicators';
import { getFundamentals, deriveQualityMetrics } from '../providers/fundamentals';
import { scoreCandidate, EquityMetrics } from '../metrics/scoring';
import { config } from '../config';

export async function runEquityScreen(env: any, symbols: string[]) {
  const out: any[] = [];
  for (const symbol of symbols) {
    try {
      const json = await getDailyAdjusted(env, symbol);
      const closes = extractCloses(json);
      if (closes.length < 220) continue;
      const price = closes[closes.length - 1];
      const sma50 = sma(closes, 50)[closes.length - 1];
      const sma200Arr = sma(closes, 200);
      const sma200 = sma200Arr[closes.length - 1];
      const sma200Prev = sma200Arr[closes.length - 6]; // ~1 week slope approximation
      const sma200Slope = sma200 - sma200Prev;
      const rsi14 = rsi(closes, 14)[closes.length - 1];
      const hv = annualizedHV(closes, 60)[closes.length - 1];
      const mdd1y = maxDrawdown(closes, 252);
      const mom12m2m = momentum(closes);

      // Evaluate every symbol; technical thresholds are reflected in the score
      // rather than acting as hard filters so all data reaches the UI.
      // Fundamentals (optional)
      const funda = await getFundamentals(env, symbol);
      const q = deriveQualityMetrics(funda);

      const eq: EquityMetrics = {
        symbol, price, sma50, sma200, sma200Slope, rsi14,
        hv60: hv ?? 0.4,
        mdd1y, mom12m2m,
        revCagr3y: q.revCagr3y,
        fcfPositive: q.fcfPositive,
        netDebtToEbitda: q.netDebtToEbitda,
        marginTrendOk: q.marginTrendOk,
      };
      const score = scoreCandidate(eq);
      const pass = score >= config.thresholds.passScore;
      out.push({ symbol, score, price, metrics: eq, pass });
    } catch (e) {
      // Skip symbol on errors
      console.log(`equityScreen error for ${symbol}:`, (e as Error).message);
    }
  }
  // Sort by score desc
  out.sort((a, b) => b.score - a.score);
  return out;
}
