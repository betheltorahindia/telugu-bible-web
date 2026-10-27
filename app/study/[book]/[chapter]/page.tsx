import { StudyChapterScreen } from '../../../../components/study/StudyScreens'

export default function StudyChapterPage({
  params,
}: {
  params: { book: string; chapter: string }
}) {
  const chapterNumber = Number(params.chapter)
  return Number.isInteger(chapterNumber) && chapterNumber > 0
    ? <StudyChapterScreen slug={params.book} chapterNumber={chapterNumber} />
    : <StudyChapterScreen slug={params.book} chapterNumber={-1} />
}
