
/** Basic indicators computed locally to minimize external API calls. */
export type Bar = { date: string; close: number };

export function sma(values: number[], period: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out.push(sum / period);
    else out.push(Number.NaN);
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = [];
  const k = 2 / (period + 1);
  let prev = values[0];
  out.push(prev);
  for (let i = 1; i < values.length; i++) {
    const next = values[i] * k + prev * (1 - k);
    out.push(next);
    prev = next;
  }
  return out;
}

export function rsi(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(Number.NaN);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  out[period] = calcRSI(avgGain, avgLoss);
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = Math.max(0, diff);
    const loss = Math.max(0, -diff);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = calcRSI(avgGain, avgLoss);
  }
  return out;
}

function calcRSI(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const line = values.map((_, i) => emaFast[i] - emaSlow[i]);
  const signalLine = ema(line.map((v) => (isFinite(v) ? v : 0)), signal);
  const hist = line.map((v, i) => v - signalLine[i]);
  return { line, signal: signalLine, hist };
}

export function annualizedHV(values: number[], period = 60): number[] {
  // values = closes
  const out: number[] = new Array(values.length).fill(Number.NaN);
  const lnRets: number[] = [];
  for (let i = 1; i < values.length; i++) lnRets.push(Math.log(values[i] / values[i - 1]));
  const win: number[] = [];
  const ann = Math.sqrt(252);
  for (let i = 0; i < lnRets.length; i++) {
    win.push(lnRets[i]);
    if (win.length > period) win.shift();
    if (win.length === period) {
      const mean = win.reduce((a, b) => a + b, 0) / win.length;
      const varr = win.reduce((a, b) => a + (b - mean) ** 2, 0) / (win.length - 1);
      out[i + 1] = Math.sqrt(varr) * ann;
    }
  }
  return out;
}

export function maxDrawdown(values: number[], lookback = 252): number {
  const start = Math.max(0, values.length - lookback);
  let peak = values[start];
  let mdd = 0;
  for (let i = start + 1; i < values.length; i++) {
    peak = Math.max(peak, values[i]);
    mdd = Math.min(mdd, values[i] / peak - 1);
  }
  return mdd;
}

export function momentum(values: number[], months12 = 252, months2 = 42): number {
  const n12 = Math.min(values.length - 1, months12);
  const n2 = Math.min(values.length - 1, months2);
  if (n12 <= n2) return 0;
  const ret12 = values[values.length - 1] / values[values.length - 1 - n12] - 1;
  const ret2 = values[values.length - 1] / values[values.length - 1 - n2] - 1;
  return ret12 - ret2;
}
