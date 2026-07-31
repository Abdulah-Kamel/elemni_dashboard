import React from 'react';
import { TabType } from '../types';

interface MobileBottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab
}) => {
  const items: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: 'dashboard' },
    { id: 'courses', label: 'دوراتي', icon: 'school' },
    { id: 'students', label: 'الطلاب', icon: 'group' },
    { id: 'storage', label: 'التخزين', icon: 'cloud' },
    { id: 'settings', label: 'الإعدادات', icon: 'settings' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-[#f7f9fb] dark:bg-[#191c1e] border-t border-[#c5c5d3] shadow-lg flex justify-around items-center px-2 py-2 rtl select-none">
      {items.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-90 cursor-pointer ${
              isActive
                ? 'bg-[#1e3a8a] text-white shadow-xs'
                : 'text-[#444651] dark:text-[#c5c5d3]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {item.icon}
            </span>
            <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
