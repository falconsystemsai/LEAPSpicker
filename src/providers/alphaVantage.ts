import { cachedGetJSON } from '../store/kvCache';

type AlphaVantageError = {
  Note?: string;
  Information?: string;
  'Error Message'?: string;
};

type AlphaVantageDaily = {
  'Time Series (Daily)': Record<string, { '5. adjusted close': string }>;
};

export async function getDailyAdjusted(env: any, symbol: string): Promise<AlphaVantageDaily> {
  const key = env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_KEY not set');
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${key}&outputsize=full`;
  const cacheKey = `av:daily:${symbol}:full`;
  return cachedGetJSON(env.leapspicker, cacheKey, 24 * 60 * 60, async () => {
    const res = await fetch(url, { cf: { cacheTtl: 0 } });
    if (!res.ok) throw new Error(`Alpha Vantage error ${res.status}`);
    const json: AlphaVantageDaily | AlphaVantageError = await res.json();
    const ts = (json as AlphaVantageDaily)['Time Series (Daily)'];
    const errMsg =
      (json as AlphaVantageError).Note ??
      (json as AlphaVantageError).Information ??
      (json as AlphaVantageError)['Error Message'];
    if (!ts || errMsg) {
      throw new Error(errMsg || 'Alpha Vantage response missing Time Series (Daily)');
    }
    return json;
  });
}

export function extractCloses(avJson: AlphaVantageDaily): number[] {
  if (!avJson || typeof avJson !== 'object') {
    throw new Error('Alpha Vantage data is undefined or invalid');
  }
  const ts = avJson['Time Series (Daily)'];
  if (!ts) {
    throw new Error('Alpha Vantage data missing Time Series (Daily)');
  }
  const rows = Object.entries(ts).map(([d, o]) => ({
    d,
    c: +o['5. adjusted close'],
  }));
  rows.sort((a, b) => (a.d < b.d ? -1 : 1));
  return rows.map((r) => r.c);
}
