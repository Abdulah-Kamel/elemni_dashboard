import { describe, it, expect } from 'vitest';
import type { CourseFormValues, SubjectOut, GradeOut, StreamOut } from '@/features/course-management/schema';
import type { StudentPreviewSection } from '../types';
import { buildCoursePreviewModel } from '../build-course-preview-model';

const baseValues: CourseFormValues = {
  title: 'كورس الجبر',
  description: 'شرح شامل للجبر',
  price: '150.00',
  subjectId: 10,
  gradeId: 20,
  streamId: 30,
  useChapters: false,
};

const subjects: SubjectOut[] = [
  { id: 10, name: 'رياضيات', slug: 'math', grades: [], streams: [] },
];

const grades: GradeOut[] = [
  { id: 20, name: 'الصف الأول', level: '1' },
];

const streams: StreamOut[] = [
  { id: 30, name: 'علمي', slug: 'science' },
];

const teacher = { name: 'أحمد محمد', avatarUrl: 'https://cdn.example.com/avatar.jpg' };

const sections: StudentPreviewSection[] = [
  {
    id: 1,
    title: 'الفصل الأول',
    lessons: [],
  },
];

describe('buildCoursePreviewModel', () => {
  it('maps all fields correctly for a fully populated course', () => {
    const result = buildCoursePreviewModel({
      courseId: 42,
      values: baseValues,
      coverObjectUrl: null,
      publicCoverUrl: 'https://cdn.example.com/cover.jpg',
      teacher,
      subjects,
      grades,
      streams,
      sections,
    });

    expect(result.id).toBe(42);
    expect(result.title).toBe('كورس الجبر');
    expect(result.description).toBe('شرح شامل للجبر');
    expect(result.coverUrl).toBe('https://cdn.example.com/cover.jpg');
    expect(result.price).toBe('150.00');
    expect(result.subject).toBe('رياضيات');
    expect(result.grade).toBe('الصف الأول');
    expect(result.stream).toBe('علمي');
    expect(result.teacher).toEqual(teacher);
    expect(result.sections).toEqual(sections);
  });

  it('uses placeholder title when values.title is empty', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: { ...baseValues, title: '' },
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.title).toBe('عنوان الكورس');
  });

  it('uses placeholder description when values.description is null', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: { ...baseValues, description: null },
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.description).toBe('وصف الكورس');
  });

  it('uses placeholder description when values.description is empty string', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: { ...baseValues, description: '' },
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.description).toBe('وصف الكورس');
  });

  it('uses English placeholders for the English preview locale', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: { ...baseValues, title: '', description: null },
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
      locale: 'en',
    });
    expect(result.title).toBe('Course title');
    expect(result.description).toBe('Course description');
  });

  it('coverObjectUrl takes precedence over publicCoverUrl', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: baseValues,
      coverObjectUrl: 'blob:local-cover-url',
      publicCoverUrl: 'https://cdn.example.com/cover.jpg',
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.coverUrl).toBe('blob:local-cover-url');
  });

  it('falls back to publicCoverUrl when coverObjectUrl is null', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: baseValues,
      coverObjectUrl: null,
      publicCoverUrl: 'https://cdn.example.com/cover.jpg',
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.coverUrl).toBe('https://cdn.example.com/cover.jpg');
  });

  it('coverUrl is null when both are null', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: baseValues,
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.coverUrl).toBeNull();
  });

  it('uses "preview" as id when courseId is null', () => {
    const result = buildCoursePreviewModel({
      courseId: null,
      values: baseValues,
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.id).toBe('preview');
  });

  it('subject is null when subjectId not found in subjects array', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: { ...baseValues, subjectId: 999 },
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.subject).toBeNull();
  });

  it('grade is null when gradeId not found in grades array', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: { ...baseValues, gradeId: 999 },
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.grade).toBeNull();
  });

  it('stream is null when streamId not found in streams array', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: { ...baseValues, streamId: 999 },
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.stream).toBeNull();
  });

  it('passes sections through unchanged', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: baseValues,
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections,
    });
    expect(result.sections).toBe(sections);
  });

  it('teacher is null when not provided', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: baseValues,
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.teacher).toBeNull();
  });

  it('uses "0" as price fallback when price is empty', () => {
    const result = buildCoursePreviewModel({
      courseId: 1,
      values: { ...baseValues, price: '' as string },
      coverObjectUrl: null,
      publicCoverUrl: null,
      teacher: null,
      subjects,
      grades,
      streams,
      sections: [],
    });
    expect(result.price).toBe('0');
  });
});
