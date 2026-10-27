import { PrayerScreen } from '../../../components/prayers/PrayerScreens'

export default function PrayerPage({ params }: { params: { prayer: string } }) {
  return <PrayerScreen slug={params.prayer} />
}
