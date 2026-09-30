import { ChevronDown, ExternalLink, LineChart } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn, yahooFinanceUrl } from '@/lib/utils'

// Useful Yahoo Finance pages for a ticker. All public, no login required.
const SECTIONS: { label: string; path: string }[] = [
  { label: 'Chart', path: 'chart' },
  { label: 'Historical data', path: 'history' },
  { label: 'Financials', path: 'financials' },
  { label: 'Analysis', path: 'analysis' },
  { label: 'Statistics', path: 'key-statistics' },
  { label: 'Holders', path: 'holders' },
]

export default function YahooFinanceMenu({ symbol }: { symbol: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400/40 hover:bg-white/5"
      >
        <LineChart className="h-3.5 w-3.5" />
        Yahoo Finance
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-xl">
          {SECTIONS.map((section) => (
            <li key={section.path}>
              <a
                href={yahooFinanceUrl(symbol, section.path)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {section.label}
                <ExternalLink className="h-3 w-3 text-slate-500" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
