import React from 'react';
import { TabType } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: 'dashboard' },
    { id: 'courses', label: 'دوراتي', icon: 'school' },
    { id: 'students', label: 'الطلاب', icon: 'group' },
    { id: 'storage', label: 'التخزين', icon: 'cloud' },
    { id: 'settings', label: 'الإعدادات', icon: 'settings' }
  ];

  return (
    <aside className="fixed top-0 right-0 h-full w-[280px] bg-[#f7f9fb] dark:bg-[#191c1e] shadow-sm border-l border-[#c5c5d3] flex flex-col rtl z-40 hidden md:flex select-none">
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold text-[#00236f] dark:text-[#b6c4ff] tracking-tight">إيلمني</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-row items-center gap-3 px-6 py-3.5 rounded-xl text-right transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#dbe1ff] text-[#003ea8] border-r-4 border-[#00236f] font-bold shadow-xs scale-[0.99]'
                  : 'text-[#444651] dark:text-[#c5c5d3] hover:bg-[#eceef0] hover:text-[#00236f]'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-[#e0e3e5]">
        <div className="flex items-center gap-3 flex-row">
          <div className="w-11 h-11 rounded-full bg-[#1e3a8a] flex items-center justify-center text-[#90a8ff] font-bold text-lg shadow-sm">
            م
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#191c1e]">أستاذ مختار</p>
            <p className="text-xs text-[#757682]">مدرب معتمد</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
