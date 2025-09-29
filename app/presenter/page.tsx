import { type Metadata } from 'next'
import { PresenterBuilder } from '../../components/presenter/PresenterBuilder'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Verse Presenter',
  description: 'Build and share fullscreen verse playlists for projection.',
}

export default function PresenterPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PresenterBuilder />
    </div>
  )
}
