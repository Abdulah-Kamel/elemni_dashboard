import { z } from "zod"
import type {
  AnswerKey,
  BankQuestion,
  CourseItemOption,
  CourseTest,
  CourseTestRow,
  ExcelImportPreview,
  GradeResult,
  GradingQueueItem,
  PublishIssue,
  QuestionInput,
  TestQuestion,
  TestSettings,
  TestStats,
} from "./types"

// Response shapes are parsed at the API boundary (see ./actions.ts). Each
// schema is annotated with the hand-written contract type in ./types.ts so the
// two can't silently drift apart.

const id = z.number().int()
const isoDate = z.string()

export const optionSchema = z.object({ id: z.string(), text: z.string() })

export const questionTypeSchema = z.enum(["single", "multi", "true_false", "short_answer", "essay", "ordering", "matching"])

export const answerKeySchema: z.ZodType<AnswerKey> = z
  .object({
    option_id: z.string().optional(),
    option_ids: z.array(z.string()).optional(),
    accepted: z.array(z.string()).optional(),
    case_sensitive: z.boolean().optional(),
    matches: z.record(z.string(), z.string()).optional(),
    right_options: z.array(optionSchema).optional(),
    model_answer: z.string().optional(),
    rubric: z.array(z.object({ criterion: z.string(), points: z.number() })).optional(),
    word_limit: z.number().int().nullable().optional(),
  })
  .loose()

const questionFields = {
  position: z.number().int(),
  type: questionTypeSchema,
  text: z.string(),
  code_snippet: z.string().nullable(),
  image_url: z.string().nullable(),
  points: z.number().int(),
  options: z.array(optionSchema),
  answer_key: answerKeySchema,
  explanation: z.string().nullable(),
  shuffle_options: z.boolean(),
  topic_ref: id.nullable(),
}

export const testQuestionSchema: z.ZodType<TestQuestion> = z.object({
  ...questionFields,
  id,
  bank_question_id: id.nullable(),
})

export const bankQuestionSchema: z.ZodType<BankQuestion> = z.object({
  ...questionFields,
  id,
  bank_question_id: id.nullable(),
  course_id: id.nullable(),
  used_in_tests: z.number().int(),
})

const settingsFields = {
  lesson_id: id.nullable(),
  position: z.number().int(),
  placement: z.enum(["standalone_item", "inside_item"]),
  parent_item_id: id.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  time_limit_minutes: z.number().int().nullable(),
  max_attempts: z.number().int().nullable(),
  grading_policy: z.enum(["highest", "last", "average"]),
  cooldown_minutes: z.number().int(),
  pass_percent: z.number().int(),
  complete_item_on_pass_only: z.boolean(),
  notify_teacher_on_attempts_exhausted: z.boolean(),
  prerequisite: z.enum(["none", "previous_item", "pass_tests"]),
  prerequisite_ids: z.array(id),
  opens_at: isoDate.nullable(),
  closes_at: isoDate.nullable(),
  shuffle_questions: z.boolean(),
  allow_back_navigation: z.boolean(),
  random_pool_size: z.number().int().nullable(),
  show_correct_answers: z.enum(["never", "after_submit", "after_pass_or_exhausted"]),
  show_score_immediately: z.boolean(),
}

const testSummaryFields = {
  ...settingsFields,
  id,
  course_id: id,
  status: z.enum(["draft", "published", "archived"]),
  question_count: z.number().int(),
  total_points: z.number().int(),
  attempt_count: z.number().int(),
  submission_count: z.number().int(),
  pending_grading_count: z.number().int(),
  updated_at: isoDate,
}

export const courseTestSchema: z.ZodType<CourseTest> = z.object({
  ...testSummaryFields,
  questions: z.array(testQuestionSchema),
})

export const courseTestRowSchema: z.ZodType<CourseTestRow> = z.object({
  ...testSummaryFields,
  placement_label: z.string().nullable(),
  average_percent: z.number().nullable(),
})

export const testStatsSchema: z.ZodType<TestStats> = z.object({
  published_tests: z.number().int(),
  draft_tests: z.number().int(),
  scheduled_tests: z.number().int(),
  pending_grading: z.number().int(),
  average_score: z.number().nullable(),
  pass_rate: z.number().nullable(),
})

export const publishIssueSchema: z.ZodType<PublishIssue> = z.object({
  code: z.string(),
  message: z.string(),
  question_id: id.optional(),
})

/** Body of a 422 from POST /tests/:id/publish. */
export const publishErrorBodySchema = z.object({ issues: z.array(publishIssueSchema) })

export const courseItemOptionSchema: z.ZodType<CourseItemOption> = z.object({
  id,
  title: z.string(),
  kind: z.enum(["video", "file", "test"]),
  lesson_id: id,
  lesson_title: z.string(),
})

export const createdSchema = z.object({ id })

// ---------------------------------------------------------------------------
// Inputs (shape checks for fast feedback — the API revalidates everything)

export const questionInputSchema: z.ZodType<QuestionInput> = z.object({
  ...questionFields,
  points: z.number().int().min(1),
  text: z.string().max(5000),
  save_to_bank: z.boolean().optional(),
})

export const settingsInputSchema: z.ZodType<Partial<TestSettings>> = z.object(settingsFields).partial().strict()

export const excelImportPreviewSchema: z.ZodType<ExcelImportPreview> = z.object({
  valid: z.array(questionInputSchema),
  errors: z.array(z.object({ row: z.number().int(), errors: z.array(z.string()) })),
})

export const gradingQueueItemSchema: z.ZodType<GradingQueueItem> = z.object({
  answer_id: id,
  attempt_id: id,
  attempt_number: z.number().int(),
  status: z.enum(["pending", "graded"]),
  submitted_at: isoDate,
  student: z.object({ id, name: z.string(), initials: z.string() }),
  test: z.object({ id, title: z.string(), course_id: id, pass_percent: z.number().int() }),
  question: testQuestionSchema,
  response: z.string().nullable(),
  feedback: z.string().nullable(),
  points_awarded: z.number().int().nullable(),
  score_rest: z.number(),
  max_score: z.number(),
  remaining_essays_in_attempt: z.number().int(),
})

export const gradeResultSchema: z.ZodType<GradeResult> = z.object({
  attempt_id: id,
  attempt_status: z.enum(["pending_grading", "graded"]),
  score_total: z.number().nullable(),
  max_score: z.number(),
  percent: z.number().nullable(),
  passed: z.boolean().nullable(),
})

export const pendingCountSchema = z.object({ count: z.number().int().min(0) })

export const positiveId = z.number().int().positive()
export const gradeInputSchema = z.object({ answerId: positiveId, points: z.number().int().min(0), feedback: z.string().max(5000) })
export const queueQuerySchema = z
  .object({ testId: positiveId.optional(), status: z.enum(["pending", "graded"]).optional() })
  .optional()
export const bankQuerySchema = z.object({ courseId: positiveId.optional(), search: z.string().max(200).optional() }).optional()

// ---------------------------------------------------------------------------
// Excel import: allowed upload types and size (UX pre-check; API decides).

// Server Actions accept request bodies up to 1 MB by default (next.config has no
// serverActions.bodySizeLimit), so keep uploads safely below that.
export const EXCEL_MAX_BYTES = 900 * 1024
export const EXCEL_ACCEPT = ".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
