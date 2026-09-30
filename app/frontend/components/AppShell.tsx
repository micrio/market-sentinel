import { Link, router, usePage } from '@inertiajs/react'
import { Activity, LogOut, Radar } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SharedProps } from '@/lib/types'

export default function AppShell({ children }: { children: ReactNode }) {
  const { props } = usePage<SharedProps>()
  const flash = props.flash ?? {}
  const user = props.auth?.user ?? null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Radar className="h-5 w-5 text-emerald-400" />
            Market Sentinel
          </Link>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden items-center gap-1 sm:inline-flex">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              live
            </span>
            {user && <span className="hidden truncate sm:inline">{user.email}</span>}
            {props.auth?.signedIn && (
              <button
                type="button"
                onClick={() => router.delete('/users/sign_out')}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-slate-300 transition-colors hover:border-rose-400/40 hover:text-rose-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      {(flash.notice || flash.alert) && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          {flash.notice && (
            <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
              {flash.notice}
            </div>
          )}
          {flash.alert && (
            <div className="mt-2 rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {flash.alert}
            </div>
          )}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-4 text-center text-[11px] text-amber-300/80">
        Educational tool only. Not financial advice.
      </footer>
    </div>
  )
}
