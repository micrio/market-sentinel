import { Head, useForm } from '@inertiajs/react'
import { LayoutGrid, Layers, List, Plus, RefreshCw, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppShell from '@/components/AppShell'
import TickerCard from '@/components/TickerCard'
import TickerRow from '@/components/TickerRow'
import { getJson, postJson } from '@/lib/api'
import type { AnalysisPayload, AnalysisSummary, QuoteProps, WatchlistItemProps } from '@/lib/types'
import { cn } from '@/lib/utils'

type Ticker = [string, string]
type SortKey = 'symbol' | 'sentiment' | 'gainers' | 'losers'
type Layout = 'grid' | 'list'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'symbol', label: 'A–Z' },
  { key: 'sentiment', label: 'Bullish' },
  { key: 'gainers', label: 'Gainers' },
  { key: 'losers', label: 'Losers' },
]

interface Props {
  watchlist: WatchlistItemProps[]
  analyses: Record<string, AnalysisSummary>
}

export default function Index({ watchlist, analyses: initialAnalyses }: Props) {
  const [quotes, setQuotes] = useState<Record<string, QuoteProps>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [analyses, setAnalyses] = useState<Record<string, AnalysisSummary>>(initialAnalyses)
  const timers = useRef<number[]>([])
  const form = useForm({ symbol: '', name: '' })
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const tickersLoaded = useRef(false)
  const [sort, setSort] = useState<SortKey>('symbol')
  const [layout, setLayout] = useState<Layout>('grid')

  // Load the bundled US ticker directory on first interaction. It is a lazy
  // chunk, so it costs nothing until the user actually types in the input.
  function ensureTickers() {
    if (tickersLoaded.current) return

    tickersLoaded.current = true
    void import('@/data/us_tickers.json').then((module) => {
      setTickers((module.default as Ticker[]) ?? [])
    })
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!suggestionsRef.current?.contains(event.target as Node)) setShowSuggestions(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const query = form.data.symbol.trim()
  const suggestions = useMemo(() => {
    if (query === '') return []

    const q = query.toLowerCase()
    return tickers
      .filter(
        ([symbol, name]) => symbol.toLowerCase().startsWith(q) || name.toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          Number(!a[0].toLowerCase().startsWith(q)) - Number(!b[0].toLowerCase().startsWith(q)),
      )
      .slice(0, 8)
  }, [tickers, query])

  const symbols = watchlist.map((item) => item.symbol)
  const symbolKey = symbols.join(',')

  const loadQuotes = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes({})
      return
    }

    setRefreshing(true)
    try {
      const data = await getJson<{ quotes: QuoteProps[] }>(`/quotes?symbols=${symbols.join(',')}`)
      setQuotes(Object.fromEntries(data.quotes.map((quote) => [quote.symbol, quote])))
    } catch {
      // keep the previous quotes on failure
    } finally {
      setRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolKey])

  useEffect(() => {
    void loadQuotes()
    // Quotes are cached server-side for 30 minutes, so poll on the same cadence.
    const interval = window.setInterval(() => void loadQuotes(), 1_800_000)
    return () => window.clearInterval(interval)
  }, [loadQuotes])

  useEffect(() => {
    return () => timers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  useEffect(() => {
    setAnalyses(initialAnalyses)
  }, [initialAnalyses])

  function addTicker(event: React.FormEvent) {
    event.preventDefault()
    form.post('/watchlist_items', {
      preserveScroll: true,
      onSuccess: () => {
        form.reset()
        setShowSuggestions(false)
      },
    })
  }

  function chooseSuggestion(symbol: string, name: string) {
    form.setData({ symbol, name })
    setShowSuggestions(false)
    setActiveIndex(-1)
  }

  function onSymbolChange(value: string) {
    ensureTickers()
    form.setData('symbol', value.toUpperCase())
    form.setData('name', '')
    setShowSuggestions(true)
    setActiveIndex(-1)
  }

  function onSymbolKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setShowSuggestions(true)
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, -1))
    } else if (event.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIndex(-1)
    } else if (event.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault()
      chooseSuggestion(...suggestions[activeIndex])
    }
  }

  async function runAnalysis(symbol: string) {
    const existing = analyses[symbol]
    if (existing && (existing.status === 'pending' || existing.status === 'running')) return

    // Optimistic queued state; the run continues server-side even if you navigate.
    setAnalyses((prev) => ({
      ...prev,
      [symbol]: {
        id: prev[symbol]?.id ?? 0,
        symbol,
        status: 'pending',
        stage: 'Queued',
        progress: 0,
        error: null,
        createdAt: new Date().toISOString(),
      },
    }))

    try {
      const created = await postJson<AnalysisPayload>(`/analyze/${symbol}`)
      setAnalyses((prev) => ({ ...prev, [symbol]: created }))
      poll(created.id, symbol)
    } catch (error) {
      setAnalyses((prev) => ({
        ...prev,
        [symbol]: {
          id: 0,
          symbol,
          status: 'failed',
          stage: 'Failed',
          progress: 0,
          error: error instanceof Error ? error.message : 'Analysis failed',
          createdAt: new Date().toISOString(),
        },
      }))
    }
  }

  function poll(id: number, symbol: string) {
    const tick = async () => {
      try {
        const result = await getJson<AnalysisPayload>(`/analyses/${id}`)
        setAnalyses((prev) => ({ ...prev, [symbol]: result }))

        if (result.status !== 'completed' && result.status !== 'failed') {
          timers.current.push(window.setTimeout(tick, 1500))
        }
      } catch {
        // stop polling on error
      }
    }

    timers.current.push(window.setTimeout(tick, 1200))
  }

  const sortedWatchlist = useMemo(() => {
    const items = [...watchlist]
    const score = (symbol: string) => {
      const analysis = analyses[symbol]
      if (analysis?.status !== 'completed' || !analysis.sentiment) return -1_000_000
      return analysis.sentiment.bullish - analysis.sentiment.bearish
    }
    const change = (symbol: string) => quotes[symbol]?.changePercent

    switch (sort) {
      case 'sentiment':
        return items.sort((a, b) => score(b.symbol) - score(a.symbol))
      case 'gainers':
        return items.sort(
          (a, b) => (change(b.symbol) ?? -1_000_000) - (change(a.symbol) ?? -1_000_000),
        )
      case 'losers':
        return items.sort(
          (a, b) => (change(a.symbol) ?? 1_000_000) - (change(b.symbol) ?? 1_000_000),
        )
      default:
        return items.sort((a, b) => a.symbol.localeCompare(b.symbol))
    }
  }, [watchlist, analyses, quotes, sort])

  return (
    <AppShell>
      <Head title="Watchlist" />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Watchlist
          </h1>
          <p className="text-sm text-slate-400">
            Live US quotes, crawler-backed news sentiment, and multi-horizon projections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {SORTS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSort(option.key)}
                className={cn(
                  'rounded-md px-2 py-1 text-[11px] transition-colors',
                  sort === option.key
                    ? 'bg-emerald-400/15 text-emerald-200'
                    : 'text-slate-400 hover:text-slate-200',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg border border-white/10 p-0.5">
            <button
              type="button"
              title="Grid"
              onClick={() => setLayout('grid')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                layout === 'grid'
                  ? 'bg-emerald-400/15 text-emerald-200'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="List"
              onClick={() => setLayout('list')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                layout === 'list'
                  ? 'bg-emerald-400/15 text-emerald-200'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void loadQuotes()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400/40 hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw className={refreshing ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
            Refresh
          </button>
        </div>
      </div>

      <form
        onSubmit={addTicker}
        className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3"
      >
        <div ref={suggestionsRef} className="relative flex-1 min-w-[12rem]">
          <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={form.data.symbol}
            onChange={(event) => onSymbolChange(event.target.value)}
            onFocus={() => {
              ensureTickers()
              if (query !== '') setShowSuggestions(true)
            }}
            onKeyDown={onSymbolKeyDown}
            placeholder="Add US ticker (e.g. AAPL)"
            autoComplete="off"
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 py-2 pl-9 pr-3 text-sm font-mono outline-none focus:border-emerald-400/50"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-white/10 bg-slate-900 shadow-xl">
              {suggestions.map(([symbol, name], index) => (
                <li key={symbol}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(symbol, name)}
                    className={
                      index === activeIndex
                        ? 'flex w-full items-center gap-3 bg-emerald-500/10 px-3 py-2 text-left'
                        : 'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/5'
                    }
                  >
                    <span className="shrink-0 font-mono text-sm text-slate-100">{symbol}</span>
                    <span className="min-w-0 truncate text-xs text-slate-400">{name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={form.processing || form.data.symbol.trim() === ''}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add ticker
        </button>
        {form.errors.symbol && (
          <span className="w-full text-xs text-rose-300">{form.errors.symbol}</span>
        )}
      </form>

      {watchlist.length > 0 && (
        <div className="mb-3 text-[11px] uppercase tracking-wide text-slate-500">
          US tickers · {sortedWatchlist.length}
        </div>
      )}

      {watchlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-12 text-center text-sm text-slate-400">
          Your watchlist is empty. Add a ticker above to start tracking.
        </div>
      ) : layout === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sortedWatchlist.map((item) => (
            <TickerCard
              key={item.id}
              item={item}
              quote={quotes[item.symbol]}
              analysis={analyses[item.symbol]}
              onAnalyze={runAnalysis}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden gap-3 px-3 text-[10px] uppercase tracking-wide text-slate-500 sm:flex">
            <span className="flex-1">Ticker</span>
            <span className="w-24 text-right">Price</span>
            <span className="w-72 text-right">Outlook</span>
            <span className="w-16" />
          </div>
          {sortedWatchlist.map((item) => (
            <TickerRow
              key={item.id}
              item={item}
              quote={quotes[item.symbol]}
              analysis={analyses[item.symbol]}
              onAnalyze={runAnalysis}
            />
          ))}
        </div>
      )}
    </AppShell>
  )
}
