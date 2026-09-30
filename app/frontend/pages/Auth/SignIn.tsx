import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { Radar } from 'lucide-react'
import type { SharedProps } from '@/lib/types'

export default function SignIn() {
  const { props } = usePage<SharedProps & { errors?: Record<string, string> }>()
  const errors = (props as { errors?: Record<string, string> }).errors ?? {}
  const form = useForm({ email: '', password: '', remember: false })

  function submit(event: React.FormEvent) {
    event.preventDefault()
    form.transform((data) => ({
      user: { email: data.email, password: data.password, remember_me: data.remember },
    }))
    form.post('/users/sign_in')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <Head title="Sign in" />
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-6 flex items-center gap-2">
          <Radar className="h-6 w-6 text-emerald-400" />
          <div>
            <h1 className="text-base font-semibold">Market Sentinel</h1>
            <p className="text-xs text-slate-400">Sign in to your watchlist</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Email</span>
            <input
              type="email"
              value={form.data.email}
              onChange={(e) => form.setData('email', e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-400/50"
            />
            {errors.email && <span className="mt-1 block text-xs text-rose-300">{errors.email}</span>}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Password</span>
            <input
              type="password"
              value={form.data.password}
              onChange={(e) => form.setData('password', e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-400/50"
            />
          </label>

          <button
            type="submit"
            disabled={form.processing}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-400 disabled:opacity-50"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          No account?{' '}
          <Link href="/users/sign_up" className="text-emerald-300 hover:text-emerald-200">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
