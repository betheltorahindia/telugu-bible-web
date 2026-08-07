import type { Metadata } from 'next'
import './social.css'
import SocialWorld from './SocialWorld'
import Footer from '../../components/footer'
import { scrapeYouTubeVideos, fetchSpotifyShows } from '../../lib/social/social.server'

export const revalidate = 1800 // refresh feeds every 30 minutes

export const metadata: Metadata = {
  title: 'Social — Teachings & Podcasts',
  description:
    'Watch the latest BethEl Torah India YouTube teachings and listen to every Spotify podcast show in one place.',
  openGraph: {
    title: 'Social — Teachings & Podcasts',
    description: 'Latest YouTube teachings and Spotify podcasts from BethEl Torah India.',
    type: 'website',
  },
}

export default async function SocialPage() {
  const [videos, shows] = await Promise.all([
    scrapeYouTubeVideos(10).catch(() => []),
    fetchSpotifyShows().catch(() => []),
  ])

  return (
    <>
      <SocialWorld videos={videos} shows={shows} />
      <Footer />
    </>
  )
}
