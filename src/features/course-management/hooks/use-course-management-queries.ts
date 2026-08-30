"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import {
  createChapter as createChapterAction,
  deleteChapter as deleteChapterAction,
  listChapters as listChaptersAction,
  reorderChapters as reorderChaptersAction,
  updateChapter as updateChapterAction,
} from "@/features/course-management/chapters-actions"
import {
  createLesson as createLessonAction,
  deleteLesson as deleteLessonAction,
  listLessons as listLessonsAction,
  reorderLessons as reorderLessonsAction,
  updateLesson as updateLessonAction,
} from "@/features/course-management/lessons-actions"
import {
  createItem as createItemAction,
  deleteItem as deleteItemAction,
  listItems as listItemsAction,
  reorderItems as reorderItemsAction,
  updateItem as updateItemAction,
} from "@/features/course-management/items-actions"
import {
  createCourse as createCourseAction,
  getCourseAction,
  listCoursesAction,
  publishCourse as publishCourseAction,
  unpublishCourse as unpublishCourseAction,
  updateCourse as updateCourseAction,
} from "@/features/course-management/actions"
import type {
  ChapterCreate,
  ChapterOut,
  ChapterUpdate,
  ReorderItem,
} from "@/features/course-management/chapters-schema"
import type {
  LessonCreate,
  LessonOut,
  LessonUpdate,
} from "@/features/course-management/lessons-schema"
import type {
  ItemCreate,
  ItemOut,
  ItemUpdate,
} from "@/features/course-management/items-schema"
import type {
  CourseCreate,
  CourseUpdate,
} from "@/features/course-management/schema"
import type { CourseOut } from "@/features/shell/schema"
import { courseManagementKeys } from "@/features/course-management/query-keys"
import { unwrapActionResult } from "@/lib/query-action"

type CourseActionResult = Awaited<ReturnType<typeof updateCourseAction>>

function unwrapCourseResult(result: CourseActionResult): CourseOut {
  if (result.success) return result.course

  const error = new Error(result.error.message)
  Object.assign(error, result.error)
  throw error
}

function invalidate(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey })
}

function replaceEntity<T extends { id: number }>(
  current: T[] | undefined,
  updated: T,
): T[] | undefined {
  if (!current) return current
  return current.map((entity) => (entity.id === updated.id ? updated : entity))
}

function appendEntity<T extends { id: number }>(
  current: T[] | undefined,
  created: T,
): T[] {
  if (!current) return [created]
  return current.some((entity) => entity.id === created.id)
    ? current
    : [...current, created]
}

function removeEntity<T extends { id: number }>(
  current: T[] | undefined,
  id: number,
): T[] | undefined {
  return current?.filter((entity) => entity.id !== id)
}

export function useCoursesQuery(
  teacherProfileId: number,
  initialData?: CourseOut[],
  initialError?: string | null,
) {
  return useQuery({
    queryKey: courseManagementKeys.courses(teacherProfileId),
    queryFn: () => listCoursesAction(teacherProfileId),
    enabled: !initialError,
    ...(initialData !== undefined && !initialError ? { initialData } : {}),
  })
}

export function useCourseQuery(
  courseId: number,
  initialData?: CourseOut,
  enabled = true,
) {
  return useQuery({
    queryKey: courseManagementKeys.courseDetail(courseId),
    queryFn: () => getCourseAction(courseId),
    enabled,
    ...(initialData !== undefined ? { initialData } : {}),
  })
}

export function useCourseMutations(teacherProfileId: number) {
  const queryClient = useQueryClient()
  const listKey = courseManagementKeys.courses(teacherProfileId)

  const cacheCourse = (course: CourseOut) => {
    queryClient.setQueryData<CourseOut[]>(listKey, (current) => {
      if (!current) return current
      return current.some((item) => item.id === course.id)
        ? current.map((item) => (item.id === course.id ? course : item))
        : [...current, course]
    })
    queryClient.setQueryData(courseManagementKeys.courseDetail(course.id), course)
  }

  const invalidateCourse = async (course: CourseOut) => {
    cacheCourse(course)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: listKey }),
      queryClient.invalidateQueries({
        queryKey: courseManagementKeys.courseDetail(course.id),
      }),
    ])
  }

  const create = useMutation({
    mutationFn: async (data: CourseCreate) =>
      unwrapCourseResult(await createCourseAction(teacherProfileId, data)),
    onSuccess: (course) => invalidateCourse(course),
  })

  const update = useMutation({
    mutationFn: async ({
      courseId,
      data,
    }: {
      courseId: number
      data: CourseUpdate
    }) =>
      unwrapCourseResult(await updateCourseAction(courseId, teacherProfileId, data)),
    onSuccess: (course) => invalidateCourse(course),
  })

  const publish = useMutation({
    mutationFn: async (courseId: number) =>
      unwrapCourseResult(await publishCourseAction(courseId, teacherProfileId)),
    onSuccess: (course) => invalidateCourse(course),
  })

  const unpublish = useMutation({
    mutationFn: async (courseId: number) =>
      unwrapCourseResult(await unpublishCourseAction(courseId, teacherProfileId)),
    onSuccess: (course) => invalidateCourse(course),
  })

  return { create, update, publish, unpublish }
}

export function useChaptersQuery(
  courseId: number,
  initialData?: ChapterOut[],
  initialError?: string | null,
) {
  return useQuery({
    queryKey: courseManagementKeys.chapters(courseId),
    queryFn: async () =>
      unwrapActionResult(await listChaptersAction(courseId)),
    ...(initialData !== undefined && !initialError ? { initialData } : {}),
  })
}

export function useChapterMutations(courseId: number) {
  const queryClient = useQueryClient()
  const queryKey = courseManagementKeys.chapters(courseId)

  const create = useMutation({
    mutationFn: async (data: ChapterCreate) =>
      unwrapActionResult(await createChapterAction(courseId, data)),
    onSuccess: (chapter) => {
      queryClient.setQueryData<ChapterOut[]>(queryKey, (current) =>
        appendEntity(current, chapter),
      )
      return invalidate(queryClient, queryKey)
    },
  })

  const update = useMutation({
    mutationFn: async ({ chapterId, data }: { chapterId: number; data: ChapterUpdate }) =>
      unwrapActionResult(await updateChapterAction(courseId, chapterId, data)),
    onSuccess: (chapter) => {
      queryClient.setQueryData<ChapterOut[]>(queryKey, (current) =>
        replaceEntity(current, chapter),
      )
      return invalidate(queryClient, queryKey)
    },
  })

  const remove = useMutation({
    mutationFn: async (chapterId: number) =>
      unwrapActionResult(await deleteChapterAction(courseId, chapterId)),
    onSuccess: (_, chapterId) => {
      queryClient.setQueryData<ChapterOut[]>(queryKey, (current) =>
        removeEntity(current, chapterId),
      )
      return invalidate(queryClient, queryKey)
    },
  })

  const reorder = useMutation({
    mutationFn: async (items: ReorderItem[]) =>
      unwrapActionResult(await reorderChaptersAction(courseId, items)),
    onSuccess: (chapters) => {
      queryClient.setQueryData(queryKey, chapters)
      return invalidate(queryClient, queryKey)
    },
  })

  return { create, update, remove, reorder }
}

export function useLessonsQuery(
  courseId: number,
  chapterId?: number,
  initialData?: LessonOut[],
  initialError?: string | null,
) {
  return useQuery({
    queryKey: courseManagementKeys.lessons(courseId, chapterId),
    queryFn: async () =>
      unwrapActionResult(await listLessonsAction(courseId, chapterId)),
    ...(initialData !== undefined && !initialError ? { initialData } : {}),
  })
}

export function useLessonMutations(courseId: number, chapterId?: number) {
  const queryClient = useQueryClient()
  const queryKey = courseManagementKeys.lessons(courseId, chapterId)
  const queryRoot = courseManagementKeys.lessonsRoot(courseId)

  const create = useMutation({
    mutationFn: async (data: LessonCreate) =>
      unwrapActionResult(await createLessonAction(courseId, data, chapterId)),
    onSuccess: (lesson) => {
      queryClient.setQueryData<LessonOut[]>(queryKey, (current) =>
        appendEntity(current, lesson),
      )
      return invalidate(queryClient, queryRoot)
    },
  })

  const update = useMutation({
    mutationFn: async ({ lessonId, data }: { lessonId: number; data: LessonUpdate }) =>
      unwrapActionResult(await updateLessonAction(courseId, lessonId, data)),
    onSuccess: (lesson) => {
      queryClient.setQueriesData<LessonOut[]>(
        { queryKey: queryRoot },
        (current) => replaceEntity(current, lesson),
      )
      return invalidate(queryClient, queryRoot)
    },
  })

  const remove = useMutation({
    mutationFn: async (lessonId: number) =>
      unwrapActionResult(await deleteLessonAction(courseId, lessonId)),
    onSuccess: (_, lessonId) => {
      queryClient.setQueriesData<LessonOut[]>(
        { queryKey: queryRoot },
        (current) => removeEntity(current, lessonId),
      )
      return invalidate(queryClient, queryRoot)
    },
  })

  const reorder = useMutation({
    mutationFn: async (items: ReorderItem[]) =>
      unwrapActionResult(await reorderLessonsAction(courseId, items, chapterId)),
    onSuccess: (lessons) => {
      queryClient.setQueryData(queryKey, lessons)
      return invalidate(queryClient, queryRoot)
    },
  })

  return { create, update, remove, reorder }
}

function hasProcessingVideo(items: ItemOut[] | undefined): boolean {
  return Boolean(
    items?.some(
      (item) =>
        item.bunny_stream_id !== null &&
        item.bunny_stream_status !== "ready" &&
        item.bunny_stream_status !== "failed",
    ),
  )
}

export function itemsQueryOptions(courseId: number, lessonId: number) {
  return {
    queryKey: courseManagementKeys.items(courseId, lessonId),
    queryFn: async () =>
      unwrapActionResult(await listItemsAction(courseId, lessonId)),
    refetchInterval: (query: { state: { data: ItemOut[] | undefined } }) =>
      hasProcessingVideo(query.state.data) ? 10_000 : false,
  }
}

export function useItemsQuery(
  courseId: number,
  lessonId: number,
  initialData?: ItemOut[],
  initialError?: string | null,
) {
  return useQuery({
    ...itemsQueryOptions(courseId, lessonId),
    ...(initialData !== undefined && !initialError ? { initialData } : {}),
  })
}

export function useItemMutations(courseId: number, lessonId: number) {
  const queryClient = useQueryClient()
  const queryKey = courseManagementKeys.items(courseId, lessonId)
  const queryRoot = courseManagementKeys.itemsRoot(courseId)

  const create = useMutation({
    mutationFn: async (data: ItemCreate) =>
      unwrapActionResult(await createItemAction(courseId, lessonId, data)),
    onSuccess: (item) => {
      queryClient.setQueryData<ItemOut[]>(queryKey, (current) =>
        appendEntity(current, item),
      )
      return invalidate(queryClient, queryKey)
    },
  })

  const update = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: number; data: ItemUpdate }) =>
      unwrapActionResult(await updateItemAction(courseId, itemId, data)),
    onSuccess: (item) => {
      queryClient.setQueryData<ItemOut[]>(queryKey, (current) =>
        replaceEntity(current, item),
      )
      return invalidate(queryClient, queryRoot)
    },
  })

  const remove = useMutation({
    mutationFn: async (itemId: number) =>
      unwrapActionResult(await deleteItemAction(courseId, itemId, lessonId)),
    onSuccess: (_, itemId) => {
      queryClient.setQueryData<ItemOut[]>(queryKey, (current) =>
        removeEntity(current, itemId),
      )
      return invalidate(queryClient, queryRoot)
    },
  })

  const reorder = useMutation({
    mutationFn: async (items: ReorderItem[]) =>
      unwrapActionResult(await reorderItemsAction(courseId, lessonId, items)),
    onSuccess: (items) => {
      queryClient.setQueryData(queryKey, items)
      return invalidate(queryClient, queryKey)
    },
  })

  return { create, update, remove, reorder }
}

export { hasProcessingVideo }
