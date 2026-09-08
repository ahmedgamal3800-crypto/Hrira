import React, { useState } from 'react';
import { 
  Quote, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Sparkles,
  X 
} from 'lucide-react';
import { CitationQuote, Reference } from '../types';

interface CitationsViewProps {
  citations: CitationQuote[];
  references: Reference[];
  onSaveCitation: (citation: CitationQuote) => void;
  onDeleteCitation: (id: string) => void;
  onSelectReference: (ref: Reference) => void;
}

export const CitationsView: React.FC<CitationsViewProps> = ({
  citations,
  references,
  onSaveCitation,
  onDeleteCitation,
  onSelectReference
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRefId, setSelectedRefId] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editQuoteId, setEditQuoteId] = useState<string | null>(null);

  // Form
  const [refId, setRefId] = useState(references[0]?.id || '');
  const [quoteText, setQuoteText] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [commentary, setCommentary] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeRefs = references.filter((r) => !r.inTrash);

  const handleStartNew = () => {
    setEditQuoteId(null);
    setRefId(activeRefs[0]?.id || '');
    setQuoteText('');
    setPageNumber('');
    setCommentary('');
    setIsFormOpen(true);
  };

  const handleStartEdit = (q: CitationQuote) => {
    setEditQuoteId(q.id);
    setRefId(q.referenceId);
    setQuoteText(q.quoteText);
    setPageNumber(q.pageNumber);
    setCommentary(q.commentary || '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteText.trim() || !refId) return;

    const matchedRef = references.find((r) => r.id === refId);

    const quoteToSave: CitationQuote = {
      id: editQuoteId || 'q-' + Date.now(),
      referenceId: refId,
      referenceTitle: matchedRef?.title || '',
      authorName: matchedRef?.authorFullName || matchedRef?.authorFamilyName || '',
      pageNumber: pageNumber.trim() || '1',
      quoteText: quoteText.trim(),
      commentary: commentary.trim(),
      tags: ['اقتباس بحثي'],
      createdAt: editQuoteId ? (citations.find((c) => c.id === editQuoteId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    onSaveCitation(quoteToSave);
    setIsFormOpen(false);
  };

  const handleCopyFootnote = (q: CitationQuote) => {
    const matchedRef = references.find((r) => r.id === q.referenceId);
    let footnote = `«${q.quoteText}»\n— [انظر: ${q.authorName}: ${q.referenceTitle}، ص ${q.pageNumber}]`;
    if (matchedRef?.fullCitation) {
      footnote += `\n(التوثيق الكامل: ${matchedRef.fullCitation})`;
    }
    navigator.clipboard.writeText(footnote);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCitations = citations.filter((c) => {
    if (selectedRefId !== 'all' && c.referenceId !== selectedRefId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchText = c.quoteText.toLowerCase().includes(q);
      const matchComment = (c.commentary || '').toLowerCase().includes(q);
      const matchAuthor = c.authorName.toLowerCase().includes(q);
      const matchTitle = c.referenceTitle.toLowerCase().includes(q);
      if (!matchText && !matchComment && !matchAuthor && !matchTitle) return false;
    }
    return true;
  });

  return (
    <div id="citations-view" className="space-y-6 max-w-5xl mx-auto pb-16 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#7D2433] text-white flex items-center justify-center font-bold">
            <Quote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">مستودع الاقتباسات والنصوص الشاهدة</h1>
            <p className="text-xs text-[#6B7280]">
              جمع الشواهد النصية من أمهات الكتب والمصادر موثقة بالصفحة، جاهزة للإدراج في الحواشي
            </p>
          </div>
        </div>

        <button
          onClick={handleStartNew}
          className="px-4 py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة اقتباس جديد</span>
        </button>
      </div>

      {/* Quote Form Modal */}
      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-white border-2 border-[#7D2433]/30 rounded-2xl p-6 shadow-md space-y-4 animate-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-bold text-[#1F2937]">
              {editQuoteId ? 'تعديل الاقتباس الأكاديمي' : 'تسجيل اقتباس جديد من مصدر'}
            </h2>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">المرجع المقتبس منه: <span className="text-red-500">*</span></label>
              <select
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
                required
              >
                {activeRefs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} — {r.authorFullName || r.authorFamilyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">رقم الصفحة في الطبعة: <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder="مثال: 142 أو جـ1، ص 89"
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1 text-xs">
              النص المقتبس حرفياً: <span className="text-red-500">*</span>
            </label>
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              rows={5}
              placeholder="«أدخل النص المقتبس هنا بدقة كما ورد في الأصل دون تصرف...»"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm font-citation leading-relaxed outline-none focus:ring-2 focus:ring-[#7D2433]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1 text-xs">
              تعليق الباحث وموضع الاستشهاد في فصول الأطروحة (اختياري):
            </label>
            <textarea
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              rows={2}
              placeholder="مثال: يستخدم هذا الشاهد في الفصل الثاني لإثبات موقف القيصر من الحملة..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#7D2433]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white rounded-lg text-xs font-bold shadow-xs"
            >
              حفظ الاقتباس
            </button>
          </div>
        </form>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-[#E5E0D5] rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#8C827A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في نصوص الاقتباسات أو التعليقات..."
            className="w-full bg-transparent outline-none text-[#1F2937]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#6B7280]">تصفية بالمرجع:</span>
          <select
            value={selectedRefId}
            onChange={(e) => setSelectedRefId(e.target.value)}
            className="p-1.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none text-xs"
          >
            <option value="all">جميع المراجع ({citations.length})</option>
            {activeRefs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Citations List */}
      {filteredCitations.length === 0 ? (
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-12 text-center text-[#6B7280] space-y-2">
          <Quote className="w-12 h-12 mx-auto text-[#CBD5E1]" />
          <p className="font-bold text-sm text-[#1F2937]">لا توجد شواهد أو اقتباسات مسجلة</p>
          <p className="text-xs">
            يمكنك تدوين الشواهد النصية من هنا أو مباشرة من داخل قارئ ملفات الـ PDF المدمج.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCitations.map((quote) => {
            const matchedRef = references.find((r) => r.id === quote.referenceId);

            return (
              <div
                key={quote.id}
                className="bg-white border border-[#E5E0D5] hover:border-[#7D2433]/40 rounded-2xl p-5 shadow-2xs transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[#F0EBE1] pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#7D2433] bg-[#F9ECEF] px-2 py-0.5 rounded">
                      صفحة: {quote.pageNumber}
                    </span>
                    {matchedRef ? (
                      <button
                        onClick={() => onSelectReference(matchedRef)}
                        className="font-bold text-[#1F2937] hover:text-[#7D2433] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{quote.referenceTitle}</span>
                        <span className="text-[#8C827A] font-normal">({quote.authorName})</span>
                      </button>
                    ) : (
                      <span className="font-bold text-[#1F2937]">{quote.referenceTitle}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopyFootnote(quote)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F3] hover:bg-[#7D2433] text-[#4A5568] hover:text-white border border-[#DDD6CA] rounded-md transition-colors text-xs font-semibold cursor-pointer"
                      title="نسخ الشاهد والتوثيق كحاشية سفلية"
                    >
                      {copiedId === quote.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ كحاشية</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleStartEdit(quote)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteCitation(quote.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quote Text */}
                <blockquote className="font-citation text-base md:text-lg text-[#111827] leading-relaxed border-r-4 border-[#7D2433] pr-4 py-1 italic bg-[#FAF8F5] p-3 rounded-l-xl">
                  {quote.quoteText}
                </blockquote>

                {/* Commentary */}
                {quote.commentary && (
                  <div className="text-xs text-[#4B5563] bg-[#F7F5EE] p-3 rounded-lg border border-[#E9E4D8]">
                    <strong className="text-[#1F2937]">تعليق الباحث وموضع الشاهد:</strong> {quote.commentary}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
