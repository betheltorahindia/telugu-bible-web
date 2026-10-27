import type { Metadata } from 'next'
import { PrayersLandingScreen } from '../../components/prayers/PrayerScreens'

export const metadata: Metadata = {
  title: 'Prayers | Bethel Torah India',
  description: 'Explore daily prayers with Telugu translations and transliterations where available.',
}

export default function PrayersPage() {
  return <PrayersLandingScreen />
}
