export type TabType = 'overview' | 'courses' | 'students' | 'storage' | 'settings';

export interface Student {
  id: string;
  name: string;
  email: string;
  avatarLetter: string;
  avatarBg: string;
  course: string;
  enrollmentDate: string;
  progress: number;
  status: 'نشط' | 'مكتمل' | 'محظور';
  accessType?: 'وصول كامل مدى الحياة' | 'وصول مؤقت (3 أشهر)' | 'وصول مؤقت (6 أشهر)' | 'عرض فقط (بدون تحميلات)';
}

export interface VideoItem {
  id: string;
  title: string;
  timeAgo: string;
  status: 'جاهز' | 'جاري المعالجة' | 'تم الرفع';
  progress?: number;
  thumbnail: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration?: string;
  videoUrl?: string;
  completed?: boolean;
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  studentsCount: number;
  price: number;
  currency: string;
  status: 'منشور' | 'مسودة';
  image: string;
  videoCount: number;
  storageSizeGb: number;
  bandwidthConsumedTb: number;
  sections?: Section[];
}

export interface PlayerSettings {
  watermarkEnabled: boolean;
  allowPdfDownload: boolean;
  whitelistedDomains: string;
  primaryColor: string;
  logoUrl?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  read: boolean;
  type: 'enrollment' | 'system' | 'storage';
}
