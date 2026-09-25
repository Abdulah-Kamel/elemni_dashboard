// Teacher-facing course-test contract. The backend owns validation, scoring and
// every number shown here; the dashboard renders what it receives.

export type QuestionType = "single" | "multi" | "true_false" | "short_answer" | "essay" | "ordering" | "matching"

export type Option = { id: string; text: string }

export type AnswerKey =
  | { option_id?: string } // single, true_false
  | { option_ids?: string[] } // multi, ordering (correct order)
  | { accepted?: string[]; case_sensitive?: boolean } // short_answer
  | { matches?: Record<string, string>; right_options?: Option[] } // matching (options = left side)
  | { model_answer?: string; rubric?: { criterion: string; points: number }[]; word_limit?: number | null } // essay

export type TestQuestion = {
  id: number
  position: number
  type: QuestionType
  text: string
  code_snippet: string | null
  image_url: string | null
  points: number
  options: Option[]
  answer_key: AnswerKey
  explanation: string | null
  shuffle_options: boolean
  topic_ref: number | null
  bank_question_id: number | null
}

export type QuestionInput = Omit<TestQuestion, "id" | "bank_question_id"> & { save_to_bank?: boolean }

export type TestStatus = "draft" | "published" | "archived"
export type GradingPolicy = "highest" | "last" | "average"
export type ShowCorrectAnswers = "never" | "after_submit" | "after_pass_or_exhausted"
export type Prerequisite = "none" | "previous_item" | "pass_tests"

export type TestSettings = {
  lesson_id: number | null
  position: number
  placement: "standalone_item" | "inside_item"
  parent_item_id: number | null
  title: string
  description: string | null
  time_limit_minutes: number | null
  max_attempts: number | null
  grading_policy: GradingPolicy
  cooldown_minutes: number
  pass_percent: number
  complete_item_on_pass_only: boolean
  notify_teacher_on_attempts_exhausted: boolean
  prerequisite: Prerequisite
  prerequisite_ids: number[]
  opens_at: string | null
  closes_at: string | null
  shuffle_questions: boolean
  allow_back_navigation: boolean
  random_pool_size: number | null
  show_correct_answers: ShowCorrectAnswers
  show_score_immediately: boolean
}

export type CourseTest = TestSettings & {
  id: number
  course_id: number
  status: TestStatus
  question_count: number
  total_points: number
  questions: TestQuestion[]
  /** Number of attempts started by students; > 0 means edits only affect new attempts. */
  attempt_count: number
  submission_count: number
  pending_grading_count: number
  updated_at: string
}

export type CourseTestRow = Omit<CourseTest, "questions"> & {
  placement_label: string | null
  average_percent: number | null
}

export type TestStats = {
  published_tests: number
  draft_tests: number
  scheduled_tests: number
  pending_grading: number
  average_score: number | null
  pass_rate: number | null
}

export type PublishIssue = { code: string; message: string; question_id?: number }

export type BankQuestion = TestQuestion & { course_id: number | null; used_in_tests: number }

export type ExcelRowError = { row: number; errors: string[] }
export type ExcelImportPreview = { valid: QuestionInput[]; errors: ExcelRowError[] }

export type GradingQueueItem = {
  answer_id: number
  attempt_id: number
  attempt_number: number
  status: "pending" | "graded"
  submitted_at: string
  student: { id: number; name: string; initials: string }
  test: { id: number; title: string; course_id: number; pass_percent: number }
  question: TestQuestion
  response: string | null
  feedback: string | null
  points_awarded: number | null
  /** Points already earned on the rest of the attempt (auto + other graded essays). */
  score_rest: number
  max_score: number
  remaining_essays_in_attempt: number
}

export type GradeResult = {
  attempt_id: number
  attempt_status: "pending_grading" | "graded"
  score_total: number | null
  max_score: number
  percent: number | null
  passed: boolean | null
}

/** The course's items, used by placement / prerequisite / topic pickers. */
export type CourseItemOption = { id: number; title: string; kind: "video" | "file" | "test"; lesson_id: number; lesson_title: string }

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; issues?: PublishIssue[] }
