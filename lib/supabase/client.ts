'use client'

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const fallbackUrl = 'http://127.0.0.1:54321'
const fallbackAnonKey = 'public-anon-key'

// The auth helper and other packages sometimes expect a SupabaseClient
// type with a different generic shape (number/order of generic params).
// Export a permissive alias that matches the shape used by the
// SessionContextProvider in this codebase so other modules can import
// and share the same central type.
export type SupabaseBrowserClient = SupabaseClient<any, 'public', 'public', any, any>

export function createSupabaseBrowserClient(): SupabaseBrowserClient {
  const url = supabaseUrl ?? fallbackUrl
  const key = supabaseAnonKey ?? fallbackAnonKey

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.warn('Supabase environment variables are not configured; using fallback localhost client.')
    }
  }

  // Create the client with the Database generic for runtime helpers, then
  // cast to the shared permissive browser client type exported above.
  return createPagesBrowserClient<Database>({
    supabaseUrl: url,
    supabaseKey: key,
  }) as unknown as SupabaseBrowserClient
}
