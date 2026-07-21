"use client"

import { useLocale } from "next-intl"
import Link from "next/link"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type EditorToolbarProps = {
  courseTitle: string
  courseId: number
  chapterTitle?: string
  chapterId?: number
  locale?: string
  onEditChapter?: () => void
}

export function EditorToolbar({
  courseTitle,
  courseId,
  chapterTitle,
  chapterId,
  locale: localeProp,
  onEditChapter,
}: EditorToolbarProps) {
  const localeFromHook = useLocale()
  const locale = localeProp ?? localeFromHook

  return (
    <div className="flex items-center justify-between gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link
              href={`/${locale}/courses`}
              className="transition-colors hover:text-foreground"
            >
              Back to courses
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link
              href={`/${locale}/courses/${courseId}`}
              className="transition-colors hover:text-foreground"
            >
              {courseTitle}
            </Link>
          </BreadcrumbItem>
          {chapterTitle && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{chapterTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {chapterId != null && onEditChapter && (
        <Button variant="outline" size="sm" onClick={onEditChapter}>
          <Pencil className="size-4 rtl:rotate-180" />
          Edit Chapter
        </Button>
      )}
    </div>
  )
}
