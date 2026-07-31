import React, { useState } from 'react';
import { Course, Lesson, Section } from '../../types';

interface CoursesViewProps {
  courses: Course[];
  onCreateCourseClick: () => void;
  onUpdateCourse: (updated: Course) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  onCreateCourseClick,
  onUpdateCourse
}) => {
  const [filterStatus, setFilterStatus] = useState<'الكل' | 'منشور' | 'مسودة'>('الكل');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ''
  );
  const [selectedLessonTitle, setSelectedLessonTitle] = useState<string>(
    'ماذا ستتعلم في هذه الدورة؟'
  );

  // Lesson Builder State
  const [isUploading, setIsUploading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(65);
  const [lessonDescription, setLessonDescription] = useState(
    'اكتب تفاصيل الدرس وما يجب على الطالب معرفته...'
  );

  // Attachments State
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([
    { name: 'دليل الخوارزميات.pdf', size: '2.4 ميجابايت' }
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCourse =
    courses.find((c) => c.id === selectedCourseId) || courses[0];

  const filteredCourses = courses.filter((c) => {
    if (filterStatus === 'منشور') return c.status === 'منشور';
    if (filterStatus === 'مسودة') return c.status === 'مسودة';
    return true;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddSection = () => {
    if (!activeCourse) return;
    const newSection: Section = {
      id: `sec_${Date.now()}`,
      title: `مقطع تعليمي جديد ${ (activeCourse.sections?.length || 0) + 1}`,
      lessons: [{ id: `les_${Date.now()}`, title: 'درس جديد' }]
    };
    const updated = {
      ...activeCourse,
      sections: [...(activeCourse.sections || []), newSection]
    };
    onUpdateCourse(updated);
    showToast('تمت إضافة المقطع الجديد بنجاح');
  };

  const handleAddLesson = (sectionId: string) => {
    if (!activeCourse) return;
    const updatedSections = (activeCourse.sections || []).map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          lessons: [
            ...sec.lessons,
            {
              id: `les_${Date.now()}`,
              title: `درس جديد ${sec.lessons.length + 1}`
            }
          ]
        };
      }
      return sec;
    });
    onUpdateCourse({ ...activeCourse, sections: updatedSections });
    showToast('تمت إضافة الدرس الجديد بنجاح');
  };

  const handleAddAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.zip';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setAttachments((prev) => [
          ...prev,
          { name: file.name, size: `${sizeMb} ميجابايت` }
        ]);
        showToast(`تم إرفاق الملف: ${file.name}`);
      }
    };
    input.click();
  };

  const handleDeleteAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    showToast('تم حذف المرفق');
  };

  const handleSimulateVideoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        setIsUploading(true);
        setUploadProgress(10);
        const interval = setInterval(() => {
          setUploadProgress((p) => {
            if (p >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              showToast('اكتمل رفع الفيديو بنجاح ✓');
              return 100;
            }
            return p + 20;
          });
        }, 300);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#00236f] text-white px-5 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Courses Grid Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#191c1e]">إدارة الدورات</h3>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'الكل' | 'منشور' | 'مسودة')}
              className="px-3 py-1.5 bg-white border border-[#c5c5d3] rounded-xl text-xs font-semibold text-[#444651] outline-hidden cursor-pointer"
            >
              <option value="الكل">جميع الحالات</option>
              <option value="منشور">منشور فقط</option>
              <option value="مسودة">مسودة فقط</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isSelected = course.id === selectedCourseId;
            return (
              <div
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all group cursor-pointer ${
                  isSelected ? 'border-2 border-[#00236f] ring-2 ring-[#00236f]/10' : 'border-[#c5c5d3]'
                }`}
              >
                <div className="h-44 w-full bg-[#e0e3e5] relative overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${course.image}')` }}
                  />
                  <div
                    className={`absolute top-3 right-3 text-white px-3 py-1 rounded-xl text-[11px] font-bold shadow-xs ${
                      course.status === 'منشور' ? 'bg-emerald-600' : 'bg-[#757682]'
                    }`}
                  >
                    {course.status}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-sm text-[#00236f] truncate">
                    {course.title}
                  </h4>
                  <div className="flex justify-between items-center text-[#444651] text-xs">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">group</span>
                      <span>{course.studentsCount} طالب</span>
                    </div>
                    <span className="font-bold text-[#0051d5] text-sm">
                      {course.price} {course.currency}
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4 flex gap-2 pt-2 border-t border-[#f2f4f6]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCourseId(course.id);
                      showToast(`تم تحديد دَورة: ${course.title}`);
                    }}
                    className="flex-1 py-1.5 border border-[#00236f] text-[#00236f] rounded-xl text-xs font-bold hover:bg-[#dce1ff] transition-colors cursor-pointer"
                  >
                    {course.status === 'منشور' ? 'تعديل المحتوى' : 'إكمال الإعداد'}
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-[#444651] hover:bg-[#eceef0] rounded-xl transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add New Course CTA Card */}
          <div
            onClick={onCreateCourseClick}
            className="border-2 border-dashed border-[#c5c5d3] rounded-2xl flex flex-col items-center justify-center p-8 hover:border-[#00236f] hover:bg-[#f2f4f6] transition-all cursor-pointer group h-[280px]"
          >
            <div className="h-14 w-14 rounded-full bg-[#dce1ff] flex items-center justify-center text-[#00236f] mb-3 group-hover:scale-110 transition-transform shadow-2xs">
              <span className="material-symbols-outlined text-[28px]">add</span>
            </div>
            <span className="font-bold text-sm text-[#00236f]">إضافة دورة جديدة</span>
            <p className="text-xs text-[#757682] text-center mt-1 px-4 leading-relaxed">
              ابدأ في مشاركة معرفتك مع العالم اليوم
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum Builder Section */}
      <section className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#c5c5d3] pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#191c1e]">
              بناء محتوى الدورة: <span className="text-[#00236f]">{activeCourse?.title || ''}</span>
            </h3>
            <p className="text-xs text-[#757682] mt-0.5">
              قم بتنظيم الدروس، رفع الفيديوهات، وإرفاق الملفات التعليمية.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => showToast('معاينة الدورة قيد التشغيل...')}
              className="bg-[#e6e8ea] text-[#444651] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#e0e3e5] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              معاينة
            </button>
            <button
              onClick={() => showToast('تم حفظ جميع التعديلات بنجاح ✓')}
              className="bg-[#0051d5] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              حفظ التعديلات
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Sections & Lessons Tree (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#c5c5d3] rounded-2xl p-4 space-y-4 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#00236f]">المقاطع التعليمية</span>
                <button
                  onClick={handleAddSection}
                  className="text-[#0051d5] hover:underline font-bold text-xs cursor-pointer"
                >
                  + إضافة مقطع
                </button>
              </div>

              <div className="space-y-3">
                {(activeCourse?.sections || []).map((sec) => (
                  <div
                    key={sec.id}
                    className="border border-[#c5c5d3] rounded-xl p-3 bg-[#f2f4f6]"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#757682] cursor-grab text-[18px]">
                          drag_indicator
                        </span>
                        <span className="text-xs font-bold text-[#191c1e]">{sec.title}</span>
                      </div>
                      <span className="material-symbols-outlined text-[#757682] text-[18px]">
                        expand_more
                      </span>
                    </div>

                    <div className="space-y-1.5 pr-2">
                      {sec.lessons.map((les) => {
                        const isSelectedLesson = selectedLessonTitle === les.title;
                        return (
                          <div
                            key={les.id}
                            onClick={() => setSelectedLessonTitle(les.title)}
                            className={`p-2 rounded-lg flex items-center justify-between group cursor-pointer transition-all ${
                              isSelectedLesson
                                ? 'bg-white border-r-4 border-[#00236f] shadow-xs text-[#00236f] font-bold'
                                : 'bg-white border border-[#c5c5d3] text-[#191c1e] hover:border-[#00236f]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="material-symbols-outlined text-[18px] text-[#0051d5]">
                                play_circle
                              </span>
                              <span className="text-xs truncate">{les.title}</span>
                            </div>
                            <span className="material-symbols-outlined text-[#757682] opacity-0 group-hover:opacity-100 text-[16px]">
                              edit
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleAddLesson(sec.id)}
                      className="w-full mt-2.5 py-1.5 border border-dashed border-[#c5c5d3] rounded-lg text-[#444651] text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
                    >
                      + درس جديد
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Editor & Uploader (8 Cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-[#c5c5d3] rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h4 className="text-base font-bold text-[#191c1e]">{selectedLessonTitle}</h4>
                <p className="text-xs text-[#757682] mt-0.5">تعديل محتوى الدرس وإعدادات الفيديو</p>
              </div>

              {/* Video Upload Dropzone */}
              <div
                onClick={handleSimulateVideoUpload}
                className="relative border-2 border-dashed border-[#c5c5d3] rounded-2xl p-8 flex flex-col items-center justify-center bg-[#f7f9fb] hover:border-[#0051d5] transition-colors cursor-pointer group"
              >
                <div className="h-16 w-16 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#0051d5] mb-3 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[36px]">movie</span>
                </div>
                <span className="font-bold text-sm text-[#0051d5]">اسحب ملف الفيديو هنا</span>
                <p className="text-xs text-[#757682] mt-1 text-center">
                  أو اضغط لاختيار ملف من جهازك (MP4, MKV, AVI)
                </p>
                <span className="mt-1 text-[11px] text-[#757682]">
                  الحد الأقصى لحجم الملف: 2 جيجابايت
                </span>

                {/* Simulated TUS Progress Bar */}
                {isUploading && (
                  <>
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-[#e0e3e5] rounded-b-2xl overflow-hidden">
                      <div
                        className="bg-[#0051d5] h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-md border border-[#e0e3e5]">
                      <span className="text-[11px] font-bold text-[#0051d5]">
                        جاري الرفع... {uploadProgress}%
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsUploading(false);
                          showToast('تم إلغاء عملية الرفع');
                        }}
                        className="text-[#ba1a1a] hover:opacity-80 cursor-pointer"
                        title="إلغاء"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Attachments & Sources */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-bold text-[#191c1e]">
                  الملحقات والمصادر (PDF, ZIP)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border border-[#c5c5d3] rounded-xl bg-white hover:bg-[#f2f4f6] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">
                          picture_as_pdf
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-bold text-[#191c1e] truncate">{att.name}</p>
                          <p className="text-[10px] text-[#757682]">{att.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAttachment(idx)}
                        className="text-[#757682] hover:text-[#ba1a1a] p-1 cursor-pointer"
                        title="حذف"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}

                  <div
                    onClick={handleAddAttachment}
                    className="flex items-center justify-center border-2 border-dashed border-[#c5c5d3] rounded-xl p-3 hover:border-[#0051d5] hover:text-[#0051d5] text-[#444651] cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px] ml-1">
                      upload_file
                    </span>
                    <span className="text-xs font-bold">إضافة ملف آخر</span>
                  </div>
                </div>
              </div>

              {/* Lesson Description */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#191c1e]">وصف الدرس</label>
                <textarea
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-[#c5c5d3] p-3 text-xs focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden bg-[#f7f9fb]"
                  placeholder="اكتب تفاصيل الدرس وما يجب على الطالب معرفته..."
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
