import { cookies } from 'next/headers'
import {
  createServerComponentClient,
  createRouteHandlerClient,
  type SupabaseClient,
} from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

export type TypedSupabaseClient = SupabaseClient<Database>

let serviceRoleClient: SupabaseClient<Database> | null = null

export function createSupabaseServerClient() {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are not configured')
  }
  return createServerComponentClient<Database>({ cookies })
}

export function createSupabaseRouteHandlerClient() {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase environment variables are not configured')
  }
  return createRouteHandlerClient<Database>({ cookies })
}

export function createSupabaseServiceRoleClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Service role environment variables are not configured')
  }
  if (serviceRoleClient) {
    return serviceRoleClient
  }
  serviceRoleClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })
  return serviceRoleClient
}

