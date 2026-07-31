import React, { useState } from 'react';
import { Student, VideoItem, TabType } from '../../types';

interface OverviewViewProps {
  students: Student[];
  videos: VideoItem[];
  onNavigateToTab: (tab: TabType) => void;
  onWithdrawRevenue?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  students,
  videos,
  onNavigateToTab,
  onWithdrawRevenue
}) => {
  const [chartTimeframe, setChartTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [withdrawn, setWithdrawn] = useState(false);

  const handleWithdraw = () => {
    setWithdrawn(true);
    if (onWithdrawRevenue) onWithdrawRevenue();
    setTimeout(() => setWithdrawn(false), 3000);
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-200">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3] shadow-xs flex flex-col gap-2 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-[#dce1ff] rounded-xl text-[#00236f]">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
            <span className="text-emerald-600 flex items-center text-xs font-bold gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              12%+
            </span>
          </div>
          <p className="text-[#444651] text-xs font-semibold mt-1">إجمالي الطلاب</p>
          <h3 className="text-3xl font-bold text-[#00236f]">1,420</h3>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3] shadow-xs flex flex-col gap-2 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-[#ffddb8] rounded-xl text-[#3e2400]">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
            <button
              onClick={handleWithdraw}
              className={`text-xs px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                withdrawn
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#316bf3] text-white hover:bg-[#0051d5] active:scale-95'
              }`}
            >
              {withdrawn ? 'تم طلب السحب ✓' : 'سحب'}
            </button>
          </div>
          <p className="text-[#444651] text-xs font-semibold mt-1">الدخل الشهري</p>
          <h3 className="text-3xl font-bold text-[#00236f]">$3,850</h3>
        </div>

        {/* Storage Usage */}
        <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3] shadow-xs flex flex-col gap-2 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-[#e0e3e5] rounded-xl text-[#444651]">
              <span className="material-symbols-outlined text-[22px]">cloud</span>
            </div>
            <span className="text-[#444651] text-xs font-bold">42.5/100GB</span>
          </div>
          <p className="text-[#444651] text-xs font-semibold mt-1">استخدام التخزين</p>
          <div className="mt-2 space-y-1">
            <div className="w-full bg-[#e6e8ea] h-2 rounded-full overflow-hidden">
              <div className="bg-[#00236f] h-full w-[42.5%] transition-all duration-500"></div>
            </div>
          </div>
        </div>

        {/* Total Watch Hours */}
        <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3] shadow-xs flex flex-col gap-2 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-[#dbe1ff] rounded-xl text-[#0051d5]">
              <span className="material-symbols-outlined text-[22px]">schedule</span>
            </div>
            <span className="text-[#444651] text-xs font-bold">ساعة</span>
          </div>
          <p className="text-[#444651] text-xs font-semibold mt-1">ساعات المشاهدة</p>
          <h3 className="text-3xl font-bold text-[#00236f]">1,280</h3>
        </div>
      </div>

      {/* Analytics & Video Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#c5c5d3] p-5 lg:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-[#00236f]">تحليلات الأداء</h3>
              <p className="text-[#757682] text-xs">مقارنة الدخل مقابل مشاهدات الفيديو</p>
            </div>
            <div className="flex bg-[#eceef0] rounded-xl p-1 gap-1">
              <button
                onClick={() => setChartTimeframe('weekly')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chartTimeframe === 'weekly'
                    ? 'bg-white shadow-xs text-[#00236f]'
                    : 'text-[#444651] hover:text-[#00236f]'
                }`}
              >
                أسبوعي
              </button>
              <button
                onClick={() => setChartTimeframe('monthly')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chartTimeframe === 'monthly'
                    ? 'bg-white shadow-xs text-[#00236f]'
                    : 'text-[#444651] hover:text-[#00236f]'
                }`}
              >
                شهري
              </button>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative h-[260px] w-full mt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 260">
              <defs>
                <linearGradient id="chartGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#00236f" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00236f" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="200" x2="800" y2="200" stroke="#e6e8ea" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="800" y2="140" stroke="#e6e8ea" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="800" y2="80" stroke="#e6e8ea" strokeDasharray="4 4" />

              {/* Line 1: Revenue (Solid) */}
              <path
                d={
                  chartTimeframe === 'weekly'
                    ? "M0,210 Q100,80 200,150 T400,90 T600,130 T800,40"
                    : "M0,180 Q100,120 200,60 T400,110 T600,70 T800,30"
                }
                fill="none"
                stroke="#00236f"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d={
                  chartTimeframe === 'weekly'
                    ? "M0,210 Q100,80 200,150 T400,90 T600,130 T800,40 V240 H0 Z"
                    : "M0,180 Q100,120 200,60 T400,110 T600,70 T800,30 V240 H0 Z"
                }
                fill="url(#chartGrad)"
              />

              {/* Line 2: Views (Dashed) */}
              <path
                d={
                  chartTimeframe === 'weekly'
                    ? "M0,230 Q150,180 300,200 T500,140 T800,180"
                    : "M0,210 Q150,150 300,170 T500,110 T800,140"
                }
                fill="none"
                stroke="#316bf3"
                strokeWidth="3"
                strokeDasharray="8 5"
                strokeLinecap="round"
              />
            </svg>

            <div className="flex justify-between mt-3 text-xs font-semibold text-[#757682]">
              {chartTimeframe === 'weekly' ? (
                <>
                  <span>الأحد</span>
                  <span>الاثنين</span>
                  <span>الثلاثاء</span>
                  <span>الأربعاء</span>
                  <span>الخميس</span>
                  <span>الجمعة</span>
                  <span>السبت</span>
                </>
              ) : (
                <>
                  <span>الأسبوع 1</span>
                  <span>الأسبوع 2</span>
                  <span>الأسبوع 3</span>
                  <span>الأسبوع 4</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Video Processing Status (1 Col) */}
        <div className="bg-white rounded-2xl border border-[#c5c5d3] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#00236f]">حالة معالجة الفيديو</h3>
              <button
                onClick={() => onNavigateToTab('courses')}
                className="text-[#757682] hover:text-[#00236f] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>

            <div className="space-y-4">
              {videos.map((vid) => (
                <div key={vid.id} className="flex gap-3 items-center">
                  <div className="w-16 h-12 bg-[#eceef0] rounded-xl relative overflow-hidden flex-shrink-0 shadow-2xs">
                    {vid.status === 'جاري المعالجة' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                        <span className="material-symbols-outlined text-white text-base animate-spin">
                          sync
                        </span>
                      </div>
                    )}
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-xs font-bold text-[#191c1e] truncate">{vid.title}</p>
                    {vid.status === 'جاري المعالجة' ? (
                      <div className="w-full bg-[#e6e8ea] h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-[#316bf3] h-full transition-all duration-300"
                          style={{ width: `${vid.progress}%` }}
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#757682] mt-0.5">{vid.timeAgo}</p>
                    )}
                  </div>

                  {vid.status === 'جاهز' && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      جاهز
                    </span>
                  )}
                  {vid.status === 'جاري المعالجة' && (
                    <span className="text-[#316bf3] text-[10px] font-bold">
                      {vid.progress}%
                    </span>
                  )}
                  {vid.status === 'تم الرفع' && (
                    <span className="px-2 py-0.5 bg-[#e0e3e5] text-[#444651] text-[10px] font-bold rounded-full">
                      تم الرفع
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('courses')}
            className="w-full mt-6 py-2.5 border border-[#c5c5d3] rounded-xl text-xs font-bold text-[#00236f] hover:bg-[#f2f4f6] active:scale-98 transition-all cursor-pointer"
          >
            عرض جميع الفيديوهات
          </button>
        </div>
      </div>

      {/* Recent Enrolments Table */}
      <section className="bg-white rounded-2xl border border-[#c5c5d3] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#c5c5d3] flex justify-between items-center">
          <h3 className="text-base font-bold text-[#00236f]">عمليات التسجيل الأخيرة</h3>
          <button
            onClick={() => onNavigateToTab('students')}
            className="text-[#00236f] hover:text-[#0051d5] font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <span>رؤية الكل</span>
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#f2f4f6]">
                <th className="px-5 py-3 text-xs font-bold text-[#444651]">اسم الطالب</th>
                <th className="px-5 py-3 text-xs font-bold text-[#444651]">الدورة التدريبية</th>
                <th className="px-5 py-3 text-xs font-bold text-[#444651]">تاريخ التسجيل</th>
                <th className="px-5 py-3 text-xs font-bold text-[#444651]">التقدم</th>
                <th className="px-5 py-3 text-xs font-bold text-[#444651]">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e3e5]">
              {students.slice(0, 4).map((st) => (
                <tr key={st.id} className="hover:bg-[#f7f9fb] transition-colors">
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${st.avatarBg}`}
                    >
                      {st.avatarLetter}
                    </div>
                    <span className="text-xs font-semibold text-[#191c1e]">{st.name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#444651]">{st.course}</td>
                  <td className="px-5 py-3.5 text-xs text-[#444651]">{st.enrollmentDate}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#e6e8ea] h-1.5 rounded-full overflow-hidden max-w-[120px]">
                        <div
                          className="bg-[#00236f] h-full rounded-full"
                          style={{ width: `${st.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#00236f]">{st.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <a
                      href={`mailto:${st.email}`}
                      className="p-1.5 text-[#757682] hover:text-[#00236f] transition-colors inline-block"
                      title={`مراسلة ${st.email}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
