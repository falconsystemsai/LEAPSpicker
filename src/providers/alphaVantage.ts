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

export type AlphaVantageNewsItem = {
  title: string;
  url: string;
  time_published: string;
  summary: string;
  source: string;
  overall_sentiment_score: string;
  overall_sentiment_label: string;
  ticker_sentiment: { ticker: string; ticker_sentiment_score: string; ticker_sentiment_label: string }[];
};

type AlphaVantageNews = {
  feed: AlphaVantageNewsItem[];
};

export async function getNewsSentiment(env: any, symbol: string) {
  const key = env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_KEY not set');
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${key}`;
  const cacheKey = `av:news:${symbol}`;
  const json: AlphaVantageNews | AlphaVantageError = await cachedGetJSON(
    env.leapspicker,
    cacheKey,
    30 * 60,
    async () => {
      const res = await fetch(url, { cf: { cacheTtl: 0 } });
      if (!res.ok) throw new Error(`Alpha Vantage error ${res.status}`);
      return res.json();
    },
  );
  const feed = (json as AlphaVantageNews).feed || [];
  let sum = 0;
  let cnt = 0;
  for (const item of feed) {
    const tickerInfo = item.ticker_sentiment?.find((t) => t.ticker === symbol);
    if (tickerInfo) {
      sum += parseFloat(tickerInfo.ticker_sentiment_score);
      cnt++;
    }
  }
  const sentiment = cnt ? sum / cnt : 0;
  const news = feed.slice(0, 3).map((n) => ({
    title: n.title,
    url: n.url,
    published: n.time_published,
  }));
  return { sentiment, news };
}

