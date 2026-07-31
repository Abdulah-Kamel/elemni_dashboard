import React, { useState } from 'react';
import { Course } from '../types';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (course: Course) => void;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('299');
  const [status, setStatus] = useState<'منشور' | 'مسودة'>('مسودة');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCourse: Course = {
      id: `c_${Date.now()}`,
      title: title.trim(),
      studentsCount: 0,
      price: parseFloat(price) || 0,
      currency: 'ر.س',
      status: status,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA_V78nXoFKE-p9ElnWmJOq0lJ-0kr2S3JI7IrzsQL7XOOrG3UxCTeFEkdvp8Tmgh-0JLpGM4VZEVNnARSIi7ifrITUDr6NxyWQaKy-plk2HvukUKR8didVIWPXMr_fNO-81T4u2wc3q_0OAUo31ksTKNcpMR8vLZejC5LuYwVYR5MrXl3ZzENCJ2zcs08qcyFhBNUkIsoeGaTgI8HsrisrOhrRWHpEql71wnJuIDh_362kAyKhlVeoadz-xgesUoAePzBdnkveH8A',
      videoCount: 1,
      storageSizeGb: 1.5,
      bandwidthConsumedTb: 0.05,
      sections: [
        {
          id: `sec_${Date.now()}`,
          title: 'المقدمة والأساسيات',
          lessons: [
            { id: `les_${Date.now()}`, title: 'الدرس الأول: الترحيب بالطلاب', completed: false }
          ]
        }
      ]
    };

    onCreate(newCourse);
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-[#c5c5d3]">
        <div className="flex justify-between items-center pb-4 border-b border-[#e0e3e5]">
          <h3 className="text-lg font-bold text-[#00236f]">إضافة دورة تدريبية جديدة</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#eceef0] rounded-full text-[#757682] cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-[#444651] mb-1.5">
              عنوان الدورة *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: أساسيات الذكاء الاصطناعي مع بايثون"
              className="w-full px-4 py-2.5 bg-[#f7f9fb] border border-[#c5c5d3] rounded-xl text-sm focus:ring-2 focus:ring-[#00236f] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#444651] mb-1.5">
                السعر (ر.س)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f7f9fb] border border-[#c5c5d3] rounded-xl text-sm focus:ring-2 focus:ring-[#00236f] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#444651] mb-1.5">
                حالة الدورة
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'منشور' | 'مسودة')}
                className="w-full px-4 py-2.5 bg-[#f7f9fb] border border-[#c5c5d3] rounded-xl text-sm focus:ring-2 focus:ring-[#00236f] focus:outline-hidden"
              >
                <option value="مسودة">مسودة</option>
                <option value="منشور">منشور</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#e0e3e5]">
            <button
              type="submit"
              className="flex-1 bg-[#00236f] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3a8a] transition-all cursor-pointer shadow-xs"
            >
              إنشاء الدورة
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#eceef0] text-[#444651] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e0e3e5] transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
