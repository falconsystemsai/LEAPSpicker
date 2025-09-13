
import { config } from '../config';

export type EquityMetrics = {
  symbol: string;
  price: number;
  sma50: number;
  sma200: number;
  sma200Slope: number;
  rsi14: number;
  hv60: number; // historical volatility ~0..1
  mdd1y: number; // max drawdown (-)
  mom12m2m: number;
  // fundamentals (optional)
  revCagr3y?: number;
  fcfPositive?: boolean;
  netDebtToEbitda?: number;
  marginTrendOk?: boolean;
};

export type OptionsMetrics = {
  ivRank?: number;
  oiOk: boolean;
  spreadOk: boolean;
  targetDeltaOk: boolean;
};

export function scoreCandidate(eq: EquityMetrics, opt?: OptionsMetrics) {
  const w = config.weights;

  // Trend (30)
  let trend = 0;
  if (eq.price > eq.sma200) trend += 10;
  if (eq.sma200Slope > 0) trend += 10;
  if (eq.price > eq.sma50) trend += 5;
  if (eq.sma50 > eq.sma200) trend += 5;

  // Momentum (20)
  const mom = clamp(scalePercentile(eq.mom12m2m, -0.2, 0.5) * 20, 0, 20);

  // Vol/Risk (20)
  const hvScore = (1 - clamp(eq.hv60, 0, 1)) * 15;
  const mddScore = clamp(1 + eq.mdd1y, 0, 1) * 5;
  const volRisk = hvScore + mddScore;

  // Quality (20)
  let quality = 0;
  if (eq.revCagr3y != null) quality += clamp(scalePercentile(eq.revCagr3y, 0, 0.25) * 8, 0, 8);
  if (eq.fcfPositive) quality += 6;
  if (eq.netDebtToEbitda != null) quality += clamp(scaleReverse(eq.netDebtToEbitda, 0, 3) * 4, 0, 4);
  if (eq.marginTrendOk) quality += 2;

  // Options (10)
  let options = 0;
  if (opt) {
    if (opt.ivRank == null || opt.ivRank <= 0.5) options += 5;
    if (opt.oiOk && opt.spreadOk && opt.targetDeltaOk) options += 5;
  }

  const total =
    (trend / 30) * w.trend +
    (mom / 20) * w.momentum +
    (volRisk / 20) * w.volRisk +
    (quality / 20) * w.quality +
    (options / 10) * w.options;

  return Math.round(total);
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}
function scalePercentile(x: number, lo: number, hi: number) {
  return (x - lo) / (hi - lo);
}
function scaleReverse(x: number, lo: number, hi: number) {
  const t = (x - lo) / (hi - lo);
  return 1 - clamp(t, 0, 1);
}
