import React from 'react';
import { 
  Library, 
  BookOpen, 
  GraduationCap, 
  Quote, 
  FileText, 
  Star, 
  Globe, 
  FolderTree, 
  PlusCircle, 
  ArrowLeft,
  Calendar,
  Sparkles,
  Layers,
  BookMarked
} from 'lucide-react';
import { Reference, CategoryItem, CitationQuote, ResearchNote } from '../types';

interface DashboardViewProps {
  references: Reference[];
  categories: CategoryItem[];
  quotes: CitationQuote[];
  notes: ResearchNote[];
  thesisTitle?: string;
  onNavigateToLibrary: () => void;
  onNavigateToCatalogue?: () => void;
  onOpenAddModal: () => void;
  onSelectReference: (ref: Reference) => void;
  onSelectLetter: (letter: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  references = [],
  categories = [],
  quotes = [],
  notes = [],
  thesisTitle,
  onNavigateToLibrary,
  onNavigateToCatalogue,
  onOpenAddModal,
  onSelectReference,
  onSelectLetter
}) => {
  const activeRefs = (references || []).filter((r) => !r.inTrash);
  const arabicRefs = activeRefs.filter((r) => r.language === 'العربية');
  const foreignRefs = activeRefs.filter((r) => r.language !== 'العربية');
  const primarySources = activeRefs.filter((r) => (r.referenceType || '').includes('مصدر أصلي'));
  const theses = activeRefs.filter((r) => (r.referenceType || '').includes('رسالة') || (r.referenceType || '').includes('أطروحة'));
  const withFiles = activeRefs.filter((r) => !!r.file);
  const favorites = activeRefs.filter((r) => r.isFavorite);

  // Group by alphabetical letters for distribution overview
  const letterMap: Record<string, number> = {};
  activeRefs.forEach((r) => {
    const k = r.alphabetKey || '#';
    letterMap[k] = (letterMap[k] || 0) + 1;
  });

  const sortedLetters = Object.keys(letterMap).sort((a, b) => a.localeCompare(b, ['ar', 'en']));

  // Recently added
  const recentRefs = [...activeRefs]
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    .slice(0, 5);

  return (
    <div id="dashboard-view" className="space-y-6 max-w-6xl mx-auto pb-12 text-right" dir="rtl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1E252B] via-[#2A3742] to-[#1E252B] text-white rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden border border-[#3A4A57]">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>نظام إدارة المراجع والمصادر للأطروحات الأكاديمية</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-citation tracking-wide">
              مكتبة هريرة الأكاديمية
            </h1>
            <p className="text-xs md:text-sm text-gray-300 max-w-2xl leading-relaxed">
              منصة حفظ وتنظيم مراجع رسائل الماجستير والدكتوراه، بفهرسة أبجدية صارمة حسب المؤلفين، مع صيانة نصوص الاستشهاد حرفياً وقراءة الوثائق وتوثيق الاقتباسات.
            </p>
            {thesisTitle && (
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs md:text-sm">
                  <GraduationCap className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>مشروع الأطروحة الحالي: <strong className="text-white font-bold font-citation mr-1">«{thesisTitle}»</strong></span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs md:text-sm font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة مرجع جديد</span>
            </button>

            {onNavigateToCatalogue && (
              <button
                onClick={onNavigateToCatalogue}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white text-xs md:text-sm font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                title="فتح فهرس الكتب الأبجدي الشامل بأسماء الكتب المعتمدة مرتبين"
              >
                <BookMarked className="w-4 h-4 text-amber-200" />
                <span>فهرس الكتب الأبجدي الشامل</span>
              </button>
            )}

            <button
              onClick={onNavigateToLibrary}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-medium rounded-xl border border-white/20 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Library className="w-4 h-4" />
              <span>استعراض المكتبة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-[#E5E0D5] rounded-xl p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-[#FAF3F0] text-[#7D2433] flex items-center justify-center mb-2">
            <Library className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-[#1F2937] block">{activeRefs.length}</span>
          <span className="text-xs text-[#6B7280]">إجمالي المراجع</span>
        </div>

        <div className="bg-white border border-[#E5E0D5] rounded-xl p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center mb-2">
            <Globe className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-[#1F2937] block">{arabicRefs.length} / {foreignRefs.length}</span>
          <span className="text-xs text-[#6B7280]">عربي / أجنبي</span>
        </div>

        <div className="bg-white border border-[#E5E0D5] rounded-xl p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-[#1F2937] block">{theses.length}</span>
          <span className="text-xs text-[#6B7280]">رسائل وأطروحات</span>
        </div>

        <div className="bg-white border border-[#E5E0D5] rounded-xl p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-[#1F2937] block">{primarySources.length}</span>
          <span className="text-xs text-[#6B7280]">مصادر أولية ومخطوطات</span>
        </div>

        <div className="bg-white border border-[#E5E0D5] rounded-xl p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center mb-2">
            <Quote className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-[#1F2937] block">{quotes.length}</span>
          <span className="text-xs text-[#6B7280]">اقتباسات موثقة</span>
        </div>

        <div className="bg-white border border-[#E5E0D5] rounded-xl p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-800 flex items-center justify-center mb-2">
            <Star className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-[#1F2937] block">{favorites.length}</span>
          <span className="text-xs text-[#6B7280]">المراجع المفضلة</span>
        </div>
      </div>

      {/* Main Content: Recent References & Alphabet Index */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recently Added References */}
        <div className="lg:col-span-2 bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFEBE4] pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#7D2433]" />
              <h2 className="text-base font-bold text-[#1F2937]">المراجع المضافة حديثاً</h2>
            </div>
            <button
              onClick={onNavigateToLibrary}
              className="text-xs font-semibold text-[#7D2433] hover:underline flex items-center gap-1"
            >
              <span>فتح المكتبة كاملة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentRefs.map((ref) => {
              const isLatin = /^[A-Za-z]/.test(ref.alphabetKey);
              return (
                <div
                  key={ref.id}
                  onClick={() => onSelectReference(ref)}
                  className="p-3.5 rounded-xl border border-[#EBE6DC] hover:border-[#7D2433]/40 bg-[#FCFBF8] hover:bg-white transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span 
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isLatin 
                          ? 'bg-[#EBF1F6] text-[#1E3A8A] border-[#D0DFEB] font-mono' 
                          : 'bg-[#F9ECEF] text-[#7D2433] border-[#F2D1D8] font-citation'
                      }`}
                    >
                      {ref.alphabetKey}
                    </span>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#7D2433] transition-colors truncate font-citation">
                        {ref.title}
                      </h3>
                      <p className="text-xs text-[#6B7280] truncate">
                        {ref.authorFullName || `${ref.authorFamilyName}، ${ref.authorFirstName}`} • {ref.publicationYear || 'بدون سنة'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                      {ref.referenceType.split('(')[0]}
                    </span>
                    {ref.file && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        PDF
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Alphabetical Index & Topic Folders */}
        <div className="space-y-6">
          {/* Alphabet Distribution */}
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-1.5 border-b border-[#EFEBE4] pb-2">
              <span className="w-2 h-2 rounded-full bg-[#7D2433]"></span>
              <span>فهرس الحروف الأبجدية النشطة:</span>
            </h2>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {sortedLetters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => {
                    onSelectLetter(letter);
                    onNavigateToLibrary();
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#FAF8F3] hover:bg-[#7D2433] text-[#374151] hover:text-white border border-[#DDD6CA] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="font-citation text-sm">{letter}</span>
                  <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
                    {letterMap[letter]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Academic Categories Snapshot */}
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-1.5 border-b border-[#EFEBE4] pb-2">
              <FolderTree className="w-4 h-4 text-[#7D2433]" />
              <span>التصنيفات والموضوعات:</span>
            </h2>

            <div className="space-y-2">
              {categories.slice(0, 5).map((cat) => {
                const count = activeRefs.filter((r) => r.categoryIds?.includes(cat.id)).length;
                return (
                  <div key={cat.id} className="flex items-center justify-between text-xs py-1">
                    <span className="font-semibold text-[#374151] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      {cat.name}
                    </span>
                    <span className="text-[#6B7280] font-mono">{count} مرجع</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
