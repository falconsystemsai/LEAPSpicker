
import { describe, it, expect } from 'vitest';
import { scoreCandidate } from '../src/metrics/scoring';

describe('scoring', () => {
  it('scores reasonable candidate', () => {
    const eq = {
      symbol: 'TEST', price: 120,
      sma50: 110, sma200: 100, sma200Slope: 1.2,
      rsi14: 55, hv60: 0.3, mdd1y: -0.15, mom12m2m: 0.2,
      fcfPositive: true, marginTrendOk: true
    };
    const s = scoreCandidate(eq as any);
    expect(s).toBeGreaterThan(0);
  });
});
