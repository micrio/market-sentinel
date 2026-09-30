import { ArrowDownRight, ArrowUpRight, Loader2, Sparkles, Trash2 } from 'lucide-react'
import type { QuoteProps, WatchlistItemProps } from '@/lib/types'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'

interface Props {
  item: WatchlistItemProps
  quote?: QuoteProps
  analyzing: boolean
  onAnalyze: (symbol: string) => void
  onRemove: (id: number) => void
}

export default function TickerCard({ item, quote, analyzing, onAnalyze, onRemove }: Props) {
  const up = (quote?.change ?? 0) >= 0

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-emerald-400/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-semibold text-slate-100">{item.symbol}</span>
            {quote?.currency && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                {quote.currency}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {quote?.name ?? item.name ?? '—'}
          </p>
        </div>

        <button
          type="button"
          title="Remove"
          onClick={() => onRemove(item.id)}
          className="shrink-0 rounded-md border border-white/10 p-1.5 text-slate-400 transition-colors hover:border-rose-400/40 hover:text-rose-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold tabular-nums text-slate-50">
            {quote ? formatCurrency(quote.price, quote.currency ?? 'USD') : '—'}
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
        </div>

        <button
          type="button"
          onClick={() => onAnalyze(item.symbol)}
          disabled={analyzing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:opacity-50"
        >
          {analyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {analyzing ? 'Analyzing…' : 'Run Sentiment'}
        </button>
      </div>
    </div>
  )
}
