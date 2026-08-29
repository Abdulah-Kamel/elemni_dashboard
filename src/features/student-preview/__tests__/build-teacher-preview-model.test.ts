import { describe, it, expect } from 'vitest';
import type { TeacherProfile } from '@/features/profile/schema';
import type { CourseOut } from '@/features/shell/schema';
import { buildTeacherPreviewModel } from '../build-teacher-preview-model';

const baseProfile: TeacherProfile = {
  id: 1,
  name: 'أحمد محمد',
  slug: 'ahmed',
  email: 'ahmed@example.com',
  phone_number: null,
  description: 'مدرس متخصص في الرياضيات',
  location: 'القاهرة',
  experience: 5,
  img: null,
  subjects: [{ id: 10, name: 'رياضيات', slug: 'math', grades: [], streams: [] }],
  grades: [{ id: 20, name: 'الصف الأول', level: '1' }],
  streams: [{ id: 30, name: 'علمي', slug: 'science' }],
};

const baseCourse: CourseOut = {
  id: 100,
  title: 'كورس الجبر',
  description: 'شرح الجبر من الصفر',
  img: 'https://cdn.example.com/cover.jpg',
  price: '99.00',
  is_published: true,
  use_chapters: false,
  subject_id: 10,
  subject_name: 'رياضيات',
  teacher_profile_id: 1,
  grade_id: 20,
  stream_id: 30,
  created_by_id: null,
  created_at: '2024-01-01T00:00:00Z',
};

describe('buildTeacherPreviewModel', () => {
  it('maps all fields correctly for a fully populated profile', () => {
    const result = buildTeacherPreviewModel({
      profile: baseProfile,
      courses: [baseCourse],
      avatarObjectUrl: null,
      publicAvatarUrl: 'https://cdn.example.com/avatar.jpg',
    });

    expect(result.id).toBe(1);
    expect(result.name).toBe('أحمد محمد');
    expect(result.title).toBe('رياضيات');
    expect(result.subject).toBe('رياضيات');
    expect(result.subjects).toEqual(['رياضيات']);
    expect(result.grades).toEqual(['الصف الأول']);
    expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
    expect(result.experienceYears).toBe(5);
    expect(result.bio).toBe('مدرس متخصص في الرياضيات');
    expect(result.location).toBe('القاهرة');
  });

  it('maps course fields correctly', () => {
    const result = buildTeacherPreviewModel({
      profile: baseProfile,
      courses: [baseCourse],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });

    expect(result.courses).toHaveLength(1);
    const course = result.courses[0];
    expect(course.id).toBe(100);
    expect(course.title).toBe('كورس الجبر');
    expect(course.description).toBe('شرح الجبر من الصفر');
    expect(course.price).toBe('99.00');
    expect(course.duration).toBe('');
    expect(course.sessionsCount).toBe(0);
    expect(course.coverUrl).toBe('https://cdn.example.com/cover.jpg');
    expect(course.isSubscribed).toBe(false);
    expect(course.sections).toEqual([]);
  });

  it('uses placeholder name when profile.name is empty', () => {
    const result = buildTeacherPreviewModel({
      profile: { ...baseProfile, name: '' },
      courses: [],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.name).toBe('اسم المدرس');
  });

  it('uses placeholder bio when description is null', () => {
    const result = buildTeacherPreviewModel({
      profile: { ...baseProfile, description: null },
      courses: [],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.bio).toBe('نبذة عن المدرس');
  });

  it('uses placeholder bio when description is empty string', () => {
    const result = buildTeacherPreviewModel({
      profile: { ...baseProfile, description: '' },
      courses: [],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.bio).toBe('نبذة عن المدرس');
  });

  it('uses English placeholders for the English preview locale', () => {
    const result = buildTeacherPreviewModel({
      profile: { ...baseProfile, name: '', description: null, subjects: [] },
      courses: [{ ...baseCourse, title: '', description: null }],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
      locale: 'en',
    });
    expect(result.name).toBe('Teacher name');
    expect(result.bio).toBe('Teacher bio');
    expect(result.title).toBe('Teacher');
    expect(result.courses[0].title).toBe('Course title');
    expect(result.courses[0].description).toBe('Course description');
  });

  it('uses default title when no subjects', () => {
    const result = buildTeacherPreviewModel({
      profile: { ...baseProfile, subjects: [] },
      courses: [],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.title).toBe('مدرس');
    expect(result.subject).toBe('مدرس');
  });

  it('uses default experienceYears 0 when experience is null', () => {
    const result = buildTeacherPreviewModel({
      profile: { ...baseProfile, experience: null },
      courses: [],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.experienceYears).toBe(0);
  });

  it('avatarObjectUrl takes precedence over publicAvatarUrl', () => {
    const result = buildTeacherPreviewModel({
      profile: baseProfile,
      courses: [],
      avatarObjectUrl: 'blob:local-object-url',
      publicAvatarUrl: 'https://cdn.example.com/avatar.jpg',
    });
    expect(result.avatarUrl).toBe('blob:local-object-url');
  });

  it('falls back to publicAvatarUrl when avatarObjectUrl is null', () => {
    const result = buildTeacherPreviewModel({
      profile: baseProfile,
      courses: [],
      avatarObjectUrl: null,
      publicAvatarUrl: 'https://cdn.example.com/avatar.jpg',
    });
    expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
  });

  it('avatarUrl is null when both URLs are null', () => {
    const result = buildTeacherPreviewModel({
      profile: baseProfile,
      courses: [],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.avatarUrl).toBeNull();
  });

  it('uses placeholder course title when course title is empty', () => {
    const result = buildTeacherPreviewModel({
      profile: baseProfile,
      courses: [{ ...baseCourse, title: '' }],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.courses[0].title).toBe('عنوان الكورس');
  });

  it('uses placeholder course description when description is null', () => {
    const result = buildTeacherPreviewModel({
      profile: baseProfile,
      courses: [{ ...baseCourse, description: null }],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.courses[0].description).toBe('وصف الكورس');
  });

  it('uses empty price fallback when course price is empty', () => {
    const result = buildTeacherPreviewModel({
      profile: baseProfile,
      courses: [{ ...baseCourse, price: '' as string }],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.courses[0].price).toBe('0');
  });

  it('course coverUrl is null when course.img is undefined', () => {
    const result = buildTeacherPreviewModel({
      profile: baseProfile,
      courses: [{ ...baseCourse, img: undefined }],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.courses[0].coverUrl).toBeNull();
  });

  it('handles empty courses array', () => {
    const result = buildTeacherPreviewModel({
      profile: baseProfile,
      courses: [],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.courses).toEqual([]);
  });

  it('location is null when profile.location is null', () => {
    const result = buildTeacherPreviewModel({
      profile: { ...baseProfile, location: null },
      courses: [],
      avatarObjectUrl: null,
      publicAvatarUrl: null,
    });
    expect(result.location).toBeNull();
  });
});
