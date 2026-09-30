import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft, History, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import AnalysisReport from '@/components/AnalysisReport'
import AppShell from '@/components/AppShell'
import ConfirmDialog from '@/components/ConfirmDialog'
import YahooFinanceMenu from '@/components/YahooFinanceMenu'
import { getJson, postJson } from '@/lib/api'
import type { AnalysisPayload, AnalysisStatus, AnalysisSummary } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  symbol: string
  name: string | null
  watchlistItemId: number | null
  inWatchlist: boolean
  selected: AnalysisPayload | null
  analyses: AnalysisSummary[]
}

const STATUS_STYLES: Record<AnalysisStatus, string> = {
  pending: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  running: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  completed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  failed: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
}

export default function Show({ symbol, name, watchlistItemId, inWatchlist, selected, analyses }: Props) {
  const [current, setCurrent] = useState<AnalysisPayload | null>(selected)
  const [starting, setStarting] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const timer = useRef<number | null>(null)

  // Follow the prop when a history row is selected (partial reload).
  useEffect(() => {
    setCurrent(selected)
  }, [selected])

  // Keep the selected run up to date while it processes.
  useEffect(() => {
    if (!current || (current.status !== 'pending' && current.status !== 'running')) return

    timer.current = window.setTimeout(async () => {
      try {
        const result = await getJson<AnalysisPayload>(`/analyses/${current.id}`)
        setCurrent(result)
      } catch {
        // stop polling on error
      }
    }, 1500)

    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [current])

  const running = current?.status === 'pending' || current?.status === 'running'

  function selectAnalysis(id: number) {
    router.get(
      `/tickers/${symbol}`,
      { analysis_id: id },
      { preserveScroll: true, preserveState: true, only: ['selected'] },
    )
  }

  async function runAnalysis() {
    if (starting || running) return

    setStarting(true)
    try {
      const created = await postJson<AnalysisPayload>(`/analyze/${symbol}`)
      setCurrent(created)
      router.reload({ only: ['analyses'] })
    } catch {
      // surfaced through the existing selected run
    } finally {
      setStarting(false)
    }
  }

  function removeFromWatchlist() {
    if (!watchlistItemId) return
    setConfirmingRemove(false)
    router.delete(`/watchlist_items/${watchlistItemId}`)
  }

  return (
    <AppShell>
      <Head title={`${symbol} · Sentiment`} />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/"
            className="mb-1 inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-emerald-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to watchlist
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <span className="font-mono">{symbol}</span>
            {name && <span className="text-sm font-normal text-slate-400">{name}</span>}
            {!inWatchlist && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                not tracked
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <YahooFinanceMenu symbol={symbol} />

          <button
            type="button"
            onClick={() => void runAnalysis()}
            disabled={starting || running}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:opacity-50"
          >
            {starting || running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {running ? 'Running…' : 'Run new analysis'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <section className="min-w-0">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            {current ? (
              <>
                Latest report · {new Date(current.createdAt).toLocaleString()}
              </>
            ) : (
              'Latest report'
            )}
          </h2>

          {current ? (
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[34rem]">
                <AnalysisReport analysis={current} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-12 text-center text-sm text-slate-400">
              No sentiment reports yet. Run one to get started.
            </div>
          )}
        </section>

        <aside className="min-w-0">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            <History className="h-3.5 w-3.5" />
            Previous reports ({analyses.length})
          </h2>

          {analyses.length === 0 ? (
            <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-4 text-xs text-slate-500">
              Runs are saved here with their dates.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {analyses.map((analysis) => {
                const isSelected = current?.id === analysis.id
                return (
                  <li key={analysis.id}>
                    <button
                      type="button"
                      onClick={() => selectAnalysis(analysis.id)}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                        isSelected
                          ? 'border-emerald-400/40 bg-emerald-400/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-emerald-400/30 hover:bg-white/5',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-300">
                          {new Date(analysis.createdAt).toLocaleString()}
                        </span>
                        <span
                          className={cn(
                            'rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide',
                            STATUS_STYLES[analysis.status],
                          )}
                        >
                          {analysis.status}
                        </span>
                      </div>
                      {analysis.status === 'failed' && analysis.error && (
                        <span className="mt-1 block truncate text-[11px] text-rose-300/80">
                          {analysis.error}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {watchlistItemId && (
            <button
              type="button"
              onClick={() => setConfirmingRemove(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-400/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove from watchlist
            </button>
          )}
        </aside>
      </div>

      {confirmingRemove && (
        <ConfirmDialog
          title={`Remove ${symbol}?`}
          message="This removes the ticker from your watchlist. Its saved sentiment reports are kept."
          confirmLabel="Remove"
          onConfirm={removeFromWatchlist}
          onCancel={() => setConfirmingRemove(false)}
        />
      )}
    </AppShell>
  )
}
