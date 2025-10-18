import { type Metadata } from 'next'
import PresenterClientWrapper from '../../components/presenter/PresenterClientWrapper'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Verse Presenter',
  description: 'Build and share fullscreen verse playlists for projection.',
}

export default function PresenterPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PresenterClientWrapper />
    </div>
  )
}
