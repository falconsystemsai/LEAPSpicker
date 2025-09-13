
import { describe, it, expect } from 'vitest';
import { sma, rsi, macd, annualizedHV, maxDrawdown, momentum } from '../src/metrics/indicators';

describe('indicators', () => {
  const series = Array.from({ length: 260 }, (_, i) => 100 + i * 0.2); // trending up
  it('sma computes', () => {
    const s = sma(series, 50);
    expect(s.at(-1)).toBeTypeOf('number');
  });
  it('rsi computes', () => {
    const r = rsi(series, 14);
    expect(r.at(-1)).toBeTypeOf('number');
  });
  it('macd computes', () => {
    const m = macd(series);
    expect(m.hist.at(-1)).toBeTypeOf('number');
  });
  it('hv computes', () => {
    const hv = annualizedHV(series, 60);
    expect(hv.at(-1)).toBeTypeOf('number');
  });
  it('mdd computes', () => {
    const mdd = maxDrawdown(series, 252);
    expect(mdd).toBeLessThanOrEqual(0);
  });
  it('momentum computes', () => {
    const m = momentum(series);
    expect(typeof m).toBe('number');
  });
});
