import type { Metadata } from 'next'
import { StudyLandingScreen } from '../../components/study/StudyScreens'

export const metadata: Metadata = {
  title: 'Study | Bethel Torah India',
  description: 'Explore Noahide teachings and Jewish ethical works in English and Telugu.',
}

export default function StudyPage() {
  return <StudyLandingScreen />
}
