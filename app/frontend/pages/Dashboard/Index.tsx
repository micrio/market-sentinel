import { Head, router, useForm } from '@inertiajs/react'
import { Layers, Plus, RefreshCw, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import AnalysisModal from '@/components/AnalysisModal'
import AppShell from '@/components/AppShell'
import TickerCard from '@/components/TickerCard'
import { getJson, postJson } from '@/lib/api'
import type { AnalysisPayload, QuoteProps, WatchlistItemProps } from '@/lib/types'

interface Props {
  watchlist: WatchlistItemProps[]
}

export default function Index({ watchlist }: Props) {
  const [quotes, setQuotes] = useState<Record<string, QuoteProps>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null)
  const timers = useRef<number[]>([])
  const form = useForm({ symbol: '' })

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
    const interval = window.setInterval(() => void loadQuotes(), 60_000)
    return () => window.clearInterval(interval)
  }, [loadQuotes])

  useEffect(() => {
    return () => timers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  function addTicker(event: React.FormEvent) {
    event.preventDefault()
    form.post('/watchlist_items', {
      preserveScroll: true,
      onSuccess: () => form.reset(),
    })
  }

  function removeTicker(id: number) {
    router.delete(`/watchlist_items/${id}`, { preserveScroll: true })
  }

  async function runAnalysis(symbol: string) {
    if (analyzing) return

    setAnalyzing(symbol)
    try {
      const created = await postJson<AnalysisPayload>(`/analyze/${symbol}`)
      setAnalysis(created)
      poll(created.id)
    } catch (error) {
      setAnalyzing(null)
      setAnalysis({
        id: 0,
        symbol,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Analysis failed',
        createdAt: new Date().toISOString(),
      })
    }
  }

  function poll(id: number) {
    const tick = async () => {
      try {
        const result = await getJson<AnalysisPayload>(`/analyses/${id}`)
        setAnalysis(result)

        if (result.status === 'completed' || result.status === 'failed') {
          setAnalyzing(null)
        } else {
          timers.current.push(window.setTimeout(tick, 1500))
        }
      } catch {
        setAnalyzing(null)
      }
    }

    timers.current.push(window.setTimeout(tick, 1200))
  }

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
            Live quotes, crawler-backed news sentiment, and multi-horizon projections.
          </p>
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

      <form
        onSubmit={addTicker}
        className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3"
      >
        <div className="relative flex-1 min-w-[12rem]">
          <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={form.data.symbol}
            onChange={(event) => form.setData('symbol', event.target.value.toUpperCase())}
            placeholder="Add ticker (e.g. AAPL)"
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 py-2 pl-9 pr-3 text-sm font-mono outline-none focus:border-emerald-400/50"
          />
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

      {watchlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-12 text-center text-sm text-slate-400">
          Your watchlist is empty. Add a ticker above to start tracking.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {watchlist.map((item) => (
            <TickerCard
              key={item.id}
              item={item}
              quote={quotes[item.symbol]}
              analyzing={analyzing === item.symbol}
              onAnalyze={runAnalysis}
              onRemove={removeTicker}
            />
          ))}
        </div>
      )}

      {analysis && <AnalysisModal analysis={analysis} onClose={() => setAnalysis(null)} />}
    </AppShell>
  )
}
