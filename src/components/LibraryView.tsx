import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, 
  List, 
  Filter, 
  ArrowUpDown, 
  BookOpen, 
  Plus, 
  FileText, 
  Globe, 
  Search,
  Check
} from 'lucide-react';
import { 
  Reference, 
  ViewMode, 
  CategoryItem, 
  LanguageType, 
  ReferenceType, 
  SortRule 
} from '../types';
import { AlphabetBar } from './AlphabetBar';
import { ReferenceCard } from './ReferenceCard';
import { sortReferences, groupReferencesByLetter, getAuthorCanonicalLetter } from '../services/alphabet';
import { matchesReferenceSearch } from '../services/searchUtils';

interface LibraryViewProps {
  references: Reference[];
  categories: CategoryItem[];
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
  onSelectReference: (ref: Reference) => void;
  onEditReference: (ref: Reference) => void;
  onReadReference: (ref: Reference) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteReference: (id: string) => void;
  onAddNewReference: () => void;
  onDownloadFile?: (ref: Reference) => void;
  onAttachBook?: (ref: Reference, file: File) => void;
  primarySortRule: SortRule;
  onSortRuleChange: (rule: SortRule) => void;
  searchQuery: string;
  onSearchEvidence?: (ref: Reference) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  references,
  categories,
  viewMode,
  onToggleViewMode,
  selectedLetter,
  onSelectLetter,
  onSelectReference,
  onEditReference,
  onReadReference,
  onToggleFavorite,
  onDeleteReference,
  onAddNewReference,
  onDownloadFile,
  onAttachBook,
  primarySortRule,
  onSortRuleChange,
  searchQuery,
  onSearchEvidence
}) => {
  // Local filters
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyWithFiles, setOnlyWithFiles] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter active (non-trash) references
  const filteredReferences = useMemo(() => {
    return references.filter((ref) => {
      if (ref.inTrash) return false;

      // Letter filter
      if (selectedLetter) {
        const canonicalLetter = getAuthorCanonicalLetter(ref);
        if (ref.alphabetKey !== selectedLetter && canonicalLetter !== selectedLetter) {
          return false;
        }
      }

      // Language filter
      if (selectedLanguage !== 'all' && ref.language !== selectedLanguage) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && !ref.categoryIds?.includes(selectedCategory)) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && ref.referenceType !== selectedType) {
        return false;
      }

      // With files filter
      if (onlyWithFiles && !ref.file) {
        return false;
      }

      // Query filter: unified multi-field search (title, author, grandfather, citation, keywords)
      if (searchQuery.trim()) {
        if (!matchesReferenceSearch(ref, searchQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [references, selectedLetter, selectedLanguage, selectedCategory, selectedType, onlyWithFiles, searchQuery]);

  // Sort references
  const sortedReferences = useMemo(() => {
    return sortReferences(filteredReferences, primarySortRule, 'asc');
  }, [filteredReferences, primarySortRule]);

  // Calculate letter counts across all active references
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    references
      .filter((r) => !r.inTrash)
      .forEach((r) => {
        const k = getAuthorCanonicalLetter(r);
        counts[k] = (counts[k] || 0) + 1;
      });
    return counts;
  }, [references]);

  // Group sorted references by letter if sorting by author
  const groupedByLetter = useMemo(() => {
    if (primarySortRule === 'author') {
      return groupReferencesByLetter(sortedReferences);
    }
    return null;
  }, [sortedReferences, primarySortRule]);

  return (
    <div id="library-view" className="space-y-5 max-w-7xl mx-auto pb-16 text-right" dir="rtl">
      {/* 1. Alphabetical Navigation Bar (Core Feature requested) */}
      <AlphabetBar
        selectedLetter={selectedLetter}
        onSelectLetter={onSelectLetter}
        letterCounts={letterCounts}
      />

      {/* 2. Library Header Controls & Filter Bar */}
      <div className="bg-white border border-[#E5E0D5] rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#1F2937] text-base font-citation">
            المراجع الأكاديمية
          </span>
          <span className="bg-[#FAF8F5] text-[#554E45] border border-[#DDD6CA] px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {sortedReferences.length} مرجع مسجل
          </span>
          {searchQuery && (
            <span className="text-xs text-[#7D2433] bg-[#F7EBEF] px-2 py-0.5 rounded">
              نتائج البحث عن: «{searchQuery}»
            </span>
          )}
        </div>

        {/* Action buttons & View mode toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#DDD6CA] px-2.5 py-1.5 rounded-lg text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#7D2433]" />
            <span className="text-[#6B7280]">قاعدة الترتيب:</span>
            <select
              value={primarySortRule}
              onChange={(e) => onSortRuleChange(e.target.value as SortRule)}
              className="bg-transparent font-semibold text-[#1F2937] outline-none cursor-pointer"
            >
              <option value="author">1. بأول اسم المؤلف (الاسم الأول - المعتمد)</option>
              <option value="title">2. عنوان الكتاب</option>
              <option value="year">3. سنة النشر</option>
              <option value="dateAdded">4. تاريخ الإضافة</option>
              <option value="type">5. نوع المصدر</option>
            </select>
          </div>

          {/* Toggle Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showFilters || selectedLanguage !== 'all' || selectedCategory !== 'all' || selectedType !== 'all' || onlyWithFiles
                ? 'bg-[#7D2433]/10 border-[#7D2433] text-[#7D2433]'
                : 'bg-white border-[#DDD6CA] text-[#4B5563] hover:bg-[#F3EFE7]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>تصفية متقدمة</span>
          </button>

          {/* View Mode Toggle: Grid View vs List View */}
          <div className="flex items-center bg-[#F3EFE7] p-0.5 rounded-lg border border-[#DDD6CA]">
            <button
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#7D2433] shadow-xs font-bold'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
              title="عرض الشبكة (Grid View)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleViewMode('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#7D2433] shadow-xs font-bold'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
              title="عرض القائمة (List View)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Add Reference button */}
          <button
            onClick={onAddNewReference}
            className="px-3 py-1.5 bg-[#7D2433] hover:bg-[#681E2A] text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مرجع</span>
          </button>
        </div>
      </div>

      {/* Expanded Filters Drawer */}
      {showFilters && (
        <div className="bg-[#FAF8F5] border border-[#E5E0D5] rounded-xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in slide-in-from-top duration-150">
          <div>
            <label className="block text-[#4B5563] font-semibold mb-1">اللغة:</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-2 bg-white border border-[#DDD6CA] rounded-lg outline-none"
            >
              <option value="all">جميع اللغات</option>
              <option value="العربية">العربية</option>
              <option value="English">English</option>
              <option value="Français">Français</option>
              <option value="Greek">Greek</option>
              <option value="Deutsch">Deutsch</option>
              <option value="Latin">Latin</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-[#4B5563] font-semibold mb-1">نوع المرجع:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 bg-white border border-[#DDD6CA] rounded-lg outline-none"
            >
              <option value="all">جميع الأنواع</option>
              <option value="كتاب (Book)">كتاب (Book)</option>
              <option value="مصدر أصلي / مخطوط (Primary Source)">مصدر أصلي / مخطوط</option>
              <option value="رسالة ماجستير (Master Thesis)">رسالة ماجستير</option>
              <option value="أطروحة دكتوراه (PhD Dissertation)">أطروحة دكتوراه</option>
              <option value="مقالة في دورية محكمة (Journal Article)">مقالة دورية</option>
              <option value="وثيقة أرشيفية (Archival Document)">وثيقة أرشيفية</option>
              <option value="فصل في كتاب (Book Section)">فصل في كتاب</option>
            </select>
          </div>

          <div>
            <label className="block text-[#4B5563] font-semibold mb-1">التصنيف الموضوعي:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-white border border-[#DDD6CA] rounded-lg outline-none"
            >
              <option value="all">جميع التصنيفات</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="inline-flex items-center gap-2 p-2 bg-white border border-[#DDD6CA] rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={onlyWithFiles}
                onChange={(e) => setOnlyWithFiles(e.target.checked)}
                className="rounded text-[#7D2433] focus:ring-[#7D2433]"
              />
              <span className="font-semibold text-[#374151]">عرض المراجع التي تحتوي على ملف PDF فقط</span>
            </label>
          </div>
        </div>
      )}

      {/* 3. Empty State */}
      {sortedReferences.length === 0 && (
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-[#9CA3AF]" />
          <h3 className="text-lg font-bold text-[#1F2937]">لا توجد مراجع تطابق معايير البحث أو التصفية الحالية</h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
            {selectedLetter
              ? `لم يتم العثور على مراجع تبدأ بالحرف «${selectedLetter}». اضغط على زر "عرض الكل" في شريط الحروف لرؤية باقي المكتبة.`
              : 'يمكنك إضافة مرجع جديد بسهولة بالنقر على زر إضافة مرجع أعلاه.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            {selectedLetter && (
              <button
                onClick={() => onSelectLetter(null)}
                className="px-4 py-2 bg-white border border-[#DDD6CA] hover:bg-[#F3EFE7] text-xs font-semibold rounded-lg cursor-pointer"
              >
                إلغاء تحديد الحرف (عرض الكل)
              </button>
            )}
            <button
              onClick={onAddNewReference}
              className="px-4 py-2 bg-[#7D2433] text-white text-xs font-bold rounded-lg hover:bg-[#681E2A] cursor-pointer"
            >
              إضافة مرجع جديد الآن
            </button>
          </div>
        </div>
      )}

      {/* 4. Display References Grouped by Letter or List */}
      {groupedByLetter && selectedLetter === null ? (
        // Alphabetical Grouped Sections (e.g. A, B, C or أ, ب, ت)
        <div className="space-y-8">
          {Object.entries(groupedByLetter).map(([letter, refsInLetterRaw]) => {
            const refsInLetter = refsInLetterRaw as Reference[];
            const isLatin = /^[A-Za-z]/.test(letter);
            return (
              <div key={letter} id={`letter-section-${letter}`} className="space-y-3">
                {/* Letter Header Bar */}
                <div className="flex items-center gap-3 border-b-2 border-[#DCD5C9] pb-1.5">
                  <div 
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg border shadow-xs ${
                      isLatin
                        ? 'bg-[#EBF1F6] text-[#1E3A8A] border-[#D0DFEB] font-mono'
                        : 'bg-[#F9ECEF] text-[#7D2433] border-[#F2D1D8] font-citation'
                    }`}
                  >
                    {letter}
                  </div>
                  <h3 className="font-bold text-base text-[#1F2937]">
                    فهرس حرف «{letter}»
                  </h3>
                  <span className="text-xs text-[#8C827A] font-medium">
                    ({refsInLetter.length} مرجع)
                  </span>
                  <div className="flex-1 h-px bg-[#E2DDD3]"></div>
                </div>

                {/* Items in this letter */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {refsInLetter.map((ref) => (
                      <ReferenceCard
                        key={ref.id}
                        reference={ref}
                        viewMode="grid"
                        onSelect={onSelectReference}
                        onEdit={onEditReference}
                        onRead={onReadReference}
                        onToggleFavorite={onToggleFavorite}
                        onDelete={onDeleteReference}
                        onDownloadFile={onDownloadFile}
                        onAttachBook={onAttachBook}
                        onSearchEvidence={onSearchEvidence}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {refsInLetter.map((ref) => (
                      <ReferenceCard
                        key={ref.id}
                        reference={ref}
                        viewMode="list"
                        onSelect={onSelectReference}
                        onEdit={onEditReference}
                        onRead={onReadReference}
                        onToggleFavorite={onToggleFavorite}
                        onDelete={onDeleteReference}
                        onDownloadFile={onDownloadFile}
                        onAttachBook={onAttachBook}
                        onSearchEvidence={onSearchEvidence}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Non-grouped view (when filtered by a specific letter or sorting by date/title/year)
        <div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedReferences.map((ref) => (
                <ReferenceCard
                  key={ref.id}
                  reference={ref}
                  viewMode="grid"
                  onSelect={onSelectReference}
                  onEdit={onEditReference}
                  onRead={onReadReference}
                  onToggleFavorite={onToggleFavorite}
                  onDelete={onDeleteReference}
                  onDownloadFile={onDownloadFile}
                  onAttachBook={onAttachBook}
                  onSearchEvidence={onSearchEvidence}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedReferences.map((ref) => (
                <ReferenceCard
                  key={ref.id}
                  reference={ref}
                  viewMode="list"
                  onSelect={onSelectReference}
                  onEdit={onEditReference}
                  onRead={onReadReference}
                  onToggleFavorite={onToggleFavorite}
                  onDelete={onDeleteReference}
                  onDownloadFile={onDownloadFile}
                  onAttachBook={onAttachBook}
                  onSearchEvidence={onSearchEvidence}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
