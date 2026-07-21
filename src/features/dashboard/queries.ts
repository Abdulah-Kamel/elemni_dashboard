import "server-only";
import { overviewDataSchema, type OverviewData } from "@/features/dashboard/schema";

/**
 * Server-side read for the teacher overview page. Until the backend ships
 * a `GET /api/v1/teacher/overview` endpoint, returns a typed sample dataset
 * that matches the new design.
 *
 * Replace the body with an `apiFetch("/api/v1/teacher/overview", ...)` call
 * when the endpoint is available — keep the schema as the contract.
 */
export async function getOverviewData(teacherName: string): Promise<OverviewData> {
  const firstName = teacherName.split(/\s+/)[0] ?? teacherName;

  const data: OverviewData = {
    teacherName,
    teacherFirstName: firstName,
    stats: [
      {
        id: "revenue",
        label: "",
        value: 24850,
        trend: { kind: "up", value: 12.5 },
        bars: [40, 55, 38, 70, 60, 80, 95],
      },
      {
        id: "students",
        label: "",
        value: 1284,
        trend: { kind: "up", value: 4.2 },
        bars: [30, 45, 35, 50, 42, 65, 88],
      },
      {
        id: "rating",
        label: "",
        value: 4.82,
        trend: { kind: "stable" },
        bars: [60, 70, 65, 78, 72, 85, 90],
      },
      {
        id: "courses",
        label: "",
        value: 12,
        trend: { kind: "new", count: 2 },
        bars: [25, 35, 30, 40, 50, 60, 70],
      },
    ],
    performance: [
      { label: "Jan", value: 4200 },
      { label: "Feb", value: 5800 },
      { label: "Mar", value: 8400 },
      { label: "Apr", value: 6100 },
      { label: "May", value: 7800 },
      { label: "Jun", value: 7200 },
    ],
    topCourses: [
      {
        id: "modern-ux",
        title: "Mastering Modern UX",
        students: 482,
        rating: 4.9,
        revenue: 12000,
        thumbnail: "🎨",
      },
      {
        id: "react-2024",
        title: "Advanced React 2024",
        students: 315,
        rating: 4.8,
        revenue: 8400,
        thumbnail: "💻",
      },
      {
        id: "finance",
        title: "Financial Management",
        students: 290,
        rating: 4.7,
        revenue: 4500,
        thumbnail: "📊",
      },
    ],
    activity: [
      {
        id: "1",
        studentName: "Jane Doe",
        studentInitials: "JD",
        studentTint: "violet",
        action: { kind: "completed_lesson", n: 4 },
        course: "Mastering Modern UX",
        status: "success",
        time: { unit: "minutes", n: 2 },
      },
      {
        id: "2",
        studentName: "Mike Ross",
        studentInitials: "MR",
        studentTint: "amber",
        action: { kind: "submitted_assignment" },
        course: "Advanced React 2024",
        status: "pending",
        time: { unit: "minutes", n: 15 },
      },
      {
        id: "3",
        studentName: "Sarah Hall",
        studentInitials: "SH",
        studentTint: "emerald",
        action: { kind: "enrolled" },
        course: "Financial Management",
        status: "success",
        time: { unit: "hours", n: 1 },
      },
    ],
  };

  return overviewDataSchema.parse(data);
}
