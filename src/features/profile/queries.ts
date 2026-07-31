import "server-only";
import { teacherProfileSchema, type TeacherProfile } from "@/features/profile/schema";

const STATIC_PROFILE = {
  id: 1,
  name: "أ. مختار الحسيني",
  email: "m.alhusseini@scholarly.edu",
  slug: "mokhtar-al-husseini",
  phone_number: "+20 50 123 4567",
  description:
    "خبير في تدريس علوم اللغة العربية، البلاغة، والأدب الجاهلي والعباسي. أمتلك خبرة تمتد لأكثر من ١٥ عاماً في تطوير المناهج الأكاديمية وتقديم دورات متخصصة للطلاب الجامعيين والباحثين. أسعى دائماً لدمج التقنية الحديثة في تبسيط قواعد اللغة المعقدة.",
  img: null,
};

/**
 * Returns static profile data. Replace with apiFetch(endpoints.teachers.me, ...)
 * once the backend ships GET /api/v1/teachers/me.
 */
export async function getTeacherProfile(): Promise<TeacherProfile> {
  return teacherProfileSchema.parse(STATIC_PROFILE);
}
