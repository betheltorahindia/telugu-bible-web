export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { hasSupabaseEnv, createSupabaseRouteHandlerClient } from '../../../../lib/supabase/server'
import { getPresenterBootstrap } from '../../../../lib/presenter/queries'

export async function GET() {
  if (!hasSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
  }

  const supabase = createSupabaseRouteHandlerClient()
  const bootstrap = await getPresenterBootstrap(supabase)

  if (!bootstrap) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  return NextResponse.json(bootstrap)
}




