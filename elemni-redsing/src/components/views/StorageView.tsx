import React, { useState } from 'react';
import { Course } from '../../types';

interface StorageViewProps {
  courses: Course[];
}

export const StorageView: React.FC<StorageViewProps> = ({ courses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bandwidthRange, setBandwidthRange] = useState<'7days' | '30days'>('7days');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        showToast(`جاري رفع الملف إلى خادم S3: ${target.files[0].name}`);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-200 relative">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#00236f] text-white px-5 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Bento Top: S3 Donut Gauge & Bandwidth Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* S3 Storage Gauge Card (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-xs border border-[#c5c5d3] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#757682]">استهلاك تخزين S3</h3>
            <p className="text-3xl font-bold text-[#00236f] mt-1">742.8 GB</p>
            <p className="text-xs text-[#757682]">من إجمالي 1.0 TB</p>
          </div>

          <div className="my-6 relative h-44 flex items-center justify-center">
            {/* Donut Gauge SVG */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                className="text-[#e6e8ea]"
                cx="80"
                cy="80"
                r="68"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="14"
              />
              <circle
                className="text-[#316bf3] transition-all duration-1000"
                cx="80"
                cy="80"
                r="68"
                fill="transparent"
                stroke="currentColor"
                strokeDasharray="427"
                strokeDashoffset="111"
                strokeWidth="14"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-bold text-[#191c1e]">74%</span>
              <span className="text-xs font-semibold text-[#757682]">مستخدم</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-[#e0e3e5] pt-4">
            <div className="flex justify-between text-xs">
              <span className="text-[#757682] font-semibold">الملفات المرئية (Video)</span>
              <span className="font-bold text-[#00236f]">612 GB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#757682] font-semibold">الوثائق والملفات (Docs)</span>
              <span className="font-bold text-[#00236f]">130.8 GB</span>
            </div>
          </div>
        </div>

        {/* Bandwidth Line Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-xs border border-[#c5c5d3] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#757682]">
                استهلاك البث اليومي (Bandwidth)
              </h3>
              <p className="text-2xl lg:text-3xl font-bold text-[#00236f] mt-0.5">
                4.2 TB{' '}
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  ↑ 12%
                </span>
              </p>
            </div>

            <select
              value={bandwidthRange}
              onChange={(e) => setBandwidthRange(e.target.value as '7days' | '30days')}
              className="bg-[#f7f9fb] border border-[#c5c5d3] rounded-xl text-xs font-semibold px-3 py-1.5 outline-hidden cursor-pointer"
            >
              <option value="7days">آخر 7 أيام</option>
              <option value="30days">آخر 30 يوم</option>
            </select>
          </div>

          {/* Area & Line Chart */}
          <div className="relative h-[220px] w-full mt-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 800 220"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="bwGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#316bf3" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#316bf3" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="180" x2="800" y2="180" stroke="#e2e8f0" />
              <line x1="0" y1="130" x2="800" y2="130" stroke="#e2e8f0" />
              <line x1="0" y1="80" x2="800" y2="80" stroke="#e2e8f0" />

              {/* Area & Path */}
              <path
                d={
                  bandwidthRange === '7days'
                    ? "M0,180 L50,150 L150,170 L250,90 L350,120 L450,40 L550,80 L650,20 L750,60 L800,70 L800,220 L0,220 Z"
                    : "M0,160 L100,120 L200,140 L300,70 L400,90 L500,30 L600,60 L700,20 L800,40 L800,220 L0,220 Z"
                }
                fill="url(#bwGrad)"
              />
              <path
                d={
                  bandwidthRange === '7days'
                    ? "M0,180 L50,150 L150,170 L250,90 L350,120 L450,40 L550,80 L650,20 L750,60 L800,70"
                    : "M0,160 L100,120 L200,140 L300,70 L400,90 L500,30 L600,60 L700,20 L800,40"
                }
                fill="none"
                stroke="#316bf3"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              <circle cx="250" cy="90" r="5" fill="#316bf3" />
              <circle cx="450" cy="40" r="5" fill="#316bf3" />
              <circle cx="650" cy="20" r="5" fill="#316bf3" />
            </svg>

            <div className="flex justify-between px-1 mt-3 text-xs font-semibold text-[#757682]">
              <span>الأحد</span>
              <span>الإثنين</span>
              <span>الثلاثاء</span>
              <span>الأربعاء</span>
              <span>الخميس</span>
              <span>الجمعة</span>
              <span>السبت</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Breakdown by Course Table */}
      <section className="bg-white rounded-2xl shadow-xs border border-[#c5c5d3] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#c5c5d3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base font-bold text-[#00236f]">
            توزيع التخزين حسب الدورات
          </h2>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#757682] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث عن دورة..."
              className="bg-[#f7f9fb] border border-[#c5c5d3] pr-9 pl-3 py-1.5 rounded-xl text-xs w-full focus:ring-2 focus:ring-[#00236f] outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-[#f2f4f6] text-[#757682] text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-3">اسم الدورة</th>
                <th className="px-6 py-3">عدد الفيديوهات</th>
                <th className="px-6 py-3">حجم التخزين</th>
                <th className="px-6 py-3">البث المستهلك</th>
                <th className="px-6 py-3 text-left">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e3e5]">
              {filteredCourses.map((c) => (
                <tr key={c.id} className="hover:bg-[#f7f9fb] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#dbe1ff] text-[#00236f] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[20px]">
                          video_library
                        </span>
                      </div>
                      <span className="font-bold text-xs text-[#191c1e]">{c.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-[#444651]">
                    {c.videoCount} فيديو
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-[#00236f]">
                    {c.storageSizeGb} GB
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-[#316bf3]">
                    {c.bandwidthConsumedTb} TB
                  </td>
                  <td className="px-6 py-4 text-left">
                    {c.status === 'منشور' && (
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[11px] font-bold">
                        نشط
                      </span>
                    )}
                    {c.status === 'مسودة' && (
                      <span className="bg-[#e0e3e5] text-[#444651] px-3 py-1 rounded-full text-[11px] font-bold">
                        مسودة
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Upload FAB */}
      <button
        onClick={handleUploadClick}
        className="fixed bottom-20 left-6 md:bottom-8 md:left-8 bg-[#316bf3] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-[#0051d5] active:scale-95 transition-all z-40 cursor-pointer"
        title="رفع ملف جديد"
      >
        <span className="material-symbols-outlined text-[28px]">file_upload</span>
      </button>
    </div>
  );
};
