'use client'

import { useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'

type AuthMode = 'signin' | 'signup'

export function EmailAuthForm({ redirectTo }: { redirectTo?: string }) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
    setError(null)
    setMessage(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (!email || !password) {
        setError('Enter email and password')
        setLoading(false)
        return
      }

      const authPromise =
        mode === 'signup'
          ? supabase.auth.signUp({ email, password })
          : supabase.auth.signInWithPassword({ email, password })

      const { error: authError } = await authPromise

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (mode === 'signup') {
        setMessage('Check your inbox to confirm your account.')
        setLoading(false)
        return
      }

      router.refresh()
      if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Use your email and password. New accounts need email confirmation.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/90 dark:bg-neutral-900/80 px-3 py-2 text-base text-neutral-900 dark:text-neutral-50"
            required
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/90 dark:bg-neutral-900/80 px-3 py-2 text-base text-neutral-900 dark:text-neutral-50"
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
          />
        </label>
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}
        <button type="submit" className="btn w-full" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>
      <button type="button" onClick={toggleMode} className="text-sm link">
        {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}

