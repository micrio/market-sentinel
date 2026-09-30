export interface AuthUser {
  id: number
  email: string
}

export interface SharedProps {
  auth: { signedIn: boolean; user: AuthUser | null }
  flash: { notice?: string | null; alert?: string | null }
  [key: string]: unknown
}

export interface WatchlistItemProps {
  id: number
  symbol: string
  name: string | null
  createdAt: string
}

export interface QuoteProps {
  symbol: string
  name?: string | null
  price: number
  previousClose: number
  change: number
  changePercent: number
  currency?: string | null
  updatedAt?: string | null
}

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface AnalysisSummary {
  id: number
  symbol: string
  status: AnalysisStatus
  stage?: string | null
  progress?: number
  sentiment?: { bullish: number; bearish: number; neutral: number }
  horizons?: { week?: Horizon; month?: Horizon; year?: Horizon }
  error: string | null
  createdAt: string
}

export type Bias = 'Bullish' | 'Bearish' | 'Neutral'

export interface Horizon {
  probability: number
  bias: Bias
  rationale: string
}

export interface ArticleProps {
  title: string
  url: string
  source: string
  publishedAt: string | null
  snippet: string | null
}

export interface AnalysisPayload {
  id: number
  symbol: string
  status: AnalysisStatus
  stage?: string | null
  progress?: number
  error: string | null
  createdAt: string
  sentiment?: { bullish: number; bearish: number; neutral: number }
  horizons?: { week?: Horizon; month?: Horizon; year?: Horizon }
  catalysts?: string[]
  articles?: ArticleProps[]
  summary?: string | null
  completedAt?: string | null
}
