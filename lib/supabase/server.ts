import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type TypedSupabaseClient = SupabaseClient<Database>
export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

/**
 * Use this inside **Server Components** (read-only cookies).
 * Avoids Next.js error when Supabase tries to mutate cookies during render.
 */
export function createSupabaseServerComponentClient(): TypedSupabaseClient {
  if (!hasSupabaseEnv) throw new Error('Supabase environment variables are not configured')

  const cookieStore = cookies()
  return createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })
}

/**
 * Use this in **Route Handlers** (/app/api/**) or **Server Actions** only.
 * Here cookie mutation is allowed (login/logout, token refresh).
 */
export function createSupabaseRouteHandlerClient(): TypedSupabaseClient {
  if (!hasSupabaseEnv) throw new Error('Supabase environment variables are not configured')

  const cookieStore = cookies()
  return createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        cookieStore.set({ name, value, ...options })
      },
      remove: (name, options) => {
        cookieStore.set({ name, value: '', maxAge: 0, ...options })
      },
    },
  })
}

/** Convenience helper for route handlers that need a verified user. */
export async function requireServerUser(existingClient?: TypedSupabaseClient) {
  const supabase = existingClient ?? createSupabaseRouteHandlerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    const err = new Error('UNAUTHORIZED')
    ;(err as any).status = 401
    throw err
  }
  return { supabase, user: data.user }
}

/** Helper for Server Components: returns current user (or null) with a read-only client. */
export async function getServerUserForRSC() {
  const supabase = createSupabaseServerComponentClient()
  const { data, error } = await supabase.auth.getUser()
  return { supabase, user: data?.user ?? null, error }
}
