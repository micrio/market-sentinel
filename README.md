# Market Sentinel

A stock watchlist with live quotes, news-driven sentiment analysis, and
multi-horizon projections. Add US tickers, watch the tape, and run a sentiment
report backed by recent financial headlines — all without paid data APIs.

> Educational tool only. Not financial advice.

## Features

### Watchlist
- Add **US tickers** with autocomplete from a bundled directory (11k+ symbols
  and names) — no API calls for lookup.
- **Grid** or **list** layout, with sorting: `A–Z`, `Bullish`, `Gainers`,
  `Losers`.
- Live quotes with price, % change, and a relative `updated 3m ago` cache time.
- At-a-glance **sentiment badge** (e.g. `Bullish 72%`) and, in list view,
  week/month/year horizon chips.
- Whole card redirects to the ticker page; the **Run** button stays independent.

### Ticker detail (`/tickers/:symbol`)
- Latest sentiment report plus a **history of previous runs** with dates — click
  a row to view any past report.
- **Yahoo Finance menu**: chart, historical data, financials, analysis,
  statistics, holders (opens in a new tab; no API cost).
- **Remove from watchlist** behind a confirmation dialog.
- Run a new analysis; it processes in the background so you can keep navigating.

### Sentiment analysis
- Crawls recent headlines, scores sentiment, and projects **This Week /
  Next Month / Next Year** with probabilities, biases, and rationale.
- Uses **DeepSeek via RubyLLM** when `DEEPSEEK_API_KEY` is set, otherwise a
  keyword-based fallback.
- Runs on **Solid Queue** with live **progress** (Queued → crawling → scoring →
  saving). Every run is persisted per user and symbol.

## Stack

- **Rails 7.2** + **Inertia.js** (`inertia_rails`) + **React 19** +
  **TypeScript** + **Tailwind CSS v4**
- **SQLite** (primary DB) with **Solid Queue** for background jobs
- **Devise** for auth, **RubyLLM** (DeepSeek) for sentiment, **Nokogiri** for RSS
- **Recharts** for sentiment/horizon charts, **Lucide** icons

## Setup

```bash
bundle install
npm install
cp .env.example .env      # optional: add DEEPSEEK_API_KEY / FINNHUB_API_KEY
bin/rails db:prepare
bin/rails db:seed         # creates admin@user.com / password
```

### Environment variables

| Variable             | Required | Purpose                                              |
| -------------------- | -------- | ---------------------------------------------------- |
| `DEEPSEEK_API_KEY`   | no       | LLM sentiment; falls back to keyword scoring if unset|
| `DEEPSEEK_MODEL`     | no       | `deepseek-chat` (default) or `deepseek-reasoner`     |
| `FINNHUB_API_KEY`    | no       | Fallback quote provider when Yahoo fails             |
| `BASE_URL`           | no       | App URL                                              |
| `RAILS_MAX_THREADS`  | no       | DB pool size                                         |
| `JOB_CONCURRENCY`    | no       | Solid Queue worker processes                         |

## Run

```bash
bin/dev                   # Rails + Vite + Solid Queue worker
```

Or individually: `bin/rails server`, `bin/vite dev`, `bin/jobs`.

Sign in with the seeded **`admin@user.com` / `password`** (or create an account).

## How it works

1. **Quotes** — `QuoteLookup` serves a **30-minute cache** per symbol, falling
   back Yahoo chart endpoint → Finnhub. Cached values carry an `updated_at` the
   UI renders as relative time.
2. **Ticker directory** — US symbols come from the NASDAQ Trader symbol files,
   built into `app/frontend/data/us_tickers.json` and lazily loaded for the
   watchlist autocomplete:
   ```bash
   bin/rails tickers:build
   ```
3. **News** — `NewsCrawler` reads public RSS from **Nasdaq**, **Google News**,
   and **Bing News** (up to 5 newest per source, no API key; failing feeds are
   skipped).
4. **Sentiment** — `SentimentAnalyzer` scores the articles (DeepSeek or keyword
   fallback) and returns bullish/bearish/neutral, a summary, three horizons, and
   catalysts.
5. **Background** — `POST /analyze/:symbol` enqueues `AnalysisJob` (Solid Queue).
   `AnalysisRunner` reports progress and persists the result on the `Analysis`
   record. The UI polls `GET /analyses/:id` while a run is in progress.
6. **Reuse & cooldown** — a new run request reuses an existing one when it makes
   sense, saving crawls and LLM calls:
   - in-flight run < 15 min (stuck runs are treated as expired),
   - completed run < 30 min,
   - failed run < 60 s (anti-spam).

## Routes

| Method | Path                  | Purpose                                |
| ------ | --------------------- | -------------------------------------- |
| GET    | `/`                   | Watchlist dashboard                    |
| GET    | `/tickers/:symbol`    | Ticker detail (latest + history)       |
| GET    | `/quotes`             | Quotes for `?symbols=AAPL,TSLA`        |
| POST   | `/watchlist_items`    | Add a ticker                           |
| DELETE | `/watchlist_items/:id`| Remove a ticker                        |
| POST   | `/analyze/:symbol`    | Start (or reuse) a sentiment run       |
| GET    | `/analyses/:id`       | Poll a run                             |
| GET    | `/jobs`               | Mission Control (dev/staging, Devise)  |

## Architecture

```
app/
  controllers/     dashboard, quotes, tickers, analyses, watchlist_items
  models/          User, WatchlistItem, Analysis
  services/        StockQuote, FinnhubQuote, QuoteLookup, NewsCrawler,
                   SentimentAnalyzer, AnalysisRunner
  jobs/            AnalysisJob (Solid Queue)
  frontend/        Inertia + React pages/components, bundled ticker data
lib/tasks/         tickers.rake (build the US ticker directory)
spec/              request, service, model and job specs
```

## Checks

```bash
npm run check          # TypeScript
bundle exec rspec      # test suite
npx vite build         # production asset build
```
