import { PrayerSectionScreen } from '../../../../components/prayers/PrayerScreens'

export default function PrayerSectionPage({
  params,
}: {
  params: { prayer: string; section: string }
}) {
  return <PrayerSectionScreen slug={params.prayer} sectionSlug={params.section} />
}
