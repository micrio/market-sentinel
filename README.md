# Market Sentinel

A stock tracking, news crawling, and sentiment analysis dashboard. Add tickers to
a watchlist, see live quotes, and run a sentiment + multi-horizon analysis backed
by recent financial headlines.

> Educational tool only. Not financial advice.

## Stack

- **Rails 7.2** + **Inertia.js** + **React 19** + **TypeScript** + **Tailwind CSS v4**
- **SQLite** (primary) + **Solid Queue** (background jobs)
- **Devise** (auth), **RubyLLM** (DeepSeek) for sentiment, **Nokogiri** for RSS crawling
- **Recharts** for sentiment/horizon visualisation, **Lucide** icons

## Setup

```bash
bundle install
npm install
cp .env.example .env      # add DEEPSEEK_API_KEY
bin/rails db:prepare
```

## Run

```bash
bin/dev                   # Rails + Vite + Solid Queue worker
```

Or individually: `bin/rails server`, `bin/vite dev`, `bin/jobs`.

- `/` — watchlist dashboard (requires sign in)
- `/jobs` — Solid Queue dashboard (dev/test only)

## How it works

1. **Watchlist** — `WatchlistItem` rows per user. `GET /quotes?symbols=AAPL,TSLA`
   pulls live-ish quotes from Yahoo Finance's public chart endpoint.
2. **Crawler** — `NewsCrawler` scrapes recent headlines for a ticker from the
   Yahoo Finance and Google News RSS feeds (no API key, skips failing sources).
3. **Sentiment** — `SentimentAnalyzer` sends the articles to DeepSeek via
   RubyLLM and returns bullish/bearish/neutral percentages, a short summary,
   three horizon projections (This Week / Next Month / Next Year) and key
   catalysts. Without `DEEPSEEK_API_KEY` it falls back to keyword scoring.
4. **Background** — `POST /analyze/:symbol` enqueues `AnalysisJob`; the dashboard
   polls `GET /analyses/:id` and opens the analysis modal when it completes.

## API

```
GET    /quotes?symbols=AAPL,TSLA
POST   /watchlist_items            { symbol }
DELETE /watchlist_items/:id
POST   /analyze/:symbol
GET    /analyses/:id
```

## Checks

```bash
npm run check          # TypeScript
bundle exec rspec
npx vite build
```
