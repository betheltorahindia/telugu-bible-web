import { type Metadata } from 'next'
import { createSupabaseServerClient, hasSupabaseEnv } from '../../lib/supabase/server'
import { getPresenterBootstrap } from '../../lib/presenter/queries'
import { PresenterBuilder } from '../../components/presenter/PresenterBuilder'
import { EmailAuthForm } from '../../components/auth/EmailAuthForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Verse Presenter',
  description: 'Build and share fullscreen verse playlists for projection.',
}

export default async function PresenterPage() {
  if (!hasSupabaseEnv) {
    return (
      <div className="max-w-2xl mx-auto card space-y-2">
        <h1 className="text-2xl font-bold">Verse Presenter</h1>
        <p className="text-neutral-700 dark:text-neutral-300">
          Supabase environment variables are not configured. Add your Supabase URL and keys to `.env.local` to enable
          the presenter builder.
        </p>
      </div>
    )
  }

  const supabase = createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card space-y-2">
          <h1 className="text-2xl font-bold">Verse Presenter</h1>
          <p className="text-neutral-700 dark:text-neutral-300">
            Sign in to build playlists of verses, customise gradients, and project them fullscreen.
          </p>
        </div>
        <EmailAuthForm redirectTo="/presenter" />
      </div>
    )
  }

  const bootstrap = await getPresenterBootstrap(supabase)

  return <PresenterBuilder bootstrap={bootstrap} />
}

