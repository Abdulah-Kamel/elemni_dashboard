import React, { useState } from 'react';
import { NotificationItem } from '../types';

interface HeaderProps {
  onCreateCourseClick: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onCreateCourseClick,
  notifications,
  onMarkNotificationRead
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex flex-row justify-between items-center px-6 lg:px-8 py-5 w-full bg-[#f7f9fb]/90 backdrop-blur-md border-b border-[#c5c5d3] sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-4">
        <h2 className="text-xl lg:text-2xl font-bold text-[#00236f] tracking-tight">
          أهلاً بك، أستاذ مختار 👋
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onCreateCourseClick}
          className="bg-[#00236f] hover:bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          <span>إنشاء دورة</span>
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-full hover:bg-[#eceef0] text-[#444651] transition-colors relative cursor-pointer active:scale-95"
            title="الإشعارات"
          >
            <span className="material-symbols-outlined text-[22px]">
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-3 w-80 lg:w-96 bg-white rounded-2xl shadow-xl border border-[#c5c5d3] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center pb-3 border-b border-[#e0e3e5]">
                <h3 className="font-bold text-sm text-[#00236f]">الإشعارات</h3>
                <span className="text-xs bg-[#dbe1ff] text-[#00174b] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} غير مقروء
                </span>
              </div>

              <div className="divide-y divide-[#e0e3e5] max-h-80 overflow-y-auto my-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onMarkNotificationRead(n.id)}
                    className={`p-3 hover:bg-[#f2f4f6] rounded-xl transition-colors cursor-pointer my-1 ${
                      !n.read ? 'bg-[#f7f9fb]' : 'opacity-70'
                    }`}
                  >
                    <p className="text-xs font-semibold text-[#191c1e] leading-relaxed">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-[#757682] mt-1">{n.time}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                className="w-full text-center text-xs text-[#0051d5] font-semibold py-1 hover:underline cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>

        <div className="w-10 h-10 rounded-full bg-[#dce1ff] text-[#00164e] flex items-center justify-center font-bold shadow-xs select-none">
          م
        </div>
      </div>
    </header>
  );
};
