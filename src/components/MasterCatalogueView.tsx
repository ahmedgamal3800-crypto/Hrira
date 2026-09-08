import React, { useState, useMemo, useRef } from 'react';
import { 
  RefreshCw, 
  BookOpen, 
  BookMarked, 
  CheckCircle2, 
  Copy, 
  Check, 
  Search, 
  Download, 
  Calendar, 
  User, 
  FileText, 
  Paperclip, 
  Star, 
  Database,
  Eye,
  Edit3,
  Clock,
  Sparkles,
  List,
  LayoutGrid,
  GraduationCap
} from 'lucide-react';
import { Reference, CategoryItem, ToolMemoryState, AppSettings } from '../types';
import { 
  getCanonicalBookSortKey, 
  getCanonicalBookLetter, 
  compareCanonicalLetters,
  getAuthorFirstNameSortKey,
  getAuthorFirstNameLetter,
  cleanLeadingSymbols,
  normalizeArabicChar,
  ARABIC_LETTERS 
} from '../services/alphabet';

interface MasterCatalogueViewProps {
  references: Reference[];
  categories: CategoryItem[];
  toolMemory: ToolMemoryState | null;
  onRefreshMemory: () => Promise<ToolMemoryState>;
  onSelectReference: (ref: Reference) => void;
  onEditReference: (ref: Reference) => void;
  onReadReference: (ref: Reference) => void;
  onToggleFavorite: (id: string) => void;
  onAttachBook?: (ref: Reference, file: File) => void;
  onDownloadFile?: (ref: Reference) => void;
  onSearchEvidence?: (ref: Reference) => void;
  settings: AppSettings;
}

export const MasterCatalogueView: React.FC<MasterCatalogueViewProps> = ({
  references,
  categories,
  toolMemory,
  onRefreshMemory,
  onSelectReference,
  onEditReference,
  onReadReference,
  onToggleFavorite,
  onAttachBook,
  onDownloadFile,
  onSearchEvidence,
  settings
}) => {
  // State for user-requested update
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccessMessage, setRefreshSuccessMessage] = useState<string | null>(null);

  // Sorting mode: defaults to 'author_first_name' (الترتيب بأول اسم المؤلف وليس عنوان الكتاب)
  const [sortMethod, setSortMethod] = useState<'author_first_name' | 'author_family' | 'book_title'>('author_first_name');

  // View style: 'registry' (Canonical Academic Table/List) or 'cards' (Canonical Cards)
  const [viewStyle, setViewStyle] = useState<'registry' | 'cards'>('registry');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [hasFileFilter, setHasFileFilter] = useState<'all' | 'with_file' | 'without_file'>('all');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [stripArticle, setStripArticle] = useState<boolean>(true);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);

  // Quick attach file ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetRefForAttach, setTargetRefForAttach] = useState<Reference | null>(null);

  // Active (non-trash) references
  const activeRefs = useMemo(() => {
    return references.filter((r) => !r.inTrash);
  }, [references]);

  // Canonical Sort: Defaults strictly to Author's First Name (باول اسم المؤلف)
  const filteredAndSortedBooks = useMemo(() => {
    let result = activeRefs.filter((ref) => {
      // Type filter
      if (selectedType !== 'all' && ref.referenceType !== selectedType) {
        return false;
      }
      // File filter
      if (hasFileFilter === 'with_file' && !(ref.file?.id || ref.file?.name)) {
        return false;
      }
      if (hasFileFilter === 'without_file' && (ref.file?.id || ref.file?.name)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = ref.title.toLowerCase().includes(q) || (ref.subtitle || '').toLowerCase().includes(q);
        const matchAuthor = (ref.authorFullName || '').toLowerCase().includes(q) ||
                            (ref.authorFamilyName || '').toLowerCase().includes(q) ||
                            (ref.authorFirstName || '').toLowerCase().includes(q);
        const matchPublisher = (ref.publisher || '').toLowerCase().includes(q);
        const matchYear = (ref.publicationYear || '').includes(q);
        const matchKeywords = (ref.keywords || []).some(kw => kw.toLowerCase().includes(q));
        if (!matchTitle && !matchAuthor && !matchPublisher && !matchYear && !matchKeywords) {
          return false;
        }
      }
      return true;
    });

    // Strict alphabetical sort
    result.sort((a, b) => {
      if (sortMethod === 'author_first_name') {
        const keyA = getAuthorFirstNameSortKey(a, stripArticle);
        const keyB = getAuthorFirstNameSortKey(b, stripArticle);
        const cmp = keyA.localeCompare(keyB, ['ar', 'en'], { sensitivity: 'base', numeric: true });
        if (cmp !== 0) return cmp;
        return a.title.localeCompare(b.title, ['ar', 'en']);
      } else if (sortMethod === 'book_title') {
        const keyA = getCanonicalBookSortKey(a.title, stripArticle);
        const keyB = getCanonicalBookSortKey(b.title, stripArticle);
        return keyA.localeCompare(keyB, ['ar', 'en'], { sensitivity: 'base', numeric: true });
      } else {
        const keyA = cleanLeadingSymbols(a.authorFamilyName || a.authorFullName || a.title);
        const keyB = cleanLeadingSymbols(b.authorFamilyName || b.authorFullName || b.title);
        return keyA.localeCompare(keyB, ['ar', 'en'], { sensitivity: 'base', numeric: true });
      }
    });

    return result;
  }, [activeRefs, sortMethod, stripArticle, selectedType, hasFileFilter, searchQuery]);

  // Group books/references by alphabetical letter
  const groupedByLetter = useMemo(() => {
    const map = new Map<string, Reference[]>();

    filteredAndSortedBooks.forEach((ref) => {
      let letter = '#';
      if (sortMethod === 'author_first_name') {
        letter = getAuthorFirstNameLetter(ref, stripArticle);
      } else if (sortMethod === 'book_title') {
        letter = getCanonicalBookLetter(ref.title, stripArticle);
      } else {
        const key = cleanLeadingSymbols(ref.authorFamilyName || ref.authorFullName || ref.title);
        letter = key ? normalizeArabicChar(key.charAt(0)) : '#';
      }
      if (!map.has(letter)) {
        map.set(letter, []);
      }
      map.get(letter)!.push(ref);
    });

    // Sort letter groups according to canonical sequence
    const sortedEntries = Array.from(map.entries()).sort(([letA], [letB]) => {
      return compareCanonicalLetters(letA, letB);
    });

    return sortedEntries;
  }, [filteredAndSortedBooks, sortMethod, stripArticle]);

  // Available letters for the jump bar
  const availableLetters = useMemo(() => {
    return groupedByLetter.map(([letter, items]) => ({
      letter,
      count: items.length
    }));
  }, [groupedByLetter]);

  // Displayed groups (either single letter selected or all)
  const displayedGroups = useMemo(() => {
    if (!selectedLetter) return groupedByLetter;
    return groupedByLetter.filter(([letter]) => letter === selectedLetter);
  }, [groupedByLetter, selectedLetter]);

  // User-requested refresh handler
  const handleUserRequestedRefresh = async () => {
    try {
      setIsRefreshing(true);
      setRefreshSuccessMessage(null);
      const newMemory = await onRefreshMemory();
      setRefreshSuccessMessage(`تم تحديث فهرس المراجع وذاكرة الأداة بنجاح (فهرسة ${newMemory.totalBooksIndexed} كتاباً ومصدراً).`);
      setTimeout(() => setRefreshSuccessMessage(null), 4500);
    } catch (err) {
      console.error('Failed to refresh catalogue', err);
      setRefreshSuccessMessage('تعذر تحديث الفهرس، حاول مجدداً.');
      setTimeout(() => setRefreshSuccessMessage(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Copy canonical citation for single book
  const handleCopyCitation = (ref: Reference) => {
    const author = ref.authorFullName || `${ref.authorFirstName} ${ref.authorFamilyName}`.trim() || 'مؤلف غير محدد';
    const textToCopy = ref.fullCitation || `${author}: «${ref.title}»، ${ref.publisher ? ref.publisher + '، ' : ''}${ref.publicationYear || ''}.`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(ref.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Copy full alphabetical canonical catalogue
  const handleCopyAllBibliography = () => {
    const sortLabel = sortMethod === 'author_first_name' 
      ? 'أول اسم المؤلف (الاسم الأول)' 
      : sortMethod === 'book_title' 
      ? 'عنوان الكتاب' 
      : 'اسم الشهرة / العائلة';

    let text = `فهرس المراجع والكتب الأبجدي الشامل (مرتب بـ: ${sortLabel})\n`;
    text += `مشروع الأطروحة: ${settings.thesisTitle || 'الدراسات الأكاديمية'}\n`;
    text += `إعداد الباحث: ${settings.researcherName || 'الباحث الأكاديمي'}\n`;
    text += `تاريخ التحديث والاستخراج: ${new Date().toLocaleDateString('ar-EG')}\n`;
    text += `إجمالي المراجع المفهرسة: ${filteredAndSortedBooks.length}\n`;
    text += `قاعدة الترتيب المعتمدة: ${sortLabel}\n`;
    text += `==========================================================\n\n`;

    let globalCounter = 1;
    groupedByLetter.forEach(([letter, items]) => {
      text += `[ حرف ${letter} ] - (${items.length} ${items.length === 1 ? 'مرجع' : 'مراجع'})\n`;
      text += `----------------------------------------------------------\n`;
      items.forEach((item) => {
        const author = item.authorFullName || `${item.authorFirstName} ${item.authorFamilyName}`.trim() || 'مؤلف غير محدد';
        const pubInfo = [
          item.edition ? `ط${item.edition}` : '',
          item.publicationPlace ? item.publicationPlace : '',
          item.publisher ? item.publisher : '',
          item.publicationYear ? item.publicationYear : ''
        ].filter(Boolean).join('، ');

        text += `${globalCounter}. ${author}: «${item.title}»${pubInfo ? ' (' + pubInfo + ')' : ''}.\n`;
        if (item.fullCitation && item.fullCitation !== item.title) {
          text += `   الصيغة التوثيقية: ${item.fullCitation}\n`;
        }
        globalCounter++;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  // Download complete catalogue as TXT
  const handleDownloadBibliographyText = () => {
    const sortLabel = sortMethod === 'author_first_name' 
      ? 'أول اسم المؤلف (الاسم الأول)' 
      : sortMethod === 'book_title' 
      ? 'عنوان الكتاب' 
      : 'اسم الشهرة / العائلة';

    let content = `==============================================================\n`;
    content += `        فهرس المراجع والكتب الأبجدي الشامل\n`;
    content += `         (مرتب بـ: ${sortLabel})\n`;
    content += `        الأطروحة: ${settings.thesisTitle || 'مشروع البحث الأكاديمي'}\n`;
    content += `        الباحث: ${settings.researcherName || 'الباحث'}\n`;
    content += `        تاريخ التحديث: ${new Date().toLocaleString('ar-EG')}\n`;
    content += `        عدد المراجع والكتب المفهرسة: ${filteredAndSortedBooks.length}\n`;
    content += `==============================================================\n\n`;

    let globalCounter = 1;
    groupedByLetter.forEach(([letter, items]) => {
      content += `==============================================================\n`;
      content += `  حرف (${letter}) - عدد المراجع: ${items.length}\n`;
      content += `==============================================================\n\n`;
      items.forEach((item) => {
        const author = item.authorFullName || `${item.authorFirstName} ${item.authorFamilyName}`.trim() || 'مؤلف غير محدد';
        content += `[${globalCounter}] المؤلف: ${author}\n`;
        content += `    اسم الكتاب: «${item.title}»\n`;
        if (item.subtitle) content += `    العنوان الفرعي: ${item.subtitle}\n`;
        content += `    نوع المصدر: ${item.referenceType}\n`;
        if (item.publisher || item.publicationYear) {
          content += `    بيانات النشر: ${item.publicationPlace ? item.publicationPlace + ': ' : ''}${item.publisher || 'د.ن'}، ${item.publicationYear || 'د.ت'}\n`;
        }
        if (item.fullCitation) {
          content += `    التوثيق المعتمد: ${item.fullCitation}\n`;
        }
        if (item.file?.name) {
          content += `    النسخة الرقمية المرفقة: ${item.file.name} (${item.file.pageCount || '?'} صفحة)\n`;
        }
        content += `\n`;
        globalCounter++;
      });
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `فهرس_المراجع_الأبجدي_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Trigger quick attach file
  const handleTriggerAttach = (ref: Reference) => {
    setTargetRefForAttach(ref);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetRefForAttach && onAttachBook) {
      onAttachBook(targetRefForAttach, file);
    }
    setTargetRefForAttach(null);
  };

  // Format last sync date nicely
  const formattedLastSync = useMemo(() => {
    if (!toolMemory?.lastSynchronized) return 'لم تُحدث بعد';
    try {
      const d = new Date(toolMemory.lastSynchronized);
      return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString('ar-EG');
    } catch {
      return toolMemory.lastSynchronized;
    }
  }, [toolMemory?.lastSynchronized]);

  return (
    <div id="master-catalogue-view" className="space-y-6 max-w-7xl mx-auto pb-24 text-right" dir="rtl">
      {/* Hidden file input for quick book attachment */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelected} 
        accept=".pdf,.doc,.docx,.epub" 
        className="hidden" 
      />

      {/* Header & User-Demand Refresh Section */}
      <div className="bg-white border border-[#E2DDD3] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Main Title & Accredited Designation */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#8B2635] text-white flex items-center justify-center shadow-md shrink-0">
                <BookMarked className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-[#1F2937] font-serif">
                    فهرس الكتب والمراجع الأبجدي الشامل
                  </h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#8B2635]/10 text-[#8B2635] border border-[#8B2635]/30">
                    {sortMethod === 'author_first_name' ? 'مرتب بأول اسم المؤلف (الاسم الأول)' : sortMethod === 'book_title' ? 'مرتب بعنوان الكتاب' : 'مرتب باسم العائلة'}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
                  مسرد أكاديمي شامل لجميع مصادر ومراجع الأطروحة، مرتبة هجائياً بأول اسم المؤلف (الاسم الأول) وليس باسم الكتاب، وفق القواعد المعتمدة في الفهرسة الأكاديمية والرسائل العلمية، يُحدّث بطلب الباحث.
                </p>
                {settings?.thesisTitle && (
                  <div className="pt-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#4A5568]">
                      <GraduationCap className="w-3.5 h-3.5 text-[#8B2635] shrink-0" />
                      <span>مشروع الأطروحة: <strong className="text-[#1F2937] font-serif">«{settings.thesisTitle}»</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sync Timestamp and Status */}
            <div className="flex items-center gap-4 text-xs text-[#64748B] pt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8B2635]" />
                آخر تحديث للذاكرة: <strong className="text-[#1F2937]">{formattedLastSync}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                الترتيب النشط: {sortMethod === 'author_first_name' ? 'هجائياً بأول اسم المؤلف' : sortMethod === 'book_title' ? 'هجائياً بعنوان الكتاب' : 'هجائياً باسم العائلة'}
              </span>
              <span>•</span>
              <button 
                onClick={() => setShowMemoryModal(true)}
                className="text-[#8B2635] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                سجل ذاكرة الأداة
              </button>
            </div>
          </div>

          {/* User-Requested Refresh Button & Export Tools */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* The Main "تحدث بطلب المستخدم" Button */}
            <button
              id="user-refresh-catalogue-btn"
              onClick={handleUserRequestedRefresh}
              disabled={isRefreshing}
              className={`px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                isRefreshing
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 cursor-wait'
                  : 'bg-gradient-to-r from-[#8B2635] to-[#6E1C28] hover:from-[#781E2C] hover:to-[#57141E] text-white active:scale-98 shadow-sm'
              }`}
              title="إعادة فحص وفهرسة جميع أسماء الكتب بناءً على طلب المستخدم"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-700' : 'text-white'}`} />
              <span>{isRefreshing ? 'جارٍ الفرز وتحديث الذاكرة...' : 'تحديث الفهرس والذاكرة الآن'}</span>
            </button>

            {/* Quick Export Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAllBibliography}
                className="flex-1 sm:flex-none px-3.5 py-3 rounded-xl border border-[#DDD6CA] bg-white hover:bg-[#FAF9F5] text-[#374151] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="نسخ مسرد عناوين الكتب المعتمد مرتباً أبجدياً"
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6B7280]" />}
                <span>{copiedAll ? 'تم نسخ الفهرس!' : 'نسخ المسرد كاملاً'}</span>
              </button>

              <button
                onClick={handleDownloadBibliographyText}
                className="flex-1 sm:flex-none px-3.5 py-3 rounded-xl border border-[#DDD6CA] bg-white hover:bg-[#FAF9F5] text-[#374151] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="تنزيل الفهرس كملف نصي منسق"
              >
                <Download className="w-4 h-4 text-[#6B7280]" />
                <span>تصدير ملف (TXT)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Refresh Notification Banner */}
        {refreshSuccessMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{refreshSuccessMessage}</span>
          </div>
        )}

        {/* Accredited Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#EAE5DC]">
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E3D9] text-center">
            <div className="text-xl font-black text-[#1F2937]">{filteredAndSortedBooks.length}</div>
            <div className="text-[11px] text-[#6B7280] font-medium mt-0.5">إجمالي الكتب المفهرسة</div>
          </div>

          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E3D9] text-center">
            <div className="text-xl font-black text-emerald-700">
              {filteredAndSortedBooks.filter(r => Boolean(r.file?.id || r.file?.name)).length}
            </div>
            <div className="text-[11px] text-[#6B7280] font-medium mt-0.5">كتب متوفرة بملف رقمي (PDF)</div>
          </div>

          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E3D9] text-center">
            <div className="text-xl font-black text-[#8B2635]">
              {availableLetters.length}
            </div>
            <div className="text-[11px] text-[#6B7280] font-medium mt-0.5">حروف هجائية مغطاة</div>
          </div>

          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E3D9] text-center">
            <div className="text-xl font-black text-indigo-700">
              {new Set(filteredAndSortedBooks.map(r => r.authorFullName || r.authorFamilyName)).size}
            </div>
            <div className="text-[11px] text-[#6B7280] font-medium mt-0.5">مؤلفون ومحققون مستقلون</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Accredited View Mode, and Filters */}
      <div className="bg-white border border-[#E2DDD3] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar specifically for book names */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في أسماء الكتب، المؤلفين، الكلمات المفتاحية..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-[#DDD6CA] text-xs text-[#1F2937] placeholder-[#94A3B8] focus:border-[#8B2635] focus:outline-hidden bg-[#FAF9F5]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#1F2937]"
              >
                مسح
              </button>
            )}
          </div>

          {/* View Mode Toggle: Canonical Registry Table vs Cards */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="inline-flex bg-[#F3EFE6] p-1 rounded-xl border border-[#DDD6CA]">
              <button
                onClick={() => setViewStyle('registry')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewStyle === 'registry'
                    ? 'bg-white text-[#8B2635] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E252B]'
                }`}
                title="عرض المسرد المعتمد المنظم"
              >
                <List className="w-3.5 h-3.5" />
                <span>المسرد المعتمد</span>
              </button>

              <button
                onClick={() => setViewStyle('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewStyle === 'cards'
                    ? 'bg-white text-[#8B2635] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E252B]'
                }`}
                title="عرض بطاقات الكتب المعتمدة"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>بطاقات الكتب</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary filters & Article Strip Option */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EAE5DC] text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Method Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#64748B] font-medium">الترتيب الأبجدي بـ:</span>
              <select
                value={sortMethod}
                onChange={(e) => setSortMethod(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-[#8B2635]/40 bg-[#FAF9F5] text-xs font-bold text-[#8B2635] focus:outline-hidden"
              >
                <option value="author_first_name">1. بأول اسم المؤلف (الاسم الأول - المعتمد)</option>
                <option value="author_family">2. باسم الشهرة / العائلة</option>
                <option value="book_title">3. بعنوان الكتاب أو المرجع</option>
              </select>
            </div>

            {/* Filter by Type */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#64748B] font-medium">نوع المصدر:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#DDD6CA] bg-[#FAF9F5] text-xs font-medium text-[#1F2937] focus:outline-hidden"
              >
                <option value="all">جميع الأنواع</option>
                <option value="كتاب (Book)">كتب فقط</option>
                <option value="مصدر أصلي / مخطوط (Primary Source)">مصادر أصلية ومخطوطات</option>
                <option value="أطروحة دكتوراه (PhD Dissertation)">أطروحات دكتوراه</option>
                <option value="رسالة ماجستير (Master Thesis)">رسائل ماجستير</option>
                <option value="مقالة في دورية محكمة (Journal Article)">مقالات دوريات</option>
              </select>
            </div>

            {/* Filter by PDF availability */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#64748B] font-medium">الملف الرقمي:</span>
              <select
                value={hasFileFilter}
                onChange={(e) => setHasFileFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-[#DDD6CA] bg-[#FAF9F5] text-xs font-medium text-[#1F2937] focus:outline-hidden"
              >
                <option value="all">الكل (مع أو بدون ملف)</option>
                <option value="with_file">كتب متوفرة بملف PDF</option>
                <option value="without_file">مراجع بدون ملف مرفق</option>
              </select>
            </div>

            {/* Strip 'الـ' Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#475569] bg-[#FAF9F5] px-2.5 py-1.5 rounded-lg border border-[#E2DDD3]">
              <input
                type="checkbox"
                checked={stripArticle}
                onChange={(e) => setStripArticle(e.target.checked)}
                className="rounded text-[#8B2635] focus:ring-[#8B2635]"
              />
              <span>تجريد «الـ» التعريف في الفرز (المعيار المعتمد)</span>
            </label>
          </div>

          <div className="text-xs text-[#64748B]">
            معروض <strong className="text-[#1F2937]">{filteredAndSortedBooks.length}</strong> مرجعاً مرتبين هجائياً
          </div>
        </div>
      </div>

      {/* Alphabetical Quick Jump Bar (حروف المعجم المعتمدة) */}
      <div className="bg-white border border-[#E2DDD3] rounded-2xl p-3 shadow-sm sticky top-16 z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <button
            onClick={() => setSelectedLetter(null)}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              selectedLetter === null
                ? 'bg-[#8B2635] text-white shadow-xs'
                : 'bg-[#F3EFE6] text-[#4B5563] hover:bg-[#EAE5DC]'
            }`}
          >
            جميع الحروف ({filteredAndSortedBooks.length})
          </button>

          {availableLetters.map(({ letter, count }) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
              className={`px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                selectedLetter === letter
                  ? 'bg-[#8B2635] text-white shadow-xs'
                  : 'bg-[#FAF9F5] hover:bg-[#F3EFE6] text-[#1E252B] border border-[#E8E3D9]'
              }`}
            >
              <span className="font-serif text-sm">{letter}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedLetter === letter ? 'bg-white/25 text-white' : 'bg-[#EAE5DC] text-[#64748B]'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Complete Listing by Canonical Book Title */}
      {displayedGroups.length === 0 ? (
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-12 text-center text-[#6B7280] space-y-3">
          <BookMarked className="w-12 h-12 mx-auto text-[#CBD5E1]" />
          <h3 className="font-bold text-base text-[#1F2937]">لا توجد كتب مطابقة في الفهرس</h3>
          <p className="text-xs max-w-md mx-auto text-[#6B7280]">
            يرجى ضبط معايير البحث أو الضغط على زر "تحديث الفهرس والذاكرة الآن".
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedGroups.map(([letter, items]) => (
            <section key={letter} id={`letter-${letter}`} className="space-y-3 scroll-mt-28">
              {/* Canonical Letter Banner */}
              <div className="flex items-center justify-between border-b-2 border-[#8B2635]/30 pb-2 bg-[#FAF9F5] px-4 py-2.5 rounded-xl border border-[#E5E0D5]">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-[#8B2635] text-white font-bold flex items-center justify-center text-base shadow-xs font-serif">
                    {letter}
                  </span>
                  <div>
                    <h2 className="font-bold text-sm text-[#1F2937] flex items-center gap-2">
                      <span>حرف ({letter})</span>
                      <span className="text-[11px] font-normal text-[#64748B]">
                        ({sortMethod === 'author_first_name' ? `المؤلفون الذين تبدأ أسماؤهم الأولى بحرف «${letter}»` : sortMethod === 'book_title' ? `أسماء الكتب المبتدئة بحرف «${letter}»` : `المؤلفون حسب لقب العائلة «${letter}»`})
                      </span>
                    </h2>
                    <span className="text-[11px] text-[#64748B]">
                      {items.length} {items.length === 1 ? 'مرجع معتمد' : 'مراجع ومصادر معتمدة'}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#8B2635] bg-white px-3 py-1 rounded-full border border-[#DDD6CA]">
                  {sortMethod === 'author_first_name' ? 'مرتب بأول اسم المؤلف' : sortMethod === 'book_title' ? 'مرتب بعنوان الكتاب' : 'مرتب باسم العائلة'}
                </span>
              </div>

              {/* View Style 1: Canonical Registry (المسرد الأكاديمي المعتمد المنظم) */}
              {viewStyle === 'registry' ? (
                <div className="bg-white border border-[#E5E0D5] rounded-xl overflow-hidden shadow-2xs divide-y divide-[#EAE5DC]">
                  {items.map((ref, idx) => {
                    const hasFile = Boolean(ref.file?.id || ref.file?.name);
                    const authorDisplay = ref.authorFullName || `${ref.authorFirstName} ${ref.authorFamilyName}`.trim() || 'مؤلف غير معروف';

                    return (
                      <div 
                        key={ref.id}
                        className="p-4 hover:bg-[#FAF9F5] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Book Title & Academic Details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F3EFE6] text-[#475569]">
                              #{idx + 1}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                              {ref.referenceType}
                            </span>
                            {ref.publicationYear && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {ref.publicationYear}
                              </span>
                            )}
                            {hasFile ? (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                PDF ({ref.file?.pageCount ? `${ref.file.pageCount} ص` : 'متوفر'})
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                                غير مرفق بملف
                              </span>
                            )}
                          </div>

                          {/* Accredited Title & Author */}
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 
                              onClick={() => onSelectReference(ref)}
                              className="font-bold text-base text-[#1F2937] hover:text-[#8B2635] cursor-pointer transition-colors leading-snug font-serif"
                            >
                              {sortMethod === 'author_first_name' ? (
                                <>
                                  <span className="text-[#8B2635] font-bold">{authorDisplay}:</span> «{ref.title}»
                                </>
                              ) : (
                                <>
                                  «{ref.title}»
                                </>
                              )}
                            </h3>
                            {ref.subtitle && (
                              <span className="text-xs text-[#6B7280]">
                                : {ref.subtitle}
                              </span>
                            )}
                          </div>

                          {/* Author & Publishing Information */}
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#4B5563]">
                            <span className="flex items-center gap-1 font-semibold text-[#1F2937]">
                              <User className="w-3.5 h-3.5 text-[#8B2635]" />
                              تأليف: {authorDisplay}
                            </span>

                            {ref.publisher && (
                              <span>دار النشر: <strong className="text-[#334155]">{ref.publisher}</strong></span>
                            )}

                            {ref.publicationPlace && (
                              <span>مكان النشر: {ref.publicationPlace}</span>
                            )}

                            {ref.edition && (
                              <span>الطبعة: {ref.edition}</span>
                            )}

                            {ref.volume && (
                              <span>المجلد: {ref.volume}</span>
                            )}
                          </div>

                          {/* Full citation snippet if available */}
                          {ref.fullCitation && (
                            <div className="text-[11px] text-[#64748B] font-serif bg-[#FAF9F5] p-2 rounded-lg border border-[#EAE5DC] mt-1">
                              <strong>التوثيق المعتمد:</strong> {ref.fullCitation}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                          {/* Read Book */}
                          {hasFile ? (
                            <button
                              onClick={() => onReadReference(ref)}
                              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                              title="فتح وقراءة الكتاب"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>قراءة</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTriggerAttach(ref)}
                              className="px-3 py-2 rounded-lg bg-[#F3EFE6] hover:bg-[#EAE5DC] text-[#8B2635] text-xs font-bold flex items-center gap-1.5 border border-[#DDD6CA] cursor-pointer transition-colors"
                              title="إرفاق ملف الكتاب"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>إرفاق</span>
                            </button>
                          )}

                          {/* Copy Citation */}
                          <button
                            onClick={() => handleCopyCitation(ref)}
                            className="px-3 py-2 rounded-lg bg-white hover:bg-[#FAF9F5] border border-[#DDD6CA] text-[#475569] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="نسخ التوثيق المعتمد للكتاب"
                          >
                            {copiedId === ref.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">تم</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                                <span>نسخ</span>
                              </>
                            )}
                          </button>

                          {/* Search Evidence inside book */}
                          {onSearchEvidence && (
                            <button
                              onClick={() => onSearchEvidence(ref)}
                              className="px-2.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                              title="بحث عن معلومة أو استدلال داخل هذا الكتاب"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                              <span>استدلال</span>
                            </button>
                          )}

                          {/* View Details */}
                          <button
                            onClick={() => onSelectReference(ref)}
                            className="p-2 rounded-lg bg-white hover:bg-[#FAF9F5] border border-[#DDD6CA] text-[#475569] text-xs font-medium cursor-pointer transition-colors"
                            title="عرض وتعديل بيانات الكتاب"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Reference */}
                          <button
                            onClick={() => onEditReference(ref)}
                            className="p-2 rounded-lg bg-white hover:bg-[#FAF9F5] border border-[#DDD6CA] text-[#475569] text-xs font-medium cursor-pointer transition-colors"
                            title="تعديل المرجع"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Favorite toggle */}
                          <button
                            onClick={() => onToggleFavorite(ref.id)}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              ref.isFavorite
                                ? 'bg-amber-50 border-amber-300 text-amber-500'
                                : 'bg-white border-[#DDD6CA] text-[#CBD5E1] hover:text-amber-400'
                            }`}
                            title={ref.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                          >
                            <Star className={`w-3.5 h-3.5 ${ref.isFavorite ? 'fill-amber-400' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* View Style 2: Canonical Cards (بطاقات الكتب المعتمدة) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {items.map((ref, idx) => {
                    const hasFile = Boolean(ref.file?.id || ref.file?.name);
                    const authorDisplay = ref.authorFullName || `${ref.authorFirstName} ${ref.authorFamilyName}`.trim() || 'مؤلف غير معروف';

                    return (
                      <div
                        key={ref.id}
                        className="bg-white border border-[#E5E0D5] hover:border-[#8B2635]/40 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-3 text-right"
                      >
                        <div className="space-y-2">
                          {/* Badges */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F3EFE6] text-[#475569]">
                                #{idx + 1}
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                                {ref.referenceType}
                              </span>
                            </div>

                            {hasFile ? (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                PDF
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                                بدون ملف
                              </span>
                            )}
                          </div>

                          {/* Canonical Title & Author */}
                          <h3 
                            onClick={() => onSelectReference(ref)}
                            className="font-bold text-base text-[#1F2937] hover:text-[#8B2635] cursor-pointer transition-colors leading-snug font-serif"
                          >
                            {sortMethod === 'author_first_name' ? (
                              <>
                                <span className="text-[#8B2635] font-bold">{authorDisplay}:</span> «{ref.title}»
                              </>
                            ) : (
                              <>
                                «{ref.title}»
                              </>
                            )}
                          </h3>

                          {ref.subtitle && (
                            <p className="text-xs text-[#6B7280]">
                              {ref.subtitle}
                            </p>
                          )}

                          {/* Author & Publication Details */}
                          <div className="space-y-1 text-xs text-[#4B5563] pt-1">
                            <div className="flex items-center gap-1 font-semibold text-[#1F2937]">
                              <User className="w-3.5 h-3.5 text-[#8B2635]" />
                              <span>تأليف: {authorDisplay}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 text-[#64748B] text-[11px]">
                              {ref.publisher && <span>الناشر: {ref.publisher}</span>}
                              {ref.publicationYear && <span>السنة: {ref.publicationYear}</span>}
                              {ref.edition && <span>الطبعة: {ref.edition}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F3EFE6]">
                          <div className="flex items-center gap-1.5">
                            {hasFile ? (
                              <button
                                onClick={() => onReadReference(ref)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <BookOpen className="w-3 h-3" />
                                <span>قراءة</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTriggerAttach(ref)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#F3EFE6] text-[#8B2635] text-xs font-bold flex items-center gap-1 border border-[#DDD6CA] cursor-pointer"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>إرفاق</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleCopyCitation(ref)}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#DDD6CA] text-[#475569] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === ref.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-[#64748B]" />
                              )}
                              <span>{copiedId === ref.id ? 'تم' : 'نسخ'}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {onSearchEvidence && (
                              <button
                                onClick={() => onSearchEvidence(ref)}
                                className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="بحث عن معلومة أو استدلال داخل هذا الكتاب"
                              >
                                <Sparkles className="w-3 h-3 text-amber-700" />
                                <span>استدلال</span>
                              </button>
                            )}

                            <button
                              onClick={() => onSelectReference(ref)}
                              className="p-1.5 rounded-lg bg-[#FAF9F5] border border-[#E2DDD3] text-[#475569] text-xs cursor-pointer"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onEditReference(ref)}
                              className="p-1.5 rounded-lg bg-[#FAF9F5] border border-[#E2DDD3] text-[#475569] text-xs cursor-pointer"
                              title="تعديل المرجع"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onToggleFavorite(ref.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                ref.isFavorite
                                  ? 'bg-amber-50 border-amber-300 text-amber-500'
                                  : 'bg-[#FAF9F5] border-[#E2DDD3] text-[#CBD5E1]'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${ref.isFavorite ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Modal: Tool Memory & Knowledge State Inspector */}
      {showMemoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#DDD6CA] overflow-hidden text-right" dir="rtl">
            <div className="p-5 border-b border-[#E2DDD3] flex items-center justify-between bg-[#FAF9F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#8B2635] text-white flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1F2937]">سجل ذاكرة الأداة وقاعدة الفهرسة</h3>
                  <p className="text-xs text-[#6B7280]">
                    حالة الذاكرة التراكمية، آخر مزامنة، وسجل الأنشطة
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowMemoryModal(false)}
                className="w-8 h-8 rounded-lg bg-white border border-[#DDD6CA] text-[#6B7280] hover:text-[#1F2937] flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E3D9]">
                  <div className="text-[#64748B] text-[11px]">نسخة الذاكرة</div>
                  <div className="text-base font-bold text-[#1F2937] mt-0.5">v{toolMemory?.version || 1}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E3D9]">
                  <div className="text-[#64748B] text-[11px]">الكتب المفهرسة</div>
                  <div className="text-base font-bold text-[#8B2635] mt-0.5">{toolMemory?.totalBooksIndexed || activeRefs.length}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E3D9]">
                  <div className="text-[#64748B] text-[11px]">مؤلفون مستقلون</div>
                  <div className="text-base font-bold text-indigo-700 mt-0.5">{toolMemory?.totalAuthorsIndexed || 0}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E3D9]">
                  <div className="text-[#64748B] text-[11px]">ملفات رقمية مرتبطة</div>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">{toolMemory?.totalFilesAttached || 0}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#1F2937]">سجل نشاط الذاكرة والتحديثات:</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(toolMemory?.recentActivities || []).map((act) => (
                    <div key={act.id} className="p-2.5 rounded-lg bg-[#FAF9F5] border border-[#E8E3D9] flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#1F2937]">{act.action}</div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{act.details}</div>
                      </div>
                      <span className="text-[10px] text-[#94A3B8] font-mono shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E2DDD3] bg-[#FAF9F5] flex items-center justify-between">
              <button
                onClick={async () => {
                  await handleUserRequestedRefresh();
                  setShowMemoryModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#8B2635] text-white font-bold text-xs hover:bg-[#731E2A] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة بناء الفهرس والذاكرة الآن</span>
              </button>

              <button
                onClick={() => setShowMemoryModal(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#DDD6CA] text-[#475569] font-semibold text-xs hover:bg-[#F3EFE6] cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
