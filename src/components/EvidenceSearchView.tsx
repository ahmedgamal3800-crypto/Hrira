import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Sparkles, 
  Quote, 
  Check, 
  Copy, 
  BookmarkPlus, 
  FileText, 
  Languages, 
  BookMarked, 
  AlertCircle, 
  GraduationCap, 
  FileCheck2, 
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Layers,
  History,
  RotateCcw
} from 'lucide-react';
import { Reference, CitationQuote, ResearchNote, AppSettings, EvidenceSearchResult } from '../types';
import { searchBookEvidence } from '../services/evidenceService';

interface EvidenceSearchViewProps {
  references: Reference[];
  settings: AppSettings;
  preSelectedReference?: Reference | null;
  onSaveCitationQuote: (quote: CitationQuote) => Promise<void>;
  onSaveResearchNote: (note: ResearchNote) => Promise<void>;
  onOpenReader?: (reference: Reference) => void;
  onNavigateToCatalogue?: () => void;
}

export const EvidenceSearchView: React.FC<EvidenceSearchViewProps> = ({
  references = [],
  settings,
  preSelectedReference = null,
  onSaveCitationQuote,
  onSaveResearchNote,
  onOpenReader,
  onNavigateToCatalogue
}) => {
  const activeRefs = useMemo(() => references.filter((r) => !r.inTrash), [references]);

  // Selected Reference
  const [selectedRefId, setSelectedRefId] = useState<string>(() => {
    return preSelectedReference?.id || (activeRefs.length > 0 ? activeRefs[0].id : '');
  });

  React.useEffect(() => {
    if (preSelectedReference?.id) {
      setSelectedRefId(preSelectedReference.id);
    }
  }, [preSelectedReference]);

  // Target query / claim / topic
  const [claimTopic, setClaimTopic] = useState<string>('');
  const [customExcerpt, setCustomExcerpt] = useState<string>('');
  const [showExcerptInput, setShowExcerptInput] = useState<boolean>(false);

  // Search status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<EvidenceSearchResult | null>(null);

  // Action feedbacks
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [savedCitationId, setSavedCitationId] = useState<boolean>(false);
  const [savedNoteId, setSavedNoteId] = useState<boolean>(false);

  // Search History in current session
  const [searchHistory, setSearchHistory] = useState<Array<{ topic: string; book: string; result: EvidenceSearchResult }>>([]);

  const currentReference = useMemo(() => {
    return activeRefs.find((r) => r.id === selectedRefId) || null;
  }, [activeRefs, selectedRefId]);

  // Thesis tailored suggested topics
  const suggestedThesisInquiries = [
    {
      title: 'موقف قسطنطين الحادي عشر الأخير عند أسوار القسطنطينية وتجرده من شارات الملك',
      category: 'شهود العيان وسقوط 1453'
    },
    {
      title: 'رفض قسطنطين باليولوجوس عروض السلطان محمد الفاتح بتسليم المدينة والانسحاب للمورة',
      category: 'المفاوضات العثمانية البيزنطية'
    },
    {
      title: 'رواية عاشق باشا زاده وطرسون بك حول استشهاد الإمبراطور واقتحام الأسوار',
      category: 'المصادر العثمانية'
    },
    {
      title: 'شهادة المطران ليوناردو الخيوسي ونيكولو باربارو حول الدفاع وسقوط بوابة القديس رومانوس',
      category: 'شهود العيان اللاتين'
    },
    {
      title: 'موقف الشعب البيزنطي والرهبان من مجمع فلورنسا ومعاهدة الاتحاد الكنسي 1439م',
      category: 'الاتحاد الديني والسياسة الخارجية'
    }
  ];

  // Perform search
  const handleExecuteSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!claimTopic.trim()) {
      setErrorMsg('يرجى كتابة الفكرة، الدعوى، أو المعلومة التاريخية المراد الاستدلال عليها.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSavedCitationId(false);
    setSavedNoteId(false);

    try {
      const payload = {
        claimOrTopic: claimTopic.trim(),
        bookTitle: currentReference?.title || '',
        author: currentReference?.authorFullName || '',
        edition: currentReference?.edition || '',
        volume: currentReference?.volume || '',
        publisher: currentReference?.publisher || '',
        publicationYear: currentReference?.publicationYear || '',
        language: currentReference?.language || '',
        fullCitation: currentReference?.fullCitation || '',
        thesisTitle: settings.thesisTitle || 'قسطنطين الحادي عشر باليولوجوس (1449–1453م) في ضوء المصادر البيزنطية والعثمانية',
        customTextExcerpt: customExcerpt.trim() || undefined
      };

      const result = await searchBookEvidence(payload);
      setSearchResult(result);

      // Add to session history
      setSearchHistory((prev) => [
        {
          topic: claimTopic.trim(),
          book: currentReference?.title || 'مصدر معتمد',
          result
        },
        ...prev.slice(0, 9)
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'تعذر إتمام الاستدلال من الكتاب حالياً.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy with feedback
  const handleCopyText = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Copy full academic synthesis
  const handleCopyFullEvidence = () => {
    if (!searchResult) return;
    let full = `【استدلال أكاديمي من المصادر - أطروحة: ${settings.thesisTitle}】\n`;
    full += `• الكتاب / المصدر: ${searchResult.bookTitle} (${searchResult.author})\n`;
    full += `• رقم الصفحة المطبوعة: ${searchResult.printedPage}${searchResult.volume ? ` (${searchResult.volume})` : ''}\n`;
    if (searchResult.chapterOrSection) {
      full += `• الباب / الفصل: ${searchResult.chapterOrSection}\n`;
    }
    full += `\n[النص المقتبس الداخلي الحرفي (${searchResult.originalLanguage || 'النص الأصلي'})]:\n`;
    full += `${searchResult.originalQuote}\n\n`;
    full += `[الترجمة الأكاديمية التاريخية الكاملة (بلا تنقيص أو تلخيص)]:\n`;
    full += `${searchResult.academicTranslation}\n\n`;
    full += `[وجه الاستدلال والدلالة التاريخية]:\n`;
    full += `${searchResult.evidenceAnalysis}\n\n`;
    if (searchResult.thesisRelevance) {
      full += `[الأهمية لمشروع الأطروحة]:\n${searchResult.thesisRelevance}\n\n`;
    }
    full += `[التوثيق الأكاديمي المعتمد في الحاشية]:\n${searchResult.formalCitation}\n`;

    if (searchResult.secondaryQuotes && searchResult.secondaryQuotes.length > 0) {
      full += `\n--- شواهد نصية مؤيدة إضافية في نفس الكتاب ---\n`;
      searchResult.secondaryQuotes.forEach((sq, i) => {
        full += `(${i + 1}) ${sq.printedPage}: ${sq.originalQuote}\nالترجمة: ${sq.academicTranslation}\n\n`;
      });
    }

    handleCopyText(full, 'all');
  };

  // Save as accredited Citation Quote to DB
  const handleSaveToCitations = async () => {
    if (!searchResult || !currentReference) return;
    try {
      const newQuote: CitationQuote = {
        id: 'quote-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        referenceId: currentReference.id,
        referenceTitle: searchResult.bookTitle,
        authorName: searchResult.author,
        pageNumber: searchResult.printedPage,
        quoteText: `${searchResult.originalQuote}\n\n[الترجمة الأكاديمية التاريخية]:\n${searchResult.academicTranslation}`,
        commentary: `وجه الاستدلال في الأطروحة: ${searchResult.evidenceAnalysis}`,
        tags: ['استدلال داخلي', 'أطروحة قسطنطين باليولوجوس', searchResult.originalLanguage || 'مصدر'],
        createdAt: new Date().toISOString()
      };

      await onSaveCitationQuote(newQuote);
      setSavedCitationId(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Save as Research Note to DB
  const handleSaveToNotes = async () => {
    if (!searchResult || !currentReference) return;
    try {
      const newNote: ResearchNote = {
        id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        referenceId: currentReference.id,
        referenceTitle: searchResult.bookTitle,
        title: `استدلال: ${claimTopic.slice(0, 70)}...`,
        content: `• المرجع: ${searchResult.bookTitle} (${searchResult.author})\n• الموضع المطبوع: ${searchResult.printedPage}\n\nالنص الداخلي:\n${searchResult.originalQuote}\n\nالترجمة الأكاديمية:\n${searchResult.academicTranslation}\n\nالتحليل والاستدلال:\n${searchResult.evidenceAnalysis}\n\nصيغة التوثيق:\n${searchResult.formalCitation}`,
        pageNumber: searchResult.printedPage,
        tags: ['استدلال نصوص', 'مصادر 1453', 'أطروحة'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSaveResearchNote(newNote);
      setSavedNoteId(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="evidence-search-view" className="space-y-6 max-w-7xl mx-auto pb-24 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1F2937] via-[#2D3748] to-[#1F2937] text-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#4A5568] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>محرك الاستدلال والبحث النصي الأكاديمي في أمهات الكتب</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-serif">
              البحث عن معلومة مطابقة أو دالة داخل الكتاب
            </h1>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
              اكتب فكرتك أو استفسارك أو الدعوى التاريخية؛ ليقوم المحرك بفهم المتون التاريخية واستخراج الشاهد النصي الداخلي الحرفي مع رقم الصفحة المطبوعة بدقة، وترجمة النصوص الإنجليزية والأجنبية ترجمة تاريخية كاملة بدون أي تنقيص أو تلخيص.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs">
                <GraduationCap className="w-4 h-4 text-amber-300 shrink-0" />
                <span>مشروع الأطروحة: <strong className="text-white font-serif mr-1">«{settings.thesisTitle}»</strong></span>
              </div>
            </div>
          </div>

          {onNavigateToCatalogue && (
            <button
              onClick={onNavigateToCatalogue}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-medium rounded-xl border border-white/20 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <BookMarked className="w-4 h-4 text-amber-300" />
              <span>فهرس الكتب المعتمد</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Search Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Column: Search Form & Results */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#E2DDD3] rounded-2xl p-6 shadow-sm space-y-5">
            <form onSubmit={handleExecuteSearch} className="space-y-4">
              {/* 1. Target Book Selection */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#8B2635]" />
                  <span>اختر الكتاب أو المصدر المستهدف للبحث في داخله:</span>
                </label>

                <div className="relative">
                  <select
                    id="evidence-target-book-select"
                    value={selectedRefId}
                    onChange={(e) => setSelectedRefId(e.target.value)}
                    className="w-full p-3 bg-[#FAF8F5] border border-[#DDD6CA] rounded-xl text-xs md:text-sm text-[#1F2937] font-serif focus:ring-2 focus:ring-[#8B2635] focus:outline-none transition-all cursor-pointer"
                  >
                    {activeRefs.map((ref) => (
                      <option key={ref.id} value={ref.id}>
                        {ref.title} — {ref.authorFullName || ref.authorFamilyName} ({ref.publicationYear || ref.referenceType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Book Summary Badge */}
                {currentReference && (
                  <div className="mt-2.5 p-3 bg-[#FDFBF7] border border-[#EAE4D9] rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#1F2937] font-serif flex items-center gap-2">
                        <span>«{currentReference.title}»</span>
                        <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[#8B2635]/10 text-[#8B2635]">
                          {currentReference.referenceType}
                        </span>
                      </div>
                      <div className="text-[#64748B] text-[11px]">
                        المؤلف: <strong>{currentReference.authorFullName}</strong> | اللغة: {currentReference.language} {currentReference.publisher ? `| النشر: ${currentReference.publisher}` : ''}
                      </div>
                    </div>

                    {currentReference.file?.name && onOpenReader && (
                      <button
                        type="button"
                        onClick={() => onOpenReader(currentReference)}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                        title="فتح الكتاب في القارئ الرقمي"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-amber-700" />
                        <span>نسخة رقمية متاحة</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Topic / Claim / Question Input */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-[#8B2635]" />
                    <span>الفكرة أو المعلومة أو الدعوى التاريخية المراد الاستدلال عليها:</span>
                  </span>
                  <span className="text-[11px] text-[#6B7280] font-normal">
                    (اكتب باللغة العربية أو الإنجليزية كما يحلو لك)
                  </span>
                </label>

                <textarea
                  id="evidence-claim-input"
                  rows={4}
                  value={claimTopic}
                  onChange={(e) => setClaimTopic(e.target.value)}
                  placeholder="مثال: أريد الاستدلال على موقف قسطنطين الحادي عشر في الساعات الأخيرة من الحصار، وهل خلع شاراته الإمبراطورية الملكية ليقاتل كجندي بسيط عند بوابة القديس رومانوس؟"
                  className="w-full p-3.5 bg-[#FAF8F5] border border-[#DDD6CA] rounded-xl text-xs md:text-sm text-[#1F2937] leading-relaxed focus:ring-2 focus:ring-[#8B2635] focus:bg-white focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* 3. Optional Excerpt Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowExcerptInput(!showExcerptInput)}
                  className="text-xs text-[#8B2635] hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showExcerptInput ? 'إخفاء حقل النص أو الفصل المرفق' : 'هل لديك نص أو فصل مقتبس من الكتاب تريد التحقيق فيه مباشرة؟ (اختياري)'}</span>
                </button>

                {showExcerptInput && (
                  <div className="mt-2.5">
                    <textarea
                      rows={3}
                      value={customExcerpt}
                      onChange={(e) => setCustomExcerpt(e.target.value)}
                      placeholder="الصق نص الصفحة أو الفصل من الكتاب هنا إن كان بحوزتك لفحصه واستخراج دلالته..."
                      className="w-full p-3 bg-[#FAF8F5] border border-[#DDD6CA] rounded-xl text-xs text-[#1F2937] focus:ring-2 focus:ring-[#8B2635] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  type="submit"
                  id="btn-execute-evidence-search"
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-xl text-xs md:text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                    isLoading 
                      ? 'bg-amber-700 cursor-wait' 
                      : 'bg-gradient-to-r from-[#8B2635] to-[#701C29] hover:from-[#761E2C] hover:to-[#57141E] active:scale-98'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'جارٍ فحص المتون والترجمة الأكاديمية...' : 'فحص المتن والاستدلال مع إظهار رقم الصفحة والترجمة'}</span>
                </button>

                {claimTopic && (
                  <button
                    type="button"
                    onClick={() => {
                      setClaimTopic('');
                      setSearchResult(null);
                    }}
                    className="text-xs text-[#6B7280] hover:text-[#1F2937] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تفريغ الحقول</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Loading Indicator with scholarly feedback */}
          {isLoading && (
            <div className="bg-white border border-[#E2DDD3] rounded-2xl p-8 text-center space-y-4 shadow-sm animate-pulse">
              <div className="w-12 h-12 rounded-full bg-[#8B2635]/10 text-[#8B2635] flex items-center justify-center mx-auto">
                <Languages className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#1F2937] font-serif">
                  جارٍ فحص نصوص «{currentReference?.title}» والتحقيق الأكاديمي...
                </h3>
                <p className="text-xs text-[#6B7280] max-w-md mx-auto leading-relaxed">
                  يقوم النظام بمطابقة الدلالة التاريخية، وتحديد أرقام الصفحات المطبوعة في الطبعة الأكاديمية المعتمدة، وترجمة النصوص الأجنبية ترجمة كاملة غير منقوصة.
                </p>
              </div>
            </div>
          )}

          {/* Search Result Card (The Core Deliverable) */}
          {searchResult && !isLoading && (
            <div className="bg-white border-2 border-[#8B2635]/30 rounded-2xl p-6 md:p-8 shadow-md space-y-6">
              {/* Header of Result */}
              <div className="border-b border-[#EBE6DC] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>تم استخراج الشاهد الداخلي بنجاح</span>
                    </span>

                    {/* Exact Printed Page Badge (User Priority) */}
                    <span className="px-3 py-1 rounded-full bg-[#8B2635] text-white text-xs font-bold font-serif shadow-xs flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-200" />
                      <span>الصفحة المطبوعة: {searchResult.printedPage}</span>
                      {searchResult.volume && <span className="mr-1">({searchResult.volume})</span>}
                    </span>
                  </div>

                  <h2 className="text-base md:text-lg font-bold text-[#1F2937] font-serif pt-1">
                    المصدر: «{searchResult.bookTitle}» — {searchResult.author}
                  </h2>
                  {searchResult.chapterOrSection && (
                    <p className="text-xs text-[#64748B]">
                      الموضع: {searchResult.chapterOrSection}
                    </p>
                  )}
                </div>

                {/* Quick Actions Bar */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyFullEvidence}
                    className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EFEAE1] border border-[#DDD6CA] text-[#374151] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="نسخ الشاهد والترجمة والتوثيق كاملاً"
                  >
                    {copiedSection === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#8B2635]" />}
                    <span>{copiedSection === 'all' ? 'تم النسخ' : 'نسخ الاستدلال كاملاً'}</span>
                  </button>

                  <button
                    onClick={handleSaveToCitations}
                    disabled={savedCitationId}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      savedCitationId 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-[#8B2635] hover:bg-[#721F2B] text-white shadow-xs'
                    }`}
                    title="حفظ كاقتباس موثق في قاعدة بيانات الأطروحة"
                  >
                    {savedCitationId ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                    <span>{savedCitationId ? 'تم الحفظ في الاقتباسات' : 'حفظ كاقتباس موثق'}</span>
                  </button>

                  <button
                    onClick={handleSaveToNotes}
                    disabled={savedNoteId}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      savedNoteId 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-[#FAF8F5] hover:bg-[#EFEAE1] border border-[#DDD6CA] text-[#374151]'
                    }`}
                    title="حفظ كملاحظة بحثية للأطروحة"
                  >
                    {savedNoteId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5 text-[#8B2635]" />}
                    <span>{savedNoteId ? 'تم الحفظ في الملاحظات' : 'حفظ كملاحظة'}</span>
                  </button>
                </div>
              </div>

              {/* 1. Internal Original Quote (النص المقتبس الداخلي) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#374151]">
                  <span className="flex items-center gap-1.5 text-[#8B2635]">
                    <Quote className="w-4 h-4" />
                    <span>النص المقتبس الداخلي من الكتاب ({searchResult.originalLanguage || 'اللغة الأصلية'}):</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#64748B] font-normal">
                      رقم الصفحة المطبوعة: <strong className="text-[#1F2937] font-bold font-serif">{searchResult.printedPage}</strong>
                    </span>
                    <button
                      onClick={() => handleCopyText(searchResult.originalQuote, 'quote')}
                      className="text-xs text-[#8B2635] hover:underline flex items-center gap-1 cursor-pointer font-normal"
                    >
                      {copiedSection === 'quote' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'quote' ? 'تم النسخ' : 'نسخ النص'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#FAF9F6] border-r-4 border-[#8B2635] border-y border-l border-[#E5E0D5] rounded-l-xl text-xs md:text-sm text-[#1F2937] font-citation leading-loose text-justify selection:bg-amber-200">
                  «{searchResult.originalQuote}»
                </div>
              </div>

              {/* 2. Academic Historical Translation without omission or reduction (الترجمة الأكاديمية التاريخية بدون تنقيص أو تلخيص) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#374151]">
                  <span className="flex items-center gap-1.5 text-indigo-900">
                    <Languages className="w-4 h-4 text-indigo-700" />
                    <span>الترجمة الأكاديمية التاريخية المحققة (كاملة بدون تنقيص أو تلخيص):</span>
                  </span>
                  <button
                    onClick={() => handleCopyText(searchResult.academicTranslation, 'translation')}
                    className="text-xs text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer font-normal"
                  >
                    {copiedSection === 'translation' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'translation' ? 'تم النسخ' : 'نسخ الترجمة'}</span>
                  </button>
                </div>

                <div className="p-4 bg-indigo-50/40 border-r-4 border-indigo-700 border-y border-l border-indigo-100 rounded-l-xl text-xs md:text-sm text-[#1E293B] font-serif leading-loose text-justify">
                  {searchResult.academicTranslation}
                </div>
              </div>

              {/* 3. Evidence Analysis & Relevance to Constantine XI Thesis (وجه الدلالة والتحليل التاريخي) */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>وجه الاستدلال والدلالة التاريخية في سياق الأطروحة:</span>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-xs md:text-sm text-[#332A15] leading-relaxed">
                  <p className="mb-2">{searchResult.evidenceAnalysis}</p>
                  {searchResult.thesisRelevance && (
                    <div className="pt-2 border-t border-amber-200/60 text-xs text-[#52431E]">
                      <strong>موقع الدليل من الأطروحة:</strong> {searchResult.thesisRelevance}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Accredited Academic Citation Note (التوثيق الهامشي المعتمد) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#374151]">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#8B2635]" />
                    <span>صيغة التوثيق الهامشي الأكاديمي المعتمدة (Footnote Citation):</span>
                  </span>
                  <button
                    onClick={() => handleCopyText(searchResult.formalCitation, 'citation')}
                    className="text-xs text-[#8B2635] hover:underline flex items-center gap-1 cursor-pointer font-normal"
                  >
                    {copiedSection === 'citation' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'citation' ? 'تم النسخ' : 'نسخ الهامش'}</span>
                  </button>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#DDD6CA] rounded-xl text-xs text-[#4B5563] font-serif flex items-center justify-between gap-3">
                  <code className="text-xs text-[#1F2937] font-serif select-all">
                    {searchResult.formalCitation}
                  </code>
                </div>
              </div>

              {/* 5. Additional Supporting Quotes from the Same Source (شواهد إضافية إن وجدت) */}
              {searchResult.secondaryQuotes && searchResult.secondaryQuotes.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-[#EBE6DC]">
                  <h4 className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#8B2635]" />
                    <span>شواهد نصية مؤيدة إضافية في نفس الكتاب ({searchResult.secondaryQuotes.length}):</span>
                  </h4>

                  <div className="space-y-3">
                    {searchResult.secondaryQuotes.map((sq, idx) => (
                      <div key={idx} className="p-3.5 bg-[#FAF9F6] border border-[#E5E0D5] rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#8B2635] font-serif">
                            شاهد ({idx + 1}) — صفحة: {sq.printedPage}
                          </span>
                          <button
                            onClick={() => handleCopyText(`${sq.printedPage}: ${sq.originalQuote}\n${sq.academicTranslation}`, `sq-${idx}`)}
                            className="text-[11px] text-[#8B2635] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedSection === `sq-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>نسخ</span>
                          </button>
                        </div>
                        <div className="font-citation text-[#1F2937] bg-white p-2.5 rounded border border-[#EDE8DE] leading-relaxed">
                          «{sq.originalQuote}»
                        </div>
                        <div className="font-serif text-[#374151] leading-relaxed">
                          <strong>الترجمة الكاملة:</strong> {sq.academicTranslation}
                        </div>
                        {sq.evidenceAnalysis && (
                          <div className="text-[#64748B] text-[11px] pt-1">
                            {sq.evidenceAnalysis}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Note */}
              {searchResult.note && (
                <p className="text-[11px] text-[#6B7280] italic pt-2 border-t border-[#EFEBE4]">
                  {searchResult.note}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Suggested Inquiries & Search Session History */}
        <div className="lg:col-span-4 space-y-6">
          {/* Suggested Topics for Constantine XI Thesis */}
          <div className="bg-white border border-[#E2DDD3] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-[#EFEBE4] pb-3">
              <Sparkles className="w-4 h-4 text-[#8B2635]" />
              <h3 className="text-xs md:text-sm font-bold text-[#1F2937]">
                مقترحات استدلال جاهزة لأطروحتك
              </h3>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              انقر على أي قضية تاريخية من قضايا الأطروحة لتعبئتها فورياً والبحث عن موضعها وشاهدها في الكتاب المختار:
            </p>

            <div className="space-y-2">
              {suggestedThesisInquiries.map((inq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setClaimTopic(inq.title)}
                  className="w-full text-right p-2.5 rounded-xl border border-[#EDE8DF] hover:border-[#8B2635] bg-[#FAF8F5] hover:bg-white text-xs text-[#374151] hover:text-[#8B2635] transition-all cursor-pointer group flex flex-col gap-1"
                >
                  <span className="text-[10px] font-bold text-[#8B2635] px-2 py-0.5 rounded-full bg-[#8B2635]/10 w-fit">
                    {inq.category}
                  </span>
                  <span className="font-serif leading-relaxed line-clamp-2">
                    {inq.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search History in Current Session */}
          {searchHistory.length > 0 && (
            <div className="bg-white border border-[#E2DDD3] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-[#EFEBE4] pb-3">
                <History className="w-4 h-4 text-[#8B2635]" />
                <h3 className="text-xs md:text-sm font-bold text-[#1F2937]">
                  سجل استدلالات الجلسة ({searchHistory.length})
                </h3>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pl-1">
                {searchHistory.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setClaimTopic(item.topic);
                      setSearchResult(item.result);
                    }}
                    className="p-2.5 rounded-xl border border-[#EDE8DF] hover:bg-[#FAF8F5] transition-all cursor-pointer space-y-1 text-xs"
                  >
                    <div className="font-bold text-[#1F2937] font-serif truncate">
                      «{item.book}» — {item.result.printedPage}
                    </div>
                    <p className="text-[#64748B] text-[11px] truncate">
                      {item.topic}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic Methodological Guide */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-2.5 text-xs text-[#423618]">
            <div className="flex items-center gap-2 font-bold text-amber-900 font-serif">
              <GraduationCap className="w-4 h-4 text-amber-800" />
              <span>ضوابط الاستشهاد والترجمة الأكاديمية:</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside leading-relaxed text-[11px] text-[#423618]">
              <li><strong>رقم الصفحة المطبوعة:</strong> مستخرج ومحقق وفق طبعات النصوص النقدية المعتمدة.</li>
              <li><strong>النص الداخلي الحرفي:</strong> يُثبت كما هو بلسان مؤلفه الأصلي للحفاظ على الأصالة الوثائقية.</li>
              <li><strong>الترجمة الكاملة:</strong> التزام تام بعدم الاختصار أو التنقيص للمصطلحات التاريخية والأسماء والرتب.</li>
              <li><strong>التوثيق:</strong> صيغة حاشية جاهزة تلبي شروط مناقشة رسائل الماجستير والدكتوراه.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
