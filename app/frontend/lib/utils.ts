import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(value),
  )
}

// "just now", "3m ago", "2h ago", "4d ago".
export function formatRelativeTime(value: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export type SentimentBias = 'Bullish' | 'Bearish' | 'Neutral'

export function dominantBias(sentiment: {
  bullish: number
  bearish: number
  neutral: number
}): SentimentBias {
  if (sentiment.bullish >= sentiment.bearish && sentiment.bullish >= sentiment.neutral) {
    return 'Bullish'
  }
  if (sentiment.bearish >= sentiment.bullish && sentiment.bearish >= sentiment.neutral) {
    return 'Bearish'
  }
  return 'Neutral'
}

// Yahoo Finance quote pages, no login required. `section` is a path segment
// like "chart", "history", "financials".
export function yahooFinanceUrl(symbol: string, section = ''): string {
  const suffix = section ? `/${section}/` : '/'
  return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}${suffix}`
}
