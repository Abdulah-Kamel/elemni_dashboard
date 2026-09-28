import { redirect } from "next/navigation"

export default async function LessonsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/courses`)
}
