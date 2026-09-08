import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Check, 
  RotateCcw, 
  BookOpen, 
  Sliders, 
  ShieldAlert, 
  User, 
  GraduationCap 
} from 'lucide-react';
import { AppSettings, SortRule, ViewMode } from '../types';
import { dbService, DEFAULT_SETTINGS } from '../services/db';

interface SettingsViewProps {
  settings?: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetSampleData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetSampleData
}) => {
  const [formData, setFormData] = useState<AppSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...(settings || {})
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        ...settings
      }));
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl mx-auto pb-16 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#7D2433] text-white flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">إعدادات وتخصيص مكتبة هريرة</h1>
            <p className="text-xs text-[#6B7280]">
              ضبط قواعد الترتيب الأبجدي، معلومات الأطروحة، وتفضيلات العرض
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Academic Sorting Rules (Core User Requirement) */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EFEBE4] pb-3">
            <Sliders className="w-4 h-4 text-[#7D2433]" />
            <h2 className="text-sm font-bold text-[#1F2937]">قواعد الترتيب والفهرسة الأبجدية للمكتبة</h2>
          </div>

          <div className="space-y-4 text-xs md:text-sm">
            <div>
              <label className="block font-semibold text-[#374151] mb-1.5">
                القاعدة الأساسية للترتيب الأبجدي للمراجع:
              </label>
              <select
                value={formData.primarySortRule}
                onChange={(e) => setFormData({ ...formData, primarySortRule: e.target.value as SortRule })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#DDD6CA] rounded-lg outline-none font-semibold text-[#1F2937]"
              >
                <option value="author">1. بأول اسم المؤلف (الاسم الأول - المعتمد افتراضياً)</option>
                <option value="title">2. عنوان الكتاب أو المرجع</option>
                <option value="year">3. سنة النشر (من الأقدم إلى الأحدث)</option>
                <option value="dateAdded">4. تاريخ الإضافة إلى المكتبة</option>
                <option value="type">5. نوع المصدر (كتب، أطروحات، مقالات)</option>
              </select>
              <p className="text-[11px] text-[#8C827A] mt-1">
                * الترتيب الأبجدي بأول اسم المؤلف: يستخرج النظام تلقائياً مفتاح الحرف الأبجدي (Alphabet Key) بناءً على أول اسم للمؤلف (الاسم الأول مثل: إبراهيم، آنا، جورج، دونالد...) وليس اسم الكتاب.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#F0ECE4]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ignoreArabicAl}
                  onChange={(e) => setFormData({ ...formData, ignoreArabicAl: e.target.checked })}
                  className="rounded text-[#7D2433] focus:ring-[#7D2433]"
                />
                <span className="font-semibold text-[#374151]">
                  تجاهل أداة التعريف «الـ» عند استخراج الحرف الأبجدي للمؤلفين باللغة العربية
                </span>
              </label>
              <p className="text-[11px] text-[#8C827A] mr-6">
                مثال: «الأثير» يُفهرس تحت حرف الألف «أ»، وعند التفعيل يتجاهل «الـ» ليُفهرس تحت «ث».
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#F0ECE4]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.defaultViewMode === 'grid'}
                  onChange={(e) => setFormData({ ...formData, defaultViewMode: e.target.checked ? 'grid' : 'list' })}
                  className="rounded text-[#7D2433] focus:ring-[#7D2433]"
                />
                <span className="font-semibold text-[#374151]">
                  استخدام نمط الشبكة (Grid View) كعرض افتراضي للمكتبة بدلاً من القائمة (List View)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. Researcher & Thesis Info */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EFEBE4] pb-3">
            <GraduationCap className="w-4 h-4 text-[#7D2433]" />
            <h2 className="text-sm font-bold text-[#1F2937]">بيانات الباحث وعنوان الرسالة العلمية</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">اسم الباحث / الباحثة:</label>
              <input
                type="text"
                value={formData.researcherName || ''}
                onChange={(e) => setFormData({ ...formData, researcherName: e.target.value })}
                placeholder="مثال: الباحث الأكاديمي"
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#DDD6CA] rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">عنوان رسالة الماجستير أو الدكتوراه:</label>
              <input
                type="text"
                value={formData.thesisTitle || ''}
                onChange={(e) => setFormData({ ...formData, thesisTitle: e.target.value })}
                placeholder="مثال: العلاقات البيزنطية الإسلامية في عصر الحروب الصليبية"
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#DDD6CA] rounded-lg outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg font-bold border border-emerald-200">
              <Check className="w-4 h-4" />
              <span>تم حفظ التفضيلات والإعدادات بنجاح!</span>
            </div>
          ) : <div />}

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#7D2433] hover:bg-[#681E2A] text-white text-xs md:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </form>

      {/* Danger Zone / Sample Data */}
      <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 shadow-2xs space-y-3 mt-10">
        <div className="flex items-center gap-2 text-red-800">
          <ShieldAlert className="w-4 h-4" />
          <h3 className="text-sm font-bold">البيانات التجريبية وإعادة التعيين</h3>
        </div>
        <p className="text-xs text-red-700 leading-relaxed">
          يمكنك إعادة شحن قاعدة البيانات بالمراجع الأكاديمية النموذجية (مثل Anna Comnena، Akropolites، Angold، ابن الأثير...) لاستكشاف كافة إمكانيات الفهرسة والبحث.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm('هل تريد إعادة شحن المراجع النموذجية في المكتبة؟')) {
              onResetSampleData();
            }
          }}
          className="px-4 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>استعادة المراجع النموذجية</span>
        </button>
      </div>
    </div>
  );
};
