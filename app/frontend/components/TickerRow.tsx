import { Link } from '@inertiajs/react'
import { Loader2, Sparkles } from 'lucide-react'
import HorizonMini from '@/components/HorizonMini'
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

export default function TickerRow({ item, quote, analysis, onAnalyze }: Props) {
  const now = useNow()
  const up = (quote?.change ?? 0) >= 0
  const busy = analysis?.status === 'pending' || analysis?.status === 'running'
  const failed = analysis?.status === 'failed'
  const sentiment = analysis?.status === 'completed' ? analysis.sentiment : undefined
  const bias = sentiment ? dominantBias(sentiment) : null
  const biasValue = sentiment ? Math.max(sentiment.bullish, sentiment.bearish, sentiment.neutral) : 0
  const href = `/tickers/${item.symbol}`

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-colors hover:border-emerald-400/40 hover:bg-white/[0.06]">
      <Link href={href} className="min-w-0 flex-1 basis-44">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-slate-100">
            {item.symbol}
          </span>
          {bias && (
            <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', BIAS_BADGE[bias])}>
              {bias} {biasValue}%
            </span>
          )}
          {busy && (
            <span className="inline-flex items-center gap-1 rounded bg-sky-400/10 px-1.5 py-0.5 text-[10px] text-sky-200">
              <Loader2 className="h-3 w-3 animate-spin" />
              {analysis?.progress ?? 0}%
            </span>
          )}
          {failed && (
            <span className="rounded bg-rose-400/10 px-1.5 py-0.5 text-[10px] text-rose-200">failed</span>
          )}
        </div>
        <p className="truncate text-xs text-slate-400">
          {quote?.name ?? item.name ?? '—'}
        </p>
      </Link>

      <div className="w-24 text-right tabular-nums">
        <div className="text-sm font-semibold text-slate-50">
          {quote ? formatCurrency(quote.price, quote.currency ?? 'USD') : '—'}
        </div>
        <div className={cn('text-xs', up ? 'text-emerald-400' : 'text-rose-400')}>
          {quote ? formatPercent(quote.changePercent) : '—'}
        </div>
        {quote?.updatedAt && (
          <p className="text-[10px] text-slate-500">{formatRelativeTime(quote.updatedAt, now)}</p>
        )}
      </div>

      <HorizonMini
        horizons={analysis?.status === 'completed' ? analysis.horizons : undefined}
        variant="full"
        className="hidden w-72 justify-end sm:flex"
      />

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
  )
}
