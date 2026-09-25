export type TestQuestion = {
  id: number;
  position: number;
  type: string;
  text: string;
  code_snippet: string | null;
  image_url: string | null;
  points: number;
  options: { id: string; text: string }[];
  answer_key: Record<string, unknown>;
  explanation: string | null;
  shuffle_options: boolean;
  topic_ref: number | null;
};

export type CourseTest = {
  id: number;
  course_id: number;
  lesson_id: number | null;
  position: number;
  placement: "standalone_item" | "inside_item";
  parent_item_id: number | null;
  title: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  time_limit_minutes: number | null;
  max_attempts: number | null;
  grading_policy: "highest" | "last" | "average";
  cooldown_minutes: number;
  pass_percent: number;
  complete_item_on_pass_only: boolean;
  notify_teacher_on_attempts_exhausted: boolean;
  prerequisite: string;
  prerequisite_ids: number[];
  opens_at: string | null;
  closes_at: string | null;
  shuffle_questions: boolean;
  allow_back_navigation: boolean;
  random_pool_size: number | null;
  show_correct_answers: string;
  show_score_immediately: boolean;
  question_count: number;
  total_points: number;
  questions: TestQuestion[];
};

export type TestStats = {
  published_tests: number;
  draft_tests: number;
  pending_grading: number;
  average_score: number | null;
  pass_rate: number | null;
};

export type GradingQueueItem = {
  answer_id: number;
  attempt_id: number;
  attempt_number: number;
  status: string;
  submitted_at: string | null;
  student: { id: number; name: string; initials: string };
  test: { id: number; title: string };
  question: TestQuestion;
  response: string | null;
  feedback: string | null;
  points_awarded: number | null;
  score_auto: number;
  max_score: number;
};
