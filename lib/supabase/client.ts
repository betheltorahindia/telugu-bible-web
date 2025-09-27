'use client'

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const fallbackUrl = 'http://127.0.0.1:54321'
const fallbackAnonKey = 'public-anon-key'

export type SupabaseBrowserClient = SupabaseClient<Database>

export function createSupabaseBrowserClient() {
  const url = supabaseUrl ?? fallbackUrl
  const key = supabaseAnonKey ?? fallbackAnonKey

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.warn('Supabase environment variables are not configured; using fallback localhost client.')
    }
  }

  return createPagesBrowserClient<Database>({
    supabaseUrl: url,
    supabaseKey: key,
  })
}
