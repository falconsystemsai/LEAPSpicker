
# LEAPS Screening Cloudflare Worker

A Cloudflare Workers app that screens **LEAPS candidates** using equity OHLCV data (Alpha Vantage),
optionally fundamentals (FMP), and a pluggable options provider. It computes indicators locally,
scores candidates, and exposes JSON + HTML endpoints. It can run on a daily cron.

> For research/education only. Not investment advice.

## Quick start

```bash
# Install wrangler globally if needed
# npm i -g wrangler

pnpm i   # or npm i
pnpm build
wrangler dev
```

Set secrets:
```bash
wrangler secret put ALPHA_VANTAGE_KEY
# optional:
wrangler secret put FMP_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put OPTIONS_API_KEY
```

## Endpoints
- `GET /` – health
- `GET /run?all=1` – execute the full pipeline for the configured universe (pass ?symbols=AAPL,MSFT to override)
- `GET /picks.json` – return last saved results (from KV)
- `GET /picks` – HTML dashboard

## Configure
Edit `src/config.ts` to change the universe, weights, and thresholds.

## Notes
- First-time runs will cache OHLCV in KV for 24h to respect Alpha Vantage limits.
- Indicators are computed locally to minimize API calls.
- Options checks are stubbed with an interface; plug your provider later.
