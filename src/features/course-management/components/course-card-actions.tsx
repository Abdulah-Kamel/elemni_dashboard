"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pencil, MoreVertical } from "lucide-react"
import { EditCourseDialog } from "./edit-course-dialog"
import { PublishToggle } from "./publish-toggle"

export function CourseCardActions({
  courseId,
  isPublished,
  teacherProfileId,
}: {
  courseId: number
  isPublished: boolean
  teacherProfileId: number
}) {
  const t = useTranslations("courses")

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={t("more_options")}>
              <MoreVertical className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <EditCourseDialog
            courseId={courseId}
            teacherProfileId={teacherProfileId}
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="me-2 size-4 rtl:rotate-180" />
              {t("edit")}
            </DropdownMenuItem>
          </EditCourseDialog>
          <PublishToggle
            courseId={courseId}
            teacherProfileId={teacherProfileId}
            isPublished={isPublished}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
