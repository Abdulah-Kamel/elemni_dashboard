import React, { useState } from 'react';
import { Student } from '../types';

interface GrantAccessModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (studentId: string, accessType: Student['accessType']) => void;
}

export const GrantAccessModal: React.FC<GrantAccessModalProps> = ({
  student,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [accessType, setAccessType] = useState<Student['accessType']>(
    'وصول كامل مدى الحياة'
  );

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#c5c5d3]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#00236f]">منح صلاحية وصول</h3>
            <p className="text-xs text-[#757682] mt-0.5">الطالب: {student.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#eceef0] rounded-full text-[#757682] cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="text-xs text-[#444651] mb-5 leading-relaxed">
          يرجى تحديد مدة الصلاحية ومستوى الوصول للطالب المختار على دورة{' '}
          <strong className="text-[#00236f]">{student.course}</strong>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#444651] mb-1.5">
              نوع الصلاحية والوصول
            </label>
            <select
              value={accessType}
              onChange={(e) =>
                setAccessType(e.target.value as Student['accessType'])
              }
              className="w-full p-3 bg-[#f2f4f6] border border-[#c5c5d3] rounded-xl text-xs focus:ring-2 focus:ring-[#00236f] outline-hidden"
            >
              <option value="وصول كامل مدى الحياة">وصول كامل مدى الحياة</option>
              <option value="وصول مؤقت (3 أشهر)">وصول مؤقت (3 أشهر)</option>
              <option value="وصول مؤقت (6 أشهر)">وصول مؤقت (6 أشهر)</option>
              <option value="عرض فقط (بدون تحميلات)">عرض فقط (بدون تحميلات)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              onConfirm(student.id, accessType);
              onClose();
            }}
            className="flex-1 bg-[#00236f] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#1e3a8a] transition-opacity cursor-pointer shadow-xs"
          >
            تأكيد المنح
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[#eceef0] text-[#444651] py-3 rounded-xl text-xs font-bold hover:bg-[#e0e3e5] transition-colors cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
