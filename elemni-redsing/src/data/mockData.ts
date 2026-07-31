import { Student, VideoItem, Course, PlayerSettings, NotificationItem } from '../types';

export const initialStudents: Student[] = [
  {
    id: '1',
    name: 'أحمد محمود',
    email: 'ahmed@example.com',
    avatarLetter: 'أ',
    avatarBg: 'bg-[#1e3a8a] text-[#90a8ff]',
    course: 'هندسة البرمجيات المتقدمة',
    enrollmentDate: '12 أكتوبر 2023',
    progress: 75,
    status: 'نشط',
    accessType: 'وصول كامل مدى الحياة'
  },
  {
    id: '2',
    name: 'سارة الكندري',
    email: 'sara.k@example.com',
    avatarLetter: 'س',
    avatarBg: 'bg-[#ffddb8] text-[#2a1700]',
    course: 'أساسيات التصميم الجرافيكي',
    enrollmentDate: '05 نوفمبر 2023',
    progress: 100,
    status: 'مكتمل',
    accessType: 'وصول كامل مدى الحياة'
  },
  {
    id: '3',
    name: 'خالد العتيبي',
    email: 'khaled.o@example.com',
    avatarLetter: 'خ',
    avatarBg: 'bg-[#e0e3e5] text-[#444651]',
    course: 'تطوير تطبيقات الجوال',
    enrollmentDate: '20 سبتمبر 2023',
    progress: 15,
    status: 'محظور',
    accessType: 'عرض فقط (بدون تحميلات)'
  },
  {
    id: '4',
    name: 'نورة الجاسم',
    email: 'noura.j@example.com',
    avatarLetter: 'ن',
    avatarBg: 'bg-[#dbe1ff] text-[#00174b]',
    course: 'إدارة المشاريع الرقمية',
    enrollmentDate: '01 ديسمبر 2023',
    progress: 42,
    status: 'نشط',
    accessType: 'وصول مؤقت (6 أشهر)'
  },
  {
    id: '5',
    name: 'أحمد محمد',
    email: 'a.mohamed@example.com',
    avatarLetter: 'أ',
    avatarBg: 'bg-[#dce1ff] text-[#00164e]',
    course: 'تطوير تطبيقات الويب',
    enrollmentDate: '12 أكتوبر 2023',
    progress: 85,
    status: 'نشط',
    accessType: 'وصول كامل مدى الحياة'
  },
  {
    id: '6',
    name: 'سارة خالد',
    email: 'sara.kh@example.com',
    avatarLetter: 'س',
    avatarBg: 'bg-[#ffddb8] text-[#653e00]',
    course: 'أساسيات التصميم',
    enrollmentDate: '11 أكتوبر 2023',
    progress: 32,
    status: 'نشط',
    accessType: 'وصول كامل مدى الحياة'
  },
  {
    id: '7',
    name: 'خالد اليوسف',
    email: 'khaled.y@example.com',
    avatarLetter: 'خ',
    avatarBg: 'bg-[#dce1ff] text-[#00164e]',
    course: 'التسويق الرقمي',
    enrollmentDate: '10 أكتوبر 2023',
    progress: 0,
    status: 'نشط',
    accessType: 'وصول مؤقت (3 أشهر)'
  }
];

export const initialVideoItems: VideoItem[] = [
  {
    id: 'v1',
    title: 'مقدمة في البرمجة باللغة العربية',
    timeAgo: 'منذ ساعتين',
    status: 'جاهز',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBfOTKuhZftdqLaAwsYQy-z-taL0ywXM_gvsQ4wv75j2sfhNDnm6TLU-jBF6p_UjvsN-sacJ0OsjbozwCggi2nwlqlppWOvb0lWY7gqrBATWIZq0PFjaccQB_ob8IabcEjRQNstPuoQP-uj16ZHhAlAmxZ79iE8jXY3clhmfuo_jH0nlRgl9lQTicdYp2-xKpVAjDVxIkpxsDdBxOuDtN6YL9jk7NFToEFXIy-KFtUdAWjiMYAtD86q9P6D-H44FVKpHxsh6m1Vjc'
  },
  {
    id: 'v2',
    title: 'أساسيات تصميم واجهة المستخدم',
    timeAgo: 'جاري المعالجة...',
    status: 'جاري المعالجة',
    progress: 68,
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmmd7ghcBr9IeTUfofNOQCv9bN_yPzE3OZe0tQcEt3m03ikjMUjqm0AXEicFx7r2CIfBoZqc_Rz7uKU_xOrydVcZp5llPxHpSDPH9jMRKKAxyT3xGQjSzSAE0g8Xi9Asq12mi26zG673Bw5VxSwWoO9rIfvmzMMc0Uz8PxhkMug33GdJKVoCZzglNWI0SaPG5EPwt0pxkcOMUT9roUJL6MrPqzGqqAj6AJtSJUGvo4kMTMOTS2CFqubiM9KgozL-rJqiSBEGl5e7c'
  },
  {
    id: 'v3',
    title: 'إدارة قواعد البيانات المتقدمة',
    timeAgo: 'منذ 5 ساعات',
    status: 'تم الرفع',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZWkc8pJ3Z5zNU63bzIMf5PSECEicwJmk1zyRECS0S2kwRiR9DMu0LRgUIlxe5xw73Oy5Mcj73Pu8v24LSnErRrabunm7LMrlkllSztnSINC4-eQA4K_435AUFou3cf3vktyen7pEcaYYzGyvzuBVktJypzE2JDoW3r9dGI4TgNp2gR1GQ-IWXDAgaTfmXlkrl6wDKtxU6hjeK-DPzaXe174Jij_lYjzVKqLlJns67jwQjXPlr52EINY2vXGnozEE456mi1UHHZDo'
  }
];

export const initialCourses: Course[] = [
  {
    id: 'c1',
    title: 'مقدمة في علوم الحاسب',
    studentsCount: 1240,
    price: 299,
    currency: 'ر.س',
    status: 'منشور',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_V78nXoFKE-p9ElnWmJOq0lJ-0kr2S3JI7IrzsQL7XOOrG3UxCTeFEkdvp8Tmgh-0JLpGM4VZEVNnARSIi7ifrITUDr6NxyWQaKy-plk2HvukUKR8didVIWPXMr_fNO-81T4u2wc3q_0OAUo31ksTKNcpMR8vLZejC5LuYwVYR5MrXl3ZzENCJ2zcs08qcyFhBNUkIsoeGaTgI8HsrisrOhrRWHpEql71wnJuIDh_362kAyKhlVeoadz-xgesUoAePzBdnkveH8A',
    videoCount: 24,
    storageSizeGb: 45.2,
    bandwidthConsumedTb: 0.6,
    sections: [
      {
        id: 'sec1',
        title: 'المقدمة والأساسيات',
        lessons: [
          { id: 'les1', title: 'ترحيب بالطلاب', duration: '05:30', completed: true },
          { id: 'les2', title: 'ماذا ستتعلم في هذه الدورة؟', duration: '12:15', completed: false }
        ]
      },
      {
        id: 'sec2',
        title: 'الفصل الأول: الخوارزميات',
        lessons: [
          { id: 'les3', title: 'مفهوم الخوارزمية وتدفق البيانات', duration: '18:40', completed: false }
        ]
      }
    ]
  },
  {
    id: 'c2',
    title: 'الرياضيات المتقدمة والتحليلية',
    studentsCount: 0,
    price: 150,
    currency: 'ر.س',
    status: 'مسودة',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAL9Y5_ZrliqhcskS-DOwc7X-pI3yL0lP_2iEdDGTUSnhqMmS4hSmQECFBIa3kj8C7-xOet4Kv6lQMpXUUBHg9DO4_JsLtviYRpnsXe3Kt7WoZOEEpAEixDMeVB_eqo5NGdM6rZ-f7NZzmzktFeda0W914ytht5v39488Fjkmu8q2xaAj03MByAEHgAjNuLUrQOmsv0SCWwTFfHgH-IIahxzSlgF11NyiAELXwZTLIEA-5EZWsYoVzg2uDLuON8jBZsB2CVAYE8570',
    videoCount: 15,
    storageSizeGb: 28.0,
    bandwidthConsumedTb: 0.1,
    sections: [
      {
        id: 'sec21',
        title: 'أساسيات التحليل الرقمي',
        lessons: [
          { id: 'les21', title: 'مقدمة في الجبر الخطي', duration: '15:00', completed: false }
        ]
      }
    ]
  },
  {
    id: 'c3',
    title: 'أساسيات لغة بايثون للذكاء الاصطناعي',
    studentsCount: 980,
    price: 350,
    currency: 'ر.س',
    status: 'منشور',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBfOTKuhZftdqLaAwsYQy-z-taL0ywXM_gvsQ4wv75j2sfhNDnm6TLU-jBF6p_UjvsN-sacJ0OsjbozwCggi2nwlqlppWOvb0lWY7gqrBATWIZq0PFjaccQB_ob8IabcEjRQNstPuoQP-uj16ZHhAlAmxZ79iE8jXY3clhmfuo_jH0nlRgl9lQTicdYp2-xKpVAjDVxIkpxsDdBxOuDtN6YL9jk7NFToEFXIy-KFtUdAWjiMYAtD86q9P6D-H44FVKpHxsh6m1Vjc',
    videoCount: 42,
    storageSizeGb: 128.5,
    bandwidthConsumedTb: 1.2
  },
  {
    id: 'c4',
    title: 'تصميم واجهات المستخدم الحديثة',
    studentsCount: 750,
    price: 220,
    currency: 'ر.س',
    status: 'منشور',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmmd7ghcBr9IeTUfofNOQCv9bN_yPzE3OZe0tQcEt3m03ikjMUjqm0AXEicFx7r2CIfBoZqc_Rz7uKU_xOrydVcZp5llPxHpSDPH9jMRKKAxyT3xGQjSzSAE0g8Xi9Asq12mi26zG673Bw5VxSwWoO9rIfvmzMMc0Uz8PxhkMug33GdJKVoCZzglNWI0SaPG5EPwt0pxkcOMUT9roUJL6MrPqzGqqAj6AJtSJUGvo4kMTMOTS2CFqubiM9KgozL-rJqiSBEGl5e7c',
    videoCount: 28,
    storageSizeGb: 84.2,
    bandwidthConsumedTb: 0.84
  },
  {
    id: 'c5',
    title: 'هيكلة قواعد البيانات العملاقة',
    studentsCount: 510,
    price: 400,
    currency: 'ر.س',
    status: 'منشور',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZWkc8pJ3Z5zNU63bzIMf5PSECEicwJmk1zyRECS0S2kwRiR9DMu0LRgUIlxe5xw73Oy5Mcj73Pu8v24LSnErRrabunm7LMrlkllSztnSINC4-eQA4K_435AUFou3cf3vktyen7pEcaYYzGyvzuBVktJypzE2JDoW3r9dGI4TgNp2gR1GQ-IWXDAgaTfmXlkrl6wDKtxU6hjeK-DPzaXe174Jij_lYjzVKqLlJns67jwQjXPlr52EINY2vXGnozEE456mi1UHHZDo',
    videoCount: 56,
    storageSizeGb: 210.0,
    bandwidthConsumedTb: 1.8
  },
  {
    id: 'c6',
    title: 'مقدمة في الأمن السيبراني',
    studentsCount: 0,
    price: 180,
    currency: 'ر.س',
    status: 'مسودة',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGv7meO_NyVROz9gOgbUXKLUQ0sEmbWYjzQUVgzFw3HlHLdrcDeBIG-lEnTns4GLJrCsyr1NpOLtcsVG4tmrvT-OrIi8KfmnPaZyy6D328k_gLLgaLA4fFUBlhkE229-Ur3QOd8Bqp1srN01yaiHmACEK2Aj0cUbBiucNmT11qBsHXOXZdUOrNvUKzvtqN-VEWnITCHoYXDx-INWBMQoyHxZ50JShj1a5CPYm0DVHEQexNELVowB7UZo0Cxv-PVR2GaKTAdHWWufE',
    videoCount: 12,
    storageSizeGb: 32.1,
    bandwidthConsumedTb: 0.15
  }
];

export const initialPlayerSettings: PlayerSettings = {
  watermarkEnabled: true,
  allowPdfDownload: false,
  whitelistedDomains: 'example.com, elemni.edu',
  primaryColor: '#00236f',
  logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzSSfOnE9XSe6vrmIJgNNCoEFmkHJaHqnD-1Y9qtUN-UWA8omS4dC96Eu3VpmN5QXkXdz9BlF6LpeufS10q5EqXQZC9tjYdXjN6nFy3z0A2HwNTE-l_D7XnRF26o74P8ftmNojt2Ks7dXDYjKn70Jqu1FYIu8iGSAkaxBWUacSR_Aw_i_ARgjwOqpP0OXdwB7D9Rwb2LrDHSJMkd65jydndwVygBlmcQ7T0JqAPhFX8Ij9SFkrB5xenFAs1dWTPDInVjWjsNIovjE'
};

export const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'تم تسجيل 3 طلاب جدد في دورة "مقدمة في علوم الحاسب"',
    time: 'منذ 10 دقائق',
    read: false,
    type: 'enrollment'
  },
  {
    id: 'n2',
    title: 'طلب سحب رصيد $3,850 قيد المعالجة',
    time: 'منذ ساعتين',
    read: false,
    type: 'system'
  },
  {
    id: 'n3',
    title: 'وصل استهلاك التخزين إلى 74% من السعة المتاحة',
    time: 'منذ يوم واحد',
    read: true,
    type: 'storage'
  }
];
