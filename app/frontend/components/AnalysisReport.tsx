import { ExternalLink, Loader2 } from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import type { AnalysisPayload, Bias, Horizon } from '@/lib/types'

const BIAS_COLOR: Record<Bias, string> = {
  Bullish: '#34d399',
  Bearish: '#fb7185',
  Neutral: '#94a3b8',
}

const HORIZON_LABELS: Record<string, string> = {
  week: 'This Week',
  month: 'Next Month',
  year: 'Next Year',
}

export default function AnalysisReport({ analysis }: { analysis: AnalysisPayload }) {
  if (analysis.status === 'pending' || analysis.status === 'running') {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            {analysis.stage ?? 'Working…'}
          </span>
          <span className="text-xs tabular-nums text-slate-400">{analysis.progress ?? 0}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
            style={{ width: `${Math.min(100, Math.max(0, analysis.progress ?? 0))}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Running in the background — feel free to navigate away, it keeps going.
        </p>
      </div>
    )
  }

  if (analysis.status === 'failed') {
    return (
      <div className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">
        {analysis.error ?? 'Analysis failed.'}
      </div>
    )
  }

  const sentiment = analysis.sentiment ?? { bullish: 0, bearish: 0, neutral: 0 }
  const gaugeData = [{ name: 'Bullish', value: sentiment.bullish }]
  const horizons = analysis.horizons ?? {}
  const chartData = (['week', 'month', 'year'] as const)
    .map((key) => {
      const horizon = horizons[key]
      return horizon
        ? { name: HORIZON_LABELS[key], probability: horizon.probability, bias: horizon.bias }
        : null
    })
    .filter((entry): entry is { name: string; probability: number; bias: Bias } => entry !== null)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="relative h-[130px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}
                data={gaugeData}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={8} fill="#34d399" background />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-6">
              <span className="text-3xl font-semibold text-emerald-400">{sentiment.bullish}%</span>
              <span className="text-[11px] uppercase tracking-wide text-slate-400">Bullish</span>
            </div>
          </div>
          <div className="mt-1 flex gap-3 text-xs">
            <span className="text-emerald-300">{sentiment.bullish}% bull</span>
            <span className="text-slate-400">{sentiment.neutral}% neutral</span>
            <span className="text-rose-300">{sentiment.bearish}% bear</span>
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            Summary
          </h3>
          <p className="text-sm text-slate-200">{analysis.summary}</p>

          {analysis.catalysts && analysis.catalysts.length > 0 && (
            <div className="mt-3">
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                Key Catalysts
              </h3>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-300">
                {analysis.catalysts.map((catalyst) => (
                  <li key={catalyst}>{catalyst}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
          Horizon Projections
        </h3>
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={BIAS_COLOR[entry.bias]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {(['week', 'month', 'year'] as const).map((key) => {
            const horizon: Horizon | undefined = horizons[key]
            if (!horizon) return null
            return (
              <div key={key} className="rounded-lg border border-white/10 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">{HORIZON_LABELS[key]}</span>
                  <span className="text-xs font-semibold" style={{ color: BIAS_COLOR[horizon.bias] }}>
                    {horizon.probability}% {horizon.bias}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-400">{horizon.rationale}</p>
              </div>
            )
          })}
        </div>
      </div>

      {analysis.articles && analysis.articles.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Sources ({analysis.articles.length})
          </h3>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {analysis.articles.map((article) => (
              <li key={article.url}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-2 rounded-md border border-white/5 px-2.5 py-2 transition-colors hover:border-emerald-400/30 hover:bg-white/5"
                >
                  <span className="mt-0.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                    {article.source}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-slate-200 group-hover:text-white">
                      {article.title}
                    </span>
                    {article.snippet && (
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                        {article.snippet}
                      </span>
                    )}
                  </span>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-emerald-300" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
