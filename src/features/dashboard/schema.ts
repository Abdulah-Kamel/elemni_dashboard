import { z } from "zod";

export const statTrendSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("up"), value: z.number() }),
  z.object({ kind: z.literal("stable") }),
  z.object({ kind: z.literal("new"), count: z.number().int().nonnegative() }),
]);
export type StatTrend = z.infer<typeof statTrendSchema>;

export const overviewStatSchema = z.object({
  id: z.enum(["revenue", "students", "rating", "courses"]),
  label: z.string(),
  value: z.number(),
  trend: statTrendSchema,
  bars: z.array(z.number().nonnegative()),
});
export type OverviewStat = z.infer<typeof overviewStatSchema>;

export const monthlyEarningSchema = z.object({
  label: z.string(),
  value: z.number().nonnegative(),
});
export type MonthlyEarning = z.infer<typeof monthlyEarningSchema>;

export const topCourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  students: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  revenue: z.number().nonnegative(),
  thumbnail: z.string(),
});
export type TopCourse = z.infer<typeof topCourseSchema>;

export const studentActivityStatusSchema = z.enum(["success", "pending"]);
export type StudentActivityStatus = z.infer<typeof studentActivityStatusSchema>;

export const studentActivityActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("completed_lesson"), n: z.number().int().positive() }),
  z.object({ kind: z.literal("submitted_assignment") }),
  z.object({ kind: z.literal("enrolled") }),
]);
export type StudentActivityAction = z.infer<typeof studentActivityActionSchema>;

export const studentActivityTimeSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("minutes"), n: z.number().int().positive() }),
  z.object({ unit: z.literal("hours"), n: z.number().int().positive() }),
  z.object({ unit: z.literal("days"), n: z.number().int().positive() }),
]);
export type StudentActivityTime = z.infer<typeof studentActivityTimeSchema>;

export const studentActivitySchema = z.object({
  id: z.string(),
  studentName: z.string(),
  studentInitials: z.string().length(2),
  studentTint: z.enum(["violet", "amber", "emerald", "rose"]),
  action: studentActivityActionSchema,
  course: z.string(),
  status: studentActivityStatusSchema,
  time: studentActivityTimeSchema,
});
export type StudentActivity = z.infer<typeof studentActivitySchema>;

export const overviewDataSchema = z.object({
  teacherName: z.string(),
  teacherFirstName: z.string(),
  stats: z.array(overviewStatSchema).length(4),
  performance: z.array(monthlyEarningSchema).length(6),
  topCourses: z.array(topCourseSchema).length(3),
  activity: z.array(studentActivitySchema),
});
export type OverviewData = z.infer<typeof overviewDataSchema>;
