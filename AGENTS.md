# AGENTS.md

Project conventions for AI agents working in this repo (Market Sentinel —
Rails 7.2 + Inertia + React + TypeScript + Tailwind, SQLite).

## UI / hover conventions

- **Never add "bounce" hover effects.** No `hover:scale-*`, `active:scale-*`,
  `hover:translate-*`, `hover:-translate-*`, `hover:rotate-*` on buttons, links,
  cards or icons.
- **Hover feedback = highlight, not movement.** Change color/border/background.
  Cards: `border border-white/10 bg-white/[0.04] transition-colors
  hover:border-emerald-400/40`.

## Checks before finishing

- `npm run check` (TypeScript)
- `bundle exec rspec`
- `npx vite build` (when frontend changed)

## Background jobs

- Solid Queue on the primary SQLite database. Development/production use
  `:solid_queue`; tests use `:test`.
- Run the worker with `bin/jobs` or `bin/dev` (web + Vite + worker).
- Job dashboard: Mission Control at `/jobs` — dev/staging only, behind Devise.

## Data / external services

- Quotes: `StockQuote` (Yahoo Finance chart endpoint, no key).
- News: `NewsCrawler` (public RSS; skip failing feeds).
- Sentiment: `SentimentAnalyzer` (RubyLLM/DeepSeek, keyword fallback).
- Every network service returns a safe fallback and never raises into the job.
