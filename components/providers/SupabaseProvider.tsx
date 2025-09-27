'use client'

import React, { useState } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '../../lib/supabase/client'
type SupabaseProviderProps = {
  children: React.ReactNode
  initialSession: Session | null
}

export function SupabaseProvider({ children, initialSession }: SupabaseProviderProps) {
  const [supabase] = useState(() => createSupabaseBrowserClient())

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  )
}

