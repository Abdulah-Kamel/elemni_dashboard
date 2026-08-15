import { setRequestLocale } from "next-intl/server"
import { StudentsList } from "@/features/admin/components/students-list"
export default async function StudentsPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; setRequestLocale(locale); return <StudentsList /> }
