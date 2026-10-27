import { StudyBookScreen } from '../../../components/study/StudyScreens'

export default function StudyBookPage({ params }: { params: { book: string } }) {
  return <StudyBookScreen slug={params.book} />
}
