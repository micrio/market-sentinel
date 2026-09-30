import type { Bias, Horizon } from '@/lib/types'
import { cn } from '@/lib/utils'

const SHORT_LABELS: Record<string, string> = { week: 'W', month: 'M', year: 'Y' }
const FULL_LABELS: Record<string, string> = {
  week: 'This week',
  month: 'This month',
  year: 'This year',
}

const TEXT: Record<Bias, string> = {
  Bullish: 'text-emerald-400',
  Bearish: 'text-rose-400',
  Neutral: 'text-slate-400',
}

export default function HorizonMini({
  horizons,
  className,
  variant = 'short',
}: {
  horizons?: { week?: Horizon; month?: Horizon; year?: Horizon }
  className?: string
  variant?: 'short' | 'full'
}) {
  if (!horizons) return null

  const labels = variant === 'full' ? FULL_LABELS : SHORT_LABELS
  const entries = (['week', 'month', 'year'] as const)
    .map((key) => ({ key, horizon: horizons[key] }))
    .filter((entry): entry is { key: 'week' | 'month' | 'year'; horizon: Horizon } =>
      Boolean(entry.horizon),
    )

  if (entries.length === 0) return null

  return (
    <div className={cn('flex items-center gap-1.5 text-[10px] tabular-nums', className)}>
      {entries.map(({ key, horizon }) => (
        <span
          key={key}
          className={cn('inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5', TEXT[horizon.bias])}
          title={horizon.rationale}
        >
          <span className="font-medium text-slate-500">{labels[key]}</span>
          {horizon.probability}%
        </span>
      ))}
    </div>
  )
}
