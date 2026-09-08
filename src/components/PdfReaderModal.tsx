import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sun, 
  Moon, 
  Quote, 
  FileText, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft,
  Check
} from 'lucide-react';
import { Reference, CitationQuote } from '../types';
import { dbService } from '../services/db';

interface PdfReaderModalProps {
  reference: Reference | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveQuote?: (quote: CitationQuote) => void;
}

export const PdfReaderModal: React.FC<PdfReaderModalProps> = ({
  reference,
  isOpen,
  onClose,
  onSaveQuote
}) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showQuoteDrawer, setShowQuoteDrawer] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [quotePage, setQuotePage] = useState('1');
  const [quoteCommentary, setQuoteCommentary] = useState('');
  const [quoteSavedNotice, setQuoteSavedNotice] = useState(false);

  useEffect(() => {
    let url: string | null = null;

    async function loadFile() {
      if (reference?.file?.id) {
        const fileRecord = await dbService.getFile(reference.file.id);
        if (fileRecord?.blob) {
          url = URL.createObjectURL(fileRecord.blob);
          setFileUrl(url);
        } else {
          setFileUrl(null);
        }
      } else {
        setFileUrl(null);
      }
    }

    if (isOpen && reference) {
      loadFile();
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [reference, isOpen]);

  // Handle capture quote
  const handleSaveExtractedQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedText.trim() || !reference) return;

    const newQuote: CitationQuote = {
      id: 'q-' + Date.now(),
      referenceId: reference.id,
      referenceTitle: reference.title,
      authorName: reference.authorFullName || reference.authorFamilyName,
      pageNumber: quotePage || '1',
      quoteText: selectedText.trim(),
      commentary: quoteCommentary.trim(),
      tags: ['اقتباس قراءة'],
      createdAt: new Date().toISOString()
    };

    if (onSaveQuote) {
      onSaveQuote(newQuote);
    }
    dbService.saveCitation(newQuote);

    setQuoteSavedNotice(true);
    setTimeout(() => {
      setQuoteSavedNotice(false);
      setShowQuoteDrawer(false);
      setSelectedText('');
      setQuoteCommentary('');
    }, 1500);
  };

  if (!isOpen || !reference) return null;

  const bgClasses = {
    light: 'bg-[#FDFCFA] text-[#1E252B]',
    sepia: 'bg-[#F6F1E7] text-[#332A21]',
    dark: 'bg-[#181C20] text-[#E0E2E5]'
  }[readerTheme];

  const paperClasses = {
    light: 'bg-white shadow-md border-[#E5E0D5] text-[#1F2937]',
    sepia: 'bg-[#FAF6EC] shadow-md border-[#E8E1D3] text-[#2F241A]',
    dark: 'bg-[#21272E] shadow-xl border-[#2F3742] text-[#E2E8F0]'
  }[readerTheme];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col overflow-hidden animate-in fade-in duration-150">
      {/* Reader Top Toolbar */}
      <div className="bg-[#1B242C] text-[#E5E9EC] px-4 py-3 flex items-center justify-between border-b border-[#2E3B46] shrink-0 z-10" dir="rtl">
        {/* Reference Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#7D2433] text-white flex items-center justify-center font-bold text-sm shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs md:text-sm font-bold text-white truncate max-w-xs md:max-w-md font-citation">
              {reference.title}
            </h2>
            <p className="text-[11px] text-[#94A3B8] truncate">
              {reference.authorFullName || reference.authorFamilyName} • {reference.referenceType.split('(')[0]}
            </p>
          </div>
        </div>

        {/* Reader Controls */}
        <div className="flex items-center gap-1.5 md:gap-3 text-xs">
          {/* Paper theme selector */}
          <div className="flex items-center bg-[#273542] rounded-lg p-0.5">
            <button
              onClick={() => setReaderTheme('light')}
              className={`p-1.5 rounded transition-colors ${readerTheme === 'light' ? 'bg-white text-gray-900 font-bold' : 'text-gray-400 hover:text-white'}`}
              title="ورق أبيض"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setReaderTheme('sepia')}
              className={`p-1.5 rounded transition-colors ${readerTheme === 'sepia' ? 'bg-[#FAF6EC] text-[#553C22] font-bold' : 'text-gray-400 hover:text-white'}`}
              title="ورق قديم (سيبيا مريح للعين)"
            >
              <span className="text-[11px] font-bold px-1">سيبيا</span>
            </button>
            <button
              onClick={() => setReaderTheme('dark')}
              className={`p-1.5 rounded transition-colors ${readerTheme === 'dark' ? 'bg-black text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              title="قراءة ليلية"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-[#273542] rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel(Math.max(70, zoomLevel - 10))}
              className="p-1.5 text-gray-300 hover:text-white"
              title="تصغير الخط"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] text-gray-300 font-mono">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(180, zoomLevel + 10))}
              className="p-1.5 text-gray-300 hover:text-white"
              title="تكبير الخط"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Capture Quote Button */}
          <button
            onClick={() => setShowQuoteDrawer(!showQuoteDrawer)}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showQuoteDrawer ? 'bg-amber-600 text-white' : 'bg-[#7D2433] hover:bg-[#681E2A] text-white'
            }`}
            title="اقتباس نص وتخزينه في الرسالة"
          >
            <Quote className="w-3.5 h-3.5" />
            <span className="hidden md:inline">تدوين اقتباس</span>
          </button>

          {/* Download original if available */}
          {fileUrl && (
            <a
              href={fileUrl}
              download={reference.file?.name || `${reference.title}.pdf`}
              className="p-2 text-gray-300 hover:text-white hover:bg-[#273542] rounded-lg transition-colors"
              title="تنزيل الملف"
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-red-900/50 rounded-lg transition-colors cursor-pointer"
            title="إغلاق القارئ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 overflow-auto p-4 md:p-8 flex justify-center relative ${bgClasses}`}>
        {/* If actual PDF file exists */}
        {fileUrl ? (
          <div className="w-full max-w-5xl h-full rounded-xl overflow-hidden shadow-2xl border border-black/20 bg-white">
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title={reference.title}
            />
          </div>
        ) : (
          /* Scholarly Manuscript / Book Reading Mode for references without uploaded PDF */
          <div 
            className={`max-w-3xl w-full mx-auto rounded-2xl p-8 md:p-12 border transition-all ${paperClasses}`}
            style={{ fontSize: `${zoomLevel}%` }}
            dir="rtl"
          >
            {/* Academic Header in document */}
            <div className="text-center border-b pb-6 mb-8 border-current/20">
              <span className="text-xs uppercase tracking-widest opacity-60 font-semibold block mb-2">
                وثيقة أكاديمية مسجلة في مكتبة هريرة
              </span>
              <h1 className="text-2xl md:text-3xl font-bold font-citation mb-3">
                {reference.title}
              </h1>
              <p className="text-sm md:text-base font-semibold opacity-90">
                {reference.authorFullName || reference.authorFamilyName}
              </p>
              {reference.publisher && (
                <p className="text-xs opacity-70 mt-1">
                  {reference.publisher} • {reference.publicationPlace} • {reference.publicationYear}
                </p>
              )}
            </div>

            {/* Verbatim Citation in Document Header */}
            <div className="p-4 rounded-xl mb-8 bg-black/5 border border-black/10 text-xs font-citation leading-relaxed">
              <strong className="block mb-1 opacity-80">الصيغة المعتمدة للتوثيق:</strong>
              {reference.fullCitation}
            </div>

            {/* Sample text / Content viewer */}
            <div className="space-y-6 text-sm md:text-base leading-relaxed font-citation text-justify">
              <p>
                «إن الغاية من هذا المرجع الأكاديمي هي تقديم ركيزة علمية موثقة للبحث في أطروحة الماجستير والدكتوراه. تم تسجيل هذا المرجع تحت حرف التصنيف الأبجدي 
                <strong className="mx-1 text-[#7D2433]">[{reference.alphabetKey}]</strong>
                وفق قاعدة الترتيب المعتمدة في النظام حسب اسم المؤلف.
              </p>

              <p>
                يمكنك رفع ملف الـ PDF الأصلي بالكامل لهذا الكتاب من خلال نافذة تعديل المرجع؛ وعند رفعه سيقوم القارئ بعرض صفحات الكتاب كاملة ومطابقتها صفحة بصفحة مع إمكانية البحث والتظليل.
              </p>

              <div className="my-8 p-5 border-r-4 border-[#7D2433] bg-black/5 rounded-l-lg italic text-base">
                «ملاحظة منهجية: لتدوين أي اقتباس أو شاهد تاريخي من هذا المرجع، اضغط على زر "تدوين اقتباس" في الأعلى، وحدد رقم الصفحة ونص الشاهد، ليتم إدراجه فوراً في مستودع الاقتباسات وحواشي الأطروحة.»
              </div>

              <p>
                الكلمات المفتاحية المرتبطة بهذا المرجع: {reference.keywords.join(' ، ') || 'لا توجد كلمات مفتاحية مسجلة'}.
              </p>
            </div>

            {/* Page number footer */}
            <div className="mt-12 pt-4 border-t border-current/20 flex items-center justify-between text-xs opacity-60">
              <span>مكتبة هريرة للمصادر الأكاديمية</span>
              <span>الصفحة 1 من {reference.pages || '—'}</span>
            </div>
          </div>
        )}

        {/* Quick Quote Capture Drawer */}
        {showQuoteDrawer && (
          <div 
            className="absolute left-4 top-4 bottom-4 w-96 max-w-[90vw] bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 p-5 flex flex-col z-20 animate-in slide-in-from-left duration-200"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-[#7D2433]" />
                <h3 className="font-bold text-sm text-[#1F2937]">اقتباس نص من المرجع</h3>
              </div>
              <button 
                onClick={() => setShowQuoteDrawer(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExtractedQuote} className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    رقم الصفحة في الكتاب:
                  </label>
                  <input
                    type="text"
                    value={quotePage}
                    onChange={(e) => setQuotePage(e.target.value)}
                    placeholder="مثال: 142 أو جـ1، ص 89"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#7D2433] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    نص الاقتباس الحرفي:
                  </label>
                  <textarea
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    rows={6}
                    placeholder="الصق أو اكتب النص المقتبس هنا بدقة..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-citation text-sm leading-relaxed focus:ring-2 focus:ring-[#7D2433] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    تعليق الباحث أو الغرض من الاستشهاد (اختياري):
                  </label>
                  <textarea
                    value={quoteCommentary}
                    onChange={(e) => setQuoteCommentary(e.target.value)}
                    rows={2}
                    placeholder="وجه الاستدلال في الأطروحة..."
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#7D2433] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                {quoteSavedNotice && (
                  <div className="mb-2 p-2 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center gap-1.5 font-semibold">
                    <Check className="w-4 h-4" /> تم حفظ الاقتباس في مستودع الاقتباسات بنجاح!
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  حفظ الاقتباس
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
