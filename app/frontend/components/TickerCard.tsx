import { Link } from '@inertiajs/react'
import { ArrowDownRight, ArrowUpRight, Loader2, Sparkles } from 'lucide-react'
import type { AnalysisSummary, QuoteProps, WatchlistItemProps } from '@/lib/types'
import { useNow } from '@/lib/useNow'
import {
  cn,
  dominantBias,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  type SentimentBias,
} from '@/lib/utils'

interface Props {
  item: WatchlistItemProps
  quote?: QuoteProps
  analysis?: AnalysisSummary | null
  onAnalyze: (symbol: string) => void
}

const BIAS_BADGE: Record<SentimentBias, string> = {
  Bullish: 'bg-emerald-400/10 text-emerald-200',
  Bearish: 'bg-rose-400/10 text-rose-200',
  Neutral: 'bg-slate-400/10 text-slate-300',
}

export default function TickerCard({ item, quote, analysis, onAnalyze }: Props) {
  const now = useNow()
  const up = (quote?.change ?? 0) >= 0
  const busy = analysis?.status === 'pending' || analysis?.status === 'running'
  const failed = analysis?.status === 'failed'
  const sentiment = analysis?.status === 'completed' ? analysis.sentiment : undefined
  const bias = sentiment ? dominantBias(sentiment) : null
  const biasValue = sentiment ? Math.max(sentiment.bullish, sentiment.bearish, sentiment.neutral) : 0
  const href = `/tickers/${item.symbol}`

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-emerald-400/40 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <Link href={href} className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-semibold text-slate-100">{item.symbol}</span>
            {busy && (
              <span className="inline-flex items-center gap-1 rounded bg-sky-400/10 px-1.5 py-0.5 text-[10px] text-sky-200">
                <Loader2 className="h-3 w-3 animate-spin" />
                {analysis?.progress ?? 0}%
              </span>
            )}
            {failed && (
              <span className="rounded bg-rose-400/10 px-1.5 py-0.5 text-[10px] text-rose-200">
                failed
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400">{quote?.name ?? item.name ?? '—'}</p>
        </Link>

        {bias && (
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
              BIAS_BADGE[bias],
            )}
          >
            {bias} {biasValue}%
          </span>
        )}
      </div>

      <Link href={href} className="mt-4 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold tabular-nums text-slate-50">
            {quote ? formatCurrency(quote.price, quote.currency ?? 'USD') : '—'}
          </span>
          {quote?.currency && quote.currency !== 'USD' && (
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              {quote.currency}
            </span>
          )}
        </div>
        <div
          className={cn(
            'mt-0.5 inline-flex items-center gap-1 text-xs tabular-nums',
            up ? 'text-emerald-400' : 'text-rose-400',
          )}
        >
          {quote ? (
            <>
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {formatPercent(quote.changePercent)}
            </>
          ) : (
            <span className="text-slate-500">awaiting quote…</span>
          )}
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="text-[10px] text-slate-500">
          {quote?.updatedAt ? `updated ${formatRelativeTime(quote.updatedAt, now)}` : ''}
        </span>
        <button
          type="button"
          onClick={() => onAnalyze(item.symbol)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {busy ? 'Analyzing…' : 'Run'}
        </button>
      </div>
    </div>
  )
}
