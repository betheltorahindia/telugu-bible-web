'use client'

import React, { useState } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { Session } from '@supabase/supabase-js'
import type { SupabaseBrowserClient } from '../../lib/supabase/client'
import { createSupabaseBrowserClient } from '../../lib/supabase/client'
type SupabaseProviderProps = {
  children: React.ReactNode
  initialSession: Session | null
}

export function SupabaseProvider({ children, initialSession }: SupabaseProviderProps) {
  // Use the shared browser client type exported from the central helper.
  // That keeps typing consistent across consumers without local casts.
  const [supabase] = useState<SupabaseBrowserClient>(() => createSupabaseBrowserClient())

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  )
}

