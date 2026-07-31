import React, { useState } from 'react';
import { PlayerSettings } from '../../types';

interface SettingsViewProps {
  settings: PlayerSettings;
  onUpdateSettings: (newSettings: PlayerSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [watermarkEnabled, setWatermarkEnabled] = useState(
    settings.watermarkEnabled
  );
  const [allowPdfDownload, setAllowPdfDownload] = useState(
    settings.allowPdfDownload
  );
  const [whitelistedDomains, setWhitelistedDomains] = useState(
    settings.whitelistedDomains
  );
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    const updated: PlayerSettings = {
      watermarkEnabled,
      allowPdfDownload,
      whitelistedDomains,
      primaryColor
    };
    onUpdateSettings(updated);
    showToast('تم حفظ إعدادات المشغل والحماية بنجاح ✓');
  };

  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        showToast(`تم تغيير شعار العلامة التجارية: ${target.files[0].name}`);
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

      {/* Top Bar for Settings */}
      <div className="flex justify-between items-center pb-2 border-b border-[#c5c5d3]">
        <h2 className="text-lg font-bold text-[#00236f]">إعدادات المشغل والحماية</h2>
        <button
          onClick={handleSave}
          className="bg-[#00236f] hover:bg-[#1e3a8a] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          حفظ التغييرات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rtl">
        {/* Left Column: Settings Form (7 Cols) */}
        <section className="lg:col-span-7 space-y-6">
          {/* Security Card */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-[#c5c5d3] shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-[#00236f]">
              <span className="material-symbols-outlined text-[22px]">security</span>
              <h3 className="text-sm font-bold">حماية المحتوى</h3>
            </div>

            {/* Watermark Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f7f9fb] border border-[#e0e3e5]">
              <div>
                <p className="text-xs font-bold text-[#191c1e]">
                  العلامة المائية الديناميكية
                </p>
                <p className="text-[11px] text-[#757682] mt-0.5">
                  عرض رقم هاتف الطالب أو بريده الإلكتروني فوق الفيديو لمنع التسجيل
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#c5c5d3] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00236f]"></div>
              </label>
            </div>

            {/* PDF Permission Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f7f9fb] border border-[#e0e3e5]">
              <div>
                <p className="text-xs font-bold text-[#191c1e]">
                  السماح بتحميل ملفات PDF
                </p>
                <p className="text-[11px] text-[#757682] mt-0.5">
                  تمكين الطلاب من تحميل المرفقات الدراسية محلياً
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPdfDownload}
                  onChange={(e) => setAllowPdfDownload(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#c5c5d3] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00236f]"></div>
              </label>
            </div>

            {/* Domain Whitelisting */}
            <div>
              <label className="block text-xs font-bold text-[#444651] mb-1.5">
                تقييد النطاق (Whitelisting)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={whitelistedDomains}
                  onChange={(e) => setWhitelistedDomains(e.target.value)}
                  placeholder="example.com, elemni.edu"
                  className="w-full p-3 rounded-xl border border-[#c5c5d3] focus:ring-2 focus:ring-[#00236f] text-xs outline-hidden bg-white text-left dir-ltr"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#757682] text-[18px]">
                  language
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#757682]">
                ادخل النطاقات المسموح لها بعرض الفيديو فقط، مفصولة بفاصلة
              </p>
            </div>
          </div>

          {/* Player Branding Card */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-[#c5c5d3] shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-[#00236f]">
              <span className="material-symbols-outlined text-[22px]">palette</span>
              <h3 className="text-sm font-bold">هوية المشغل</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-[#444651] mb-1.5">
                  اللون الأساسي للمشغل
                </label>
                <div className="flex items-center gap-3 p-2 border border-[#c5c5d3] rounded-xl bg-white">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs font-bold text-[#191c1e] uppercase">
                    {primaryColor}
                  </span>
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-bold text-[#444651] mb-1.5">
                  شعار العلامة التجارية
                </label>
                <div
                  onClick={handleLogoUpload}
                  className="border-2 border-dashed border-[#c5c5d3] rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#f2f4f6] transition-colors"
                >
                  <span className="material-symbols-outlined text-[#757682] text-[20px]">
                    upload_file
                  </span>
                  <span className="text-xs font-bold text-[#757682]">
                    رفع صورة الشعار
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Live Player Preview (5 Cols) */}
        <section className="lg:col-span-5">
          <div className="sticky top-28 space-y-4">
            <h3 className="text-sm font-bold text-[#00236f] pr-3 border-r-4 border-[#00236f]">
              معاينة مباشرة للمشغل
            </h3>

            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white group select-none">
              {/* Video Frame Poster */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-85"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDGv7meO_NyVROz9gOgbUXKLUQ0sEmbWYjzQUVgzFw3HlHLdrcDeBIG-lEnTns4GLJrCsyr1NpOLtcsVG4tmrvT-OrIi8KfmnPaZyy6D328k_gLLgaLA4fFUBlhkE229-Ur3QOd8Bqp1srN01yaiHmACEK2Aj0cUbBiucNmT11qBsHXOXZdUOrNvUKzvtqN-VEWnITCHoYXDx-INWBMQoyHxZ50JShj1a5CPYm0DVHEQexNELVowB7UZo0Cxv-PVR2GaKTAdHWWufE')"
                }}
              />

              {/* Dynamic Watermark Overlay */}
              {watermarkEnabled && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div
                    className="watermark-overlay absolute text-white/40 font-bold text-xs select-none whitespace-nowrap rotate-[-15deg]"
                    style={{ top: '25%', left: '15%' }}
                  >
                    student_id: 966501234567
                  </div>
                  <div
                    className="watermark-overlay absolute text-white/25 font-bold text-[10px] select-none whitespace-nowrap rotate-[-15deg]"
                    style={{ top: '65%', right: '20%', animationDelay: '-5s' }}
                  >
                    student_id: 966501234567
                  </div>
                </div>
              )}

              {/* Top Branding Logo */}
              <div className="absolute top-3 right-3 z-10">
                <img
                  src={
                    settings.logoUrl ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuDzSSfOnE9XSe6vrmIJgNNCoEFmkHJaHqnD-1Y9qtUN-UWA8omS4dC96Eu3VpmN5QXkXdz9BlF6LpeufS10q5EqXQZC9tjYdXjN6nFy3z0A2HwNTE-l_D7XnRF26o74P8ftmNojt2Ks7dXDYjKn70Jqu1FYIu8iGSAkaxBWUacSR_Aw_i_ARgjwOqpP0OXdwB7D9Rwb2LrDHSJMkd65jydndwVygBlmcQ7T0JqAPhFX8Ij9SFkrB5xenFAs1dWTPDInVjWjsNIovjE'
                  }
                  alt="Logo"
                  className="h-6 w-auto opacity-90 filter drop-shadow-xs"
                />
              </div>

              {/* Center Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer transform hover:scale-110 transition-transform"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="material-symbols-outlined text-3xl">
                    play_arrow
                  </span>
                </div>
              </div>

              {/* Player Controls Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                {/* Progress bar styled with primaryColor */}
                <div className="w-full h-1 bg-white/30 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full w-2/3"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>

                <div className="flex justify-between items-center text-white text-xs">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">
                      play_arrow
                    </span>
                    <span className="material-symbols-outlined text-[18px]">
                      volume_up
                    </span>
                    <span className="text-[10px] font-mono">12:45 / 24:00</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      settings
                    </span>
                    <span className="material-symbols-outlined text-[18px]">
                      fullscreen
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#dce1ff]/40 border border-[#b6c4ff] flex items-start gap-2">
              <span className="material-symbols-outlined text-[#00236f] text-[18px] shrink-0 mt-0.5">
                info
              </span>
              <p className="text-xs text-[#264191] leading-relaxed font-semibold">
                هذه المعاينة توضح كيف تظهر العلامة المائية والشعار للطالب عند تشغيل
                الدروس. العلامة المائية تتحرك باستمرار عبر الشاشة لمنع التسجيل.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
