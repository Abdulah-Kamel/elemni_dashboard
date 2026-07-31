import React, { useState } from 'react';
import { Student } from '../../types';

interface StudentsViewProps {
  students: Student[];
  onToggleBlockStudent: (studentId: string) => void;
  onOpenGrantModal: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onToggleBlockStudent,
  onOpenGrantModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'الكل' | 'نشط' | 'محظور' | 'مكتمل'>('الكل');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.course.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'الكل') return matchesSearch;
    return matchesSearch && st.status === statusFilter;
  });

  const activeCount = students.filter((s) => s.status === 'نشط').length;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3] shadow-xs">
          <p className="text-[11px] font-bold text-[#757682] uppercase tracking-wider">
            إجمالي الطلاب
          </p>
          <h2 className="text-3xl font-bold text-[#00236f] mt-1">1,284</h2>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>12% زيادة هذا الشهر</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3] shadow-xs">
          <p className="text-[11px] font-bold text-[#757682] uppercase tracking-wider">
            الطلاب النشطون
          </p>
          <h2 className="text-3xl font-bold text-[#00236f] mt-1">{activeCount}</h2>
          <div className="flex items-center gap-1 text-[#444651] text-xs font-semibold mt-1">
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>82% من إجمالي المسجلين</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3] shadow-xs">
          <p className="text-[11px] font-bold text-[#757682] uppercase tracking-wider">
            طلبات وصول معلقة
          </p>
          <h2 className="text-3xl font-bold text-[#ef9900] mt-1">15</h2>
          <div className="flex items-center gap-1 text-[#ef9900] text-xs font-semibold mt-1">
            <span className="material-symbols-outlined text-[16px]">pending</span>
            <span>تتطلب إجراءً فورياً</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center bg-[#f2f4f6] p-3 rounded-2xl border border-[#e0e3e5]">
          <div className="relative flex-1 max-w-md">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#757682]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث عن طالب أو دورة..."
              className="w-full pr-11 pl-4 py-2.5 bg-white border border-[#c5c5d3] rounded-xl focus:ring-2 focus:ring-[#00236f] text-xs outline-hidden shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-[#444651] ml-1 shrink-0">تصفية حسب:</span>
            {(['الكل', 'نشط', 'محظور', 'مكتمل'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#1e3a8a] text-white shadow-2xs'
                    : 'bg-[#e0e3e5] text-[#444651] hover:bg-[#c5c5d3]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-[#c5c5d3] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#f2f4f6] border-b border-[#c5c5d3]">
                  <th className="px-5 py-3 text-xs font-bold text-[#444651] uppercase">
                    اسم الطالب
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-[#444651] uppercase">
                    الدورة التدريبية
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-[#444651] uppercase">
                    تاريخ الالتحاق
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-[#444651] uppercase">
                    التقدم المحرز
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-[#444651] uppercase">
                    حالة الوصول
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-[#444651] uppercase text-center">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3e5]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-[#757682]">
                      لا توجد نتائج مطابقة للبحث.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const isBlocked = st.status === 'محظور';
                    return (
                      <tr
                        key={st.id}
                        className="hover:bg-[#f7f9fb] transition-colors group"
                      >
                        <td className="px-5 py-3.5">
                          <div
                            className={`flex items-center gap-3 ${
                              isBlocked ? 'opacity-60' : ''
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${st.avatarBg}`}
                            >
                              {st.avatarLetter}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#191c1e]">{st.name}</p>
                              <p className="text-[11px] text-[#757682]">{st.email}</p>
                            </div>
                          </div>
                        </td>

                        <td
                          className={`px-5 py-3.5 text-xs text-[#191c1e] ${
                            isBlocked ? 'opacity-60' : ''
                          }`}
                        >
                          {st.course}
                        </td>

                        <td
                          className={`px-5 py-3.5 text-xs text-[#757682] ${
                            isBlocked ? 'opacity-60' : ''
                          }`}
                        >
                          {st.enrollmentDate}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="w-full bg-[#e6e8ea] rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${
                                isBlocked
                                  ? 'bg-[#ba1a1a]'
                                  : st.progress === 100
                                  ? 'bg-[#0051d5]'
                                  : 'bg-[#00236f]'
                              }`}
                              style={{ width: `${st.progress}%` }}
                            />
                          </div>
                          <span
                            className={`text-[11px] font-bold mt-1 block ${
                              isBlocked ? 'text-[#ba1a1a]' : 'text-[#00236f]'
                            }`}
                          >
                            {st.progress}%
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          {st.status === 'نشط' && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                              نشط
                            </span>
                          )}
                          {st.status === 'مكتمل' && (
                            <span className="px-3 py-1 bg-[#e0e3e5] text-[#444651] rounded-full text-[11px] font-bold">
                              مكتمل
                            </span>
                          )}
                          {st.status === 'محظور' && (
                            <span className="px-3 py-1 bg-[#ffdad6] text-[#93000a] rounded-full text-[11px] font-bold">
                              محظور
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onToggleBlockStudent(st.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isBlocked
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-[#ba1a1a] hover:bg-[#ffdad6]'
                              }`}
                              title={isBlocked ? 'إلغاء الحظر' : 'حظر الطالب'}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {isBlocked ? 'lock_open' : 'block'}
                              </span>
                            </button>

                            <button
                              onClick={() => onOpenGrantModal(st)}
                              className="p-1.5 text-[#00236f] hover:bg-[#dce1ff] rounded-lg transition-colors cursor-pointer"
                              title="منح صلاحية وصول"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                key
                              </span>
                            </button>

                            <button
                              onClick={() => onOpenGrantModal(st)}
                              className="p-1.5 text-[#757682] hover:bg-[#eceef0] rounded-lg transition-colors cursor-pointer"
                              title="تعديل الصلاحيات"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                edit
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-row items-center justify-between px-5 py-3.5 border-t border-[#c5c5d3] bg-[#f2f4f6]">
            <p className="text-xs font-semibold text-[#757682]">
              عرض 1-{filteredStudents.length} من أصل 1,284 طالب
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#c5c5d3] bg-white hover:bg-[#eceef0] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
              {[1, 2, 3].map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === pg
                      ? 'bg-[#00236f] text-white'
                      : 'border border-[#c5c5d3] bg-white text-[#444651] hover:bg-[#eceef0]'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#c5c5d3] bg-white hover:bg-[#eceef0] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
