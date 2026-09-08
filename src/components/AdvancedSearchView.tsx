import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw, 
  BookOpen, 
  Calendar, 
  FileText, 
  Globe, 
  Tag 
} from 'lucide-react';
import { Reference, CategoryItem, ViewMode } from '../types';
import { ReferenceCard } from './ReferenceCard';

interface AdvancedSearchViewProps {
  references: Reference[];
  categories: CategoryItem[];
  onSelectReference: (ref: Reference) => void;
  onEditReference: (ref: Reference) => void;
  onReadReference: (ref: Reference) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteReference: (id: string) => void;
}

export const AdvancedSearchView: React.FC<AdvancedSearchViewProps> = ({
  references,
  categories,
  onSelectReference,
  onEditReference,
  onReadReference,
  onToggleFavorite,
  onDeleteReference
}) => {
  const [authorQuery, setAuthorQuery] = useState('');
  const [titleQuery, setTitleQuery] = useState('');
  const [citationQuery, setCitationQuery] = useState('');
  const [publisherQuery, setPublisherQuery] = useState('');
  const [keywordQuery, setKeywordQuery] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [language, setLanguage] = useState('all');
  const [referenceType, setReferenceType] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [hasFile, setHasFile] = useState<'any' | 'yes' | 'no'>('any');

  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const handleReset = () => {
    setAuthorQuery('');
    setTitleQuery('');
    setCitationQuery('');
    setPublisherQuery('');
    setKeywordQuery('');
    setYearFrom('');
    setYearTo('');
    setLanguage('all');
    setReferenceType('all');
    setCategoryId('all');
    setHasFile('any');
    setHasSearched(false);
  };

  const results = references.filter((ref) => {
    if (ref.inTrash) return false;

    if (authorQuery.trim()) {
      const q = authorQuery.trim().toLowerCase();
      const match = (ref.authorFullName || '').toLowerCase().includes(q) ||
                    (ref.authorFamilyName || '').toLowerCase().includes(q) ||
                    (ref.authorFirstName || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    if (titleQuery.trim()) {
      const q = titleQuery.trim().toLowerCase();
      if (!ref.title.toLowerCase().includes(q) && !(ref.subtitle || '').toLowerCase().includes(q)) {
        return false;
      }
    }

    if (citationQuery.trim()) {
      const q = citationQuery.trim().toLowerCase();
      if (!(ref.fullCitation || '').toLowerCase().includes(q)) {
        return false;
      }
    }

    if (publisherQuery.trim()) {
      const q = publisherQuery.trim().toLowerCase();
      if (!(ref.publisher || '').toLowerCase().includes(q) && !(ref.publicationPlace || '').toLowerCase().includes(q)) {
        return false;
      }
    }

    if (keywordQuery.trim()) {
      const q = keywordQuery.trim().toLowerCase();
      const match = ref.keywords?.some((k) => k.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (yearFrom.trim()) {
      const yF = parseInt(yearFrom.trim(), 10);
      const refY = parseInt(ref.publicationYear || '0', 10);
      if (isNaN(yF) || refY < yF) return false;
    }

    if (yearTo.trim()) {
      const yT = parseInt(yearTo.trim(), 10);
      const refY = parseInt(ref.publicationYear || '9999', 10);
      if (isNaN(yT) || refY > yT) return false;
    }

    if (language !== 'all' && ref.language !== language) {
      return false;
    }

    if (referenceType !== 'all' && ref.referenceType !== referenceType) {
      return false;
    }

    if (categoryId !== 'all' && !ref.categoryIds?.includes(categoryId)) {
      return false;
    }

    if (hasFile === 'yes' && !ref.file) return false;
    if (hasFile === 'no' && ref.file) return false;

    return true;
  });

  return (
    <div id="advanced-search-view" className="space-y-6 max-w-6xl mx-auto pb-16 text-right" dir="rtl">
      {/* Header */}
      <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EFEBE4] pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#7D2433]" />
            <h1 className="text-lg font-bold text-[#1F2937]">البحث الأكاديمي المتقدم</h1>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-[#6B7280] hover:text-[#111827] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط المعايير</span>
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs md:text-sm">
          <div>
            <label className="block font-semibold text-[#374151] mb-1">اسم المؤلف أو الشهرة:</label>
            <input
              type="text"
              value={authorQuery}
              onChange={(e) => {
                setAuthorQuery(e.target.value);
                setHasSearched(true);
              }}
              placeholder="مثال: كومنينا أو Akropolites"
              className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">عنوان المرجع أو الكتاب:</label>
            <input
              type="text"
              value={titleQuery}
              onChange={(e) => {
                setTitleQuery(e.target.value);
                setHasSearched(true);
              }}
              placeholder="مثال: الألكسياد أو History"
              className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">في نص الصيغة الكاملة للمرجع:</label>
            <input
              type="text"
              value={citationQuery}
              onChange={(e) => {
                setCitationQuery(e.target.value);
                setHasSearched(true);
              }}
              placeholder="بحث في نصوص التوثيق..."
              className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">دار النشر أو مكان النشر:</label>
            <input
              type="text"
              value={publisherQuery}
              onChange={(e) => {
                setPublisherQuery(e.target.value);
                setHasSearched(true);
              }}
              placeholder="مثال: Oxford أو القاهرة"
              className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">الكلمات المفتاحية والوسوم:</label>
            <input
              type="text"
              value={keywordQuery}
              onChange={(e) => {
                setKeywordQuery(e.target.value);
                setHasSearched(true);
              }}
              placeholder="مثال: بيزنطة أو الحملة الأولى"
              className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">من سنة:</label>
              <input
                type="text"
                value={yearFrom}
                onChange={(e) => {
                  setYearFrom(e.target.value);
                  setHasSearched(true);
                }}
                placeholder="1900"
                className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1">إلى سنة:</label>
              <input
                type="text"
                value={yearTo}
                onChange={(e) => {
                  setYearTo(e.target.value);
                  setHasSearched(true);
                }}
                placeholder="2026"
                className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">اللغة:</label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setHasSearched(true);
              }}
              className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
            >
              <option value="all">جميع اللغات</option>
              <option value="العربية">العربية</option>
              <option value="English">English</option>
              <option value="Français">Français</option>
              <option value="Greek">Greek</option>
              <option value="Deutsch">Deutsch</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">نوع المرجع:</label>
            <select
              value={referenceType}
              onChange={(e) => {
                setReferenceType(e.target.value);
                setHasSearched(true);
              }}
              className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
            >
              <option value="all">جميع الأنواع</option>
              <option value="كتاب (Book)">كتاب (Book)</option>
              <option value="مصدر أصلي / مخطوط (Primary Source)">مصدر أصلي / مخطوط</option>
              <option value="رسالة ماجستير (Master Thesis)">رسالة ماجستير</option>
              <option value="أطروحة دكتوراه (PhD Dissertation)">أطروحة دكتوراه</option>
              <option value="مقالة في دورية محكمة (Journal Article)">مقالة دورية</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#374151] mb-1">حالة ملف الـ PDF:</label>
            <select
              value={hasFile}
              onChange={(e) => {
                setHasFile(e.target.value as any);
                setHasSearched(true);
              }}
              className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
            >
              <option value="any">الكل (بملف وبدون ملف)</option>
              <option value="yes">فقط التي تحتوي على ملف PDF</option>
              <option value="no">فقط التي ليس لها ملف</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#1F2937]">
          نتائج البحث المطابقة: ({results.length} مرجع)
        </h2>

        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#DDD6CA]">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
              viewMode === 'grid' ? 'bg-[#7D2433] text-white' : 'text-[#6B7280]'
            }`}
          >
            شبكة
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
              viewMode === 'list' ? 'bg-[#7D2433] text-white' : 'text-[#6B7280]'
            }`}
          >
            قائمة
          </button>
        </div>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-12 text-center text-[#6B7280] space-y-2">
          <Search className="w-10 h-10 mx-auto text-[#9CA3AF]" />
          <p className="font-semibold text-sm text-[#1F2937]">لم يتم العثور على مراجع تطابق هذه المعايير</p>
          <p className="text-xs">جرب تقليل شروط البحث أو التحقق من دقة اسم المؤلف والكلمات المفتاحية.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {results.map((ref) => (
            <ReferenceCard
              key={ref.id}
              reference={ref}
              viewMode={viewMode}
              onSelect={onSelectReference}
              onEdit={onEditReference}
              onRead={onReadReference}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDeleteReference}
            />
          ))}
        </div>
      )}
    </div>
  );
};
