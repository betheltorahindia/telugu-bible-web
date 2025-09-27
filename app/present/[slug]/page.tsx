import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient, hasSupabaseEnv } from '../../../lib/supabase/server'
import { getProjectMetaBySlug } from '../../../lib/presenter/queries'
import { normalizeTheme } from '../../../lib/presenter/theme'
import { PublicPresenter } from '../../../components/presenter/PublicPresenter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  if (!hasSupabaseEnv) {
    return {
      title: 'Verse Presenter',
      robots: { index: false, follow: false },
    }
  }

  const supabase = createSupabaseServerClient()
  const meta = await getProjectMetaBySlug(params.slug, supabase)

  if (!meta) {
    return {
      title: 'Presenter not found',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${meta.title} — Verse Presenter`,
    description: 'Fullscreen verse presentation playlist.',
    robots: { index: false, follow: false },
  }
}

export default async function PresentPage({ params }: { params: { slug: string } }) {
  if (!hasSupabaseEnv) {
    notFound()
  }

  const supabase = createSupabaseServerClient()
  const meta = await getProjectMetaBySlug(params.slug, supabase)

  if (!meta) {
    notFound()
  }

  const settings = normalizeTheme(meta.settings)

  return (
    <PublicPresenter
      initialMeta={{
        id: meta.id,
        slug: meta.slug,
        title: meta.title,
        settings,
      }}
    />
  )
}
