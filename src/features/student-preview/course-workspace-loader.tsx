"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"
import type { CourseWorkspace as CourseWorkspaceType } from "./course-workspace"

const CourseWorkspace = dynamic(
  () => import("./course-workspace").then((module) => module.CourseWorkspace),
  { loading: () => <div className="min-h-96 animate-pulse rounded-2xl bg-muted" /> }
)

export function CourseWorkspaceLoader(props: ComponentProps<typeof CourseWorkspaceType>) {
  return <CourseWorkspace {...props} />
}
