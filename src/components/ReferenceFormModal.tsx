import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Upload, 
  FileText, 
  Sparkles, 
  Trash2, 
  Check, 
  AlertCircle,
  HelpCircle,
  FolderTree,
  Search,
  Loader2,
  Bot
} from 'lucide-react';
import { Reference, ReferenceType, LanguageType, CategoryItem, ReferenceFile } from '../types';
import { getAlphabetKey, stripHonorificTitles } from '../services/alphabet';
import { generateSuggestedCitation } from '../services/citationFormatter';
import { dbService } from '../services/db';
import { extractMetadataFromBookFile } from '../services/bookMetadataExtractor';
import { searchBookAndAuthorWithAI } from '../services/aiBookService';

interface ReferenceFormModalProps {
  reference?: Reference | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (ref: Reference) => void;
  categories: CategoryItem[];
}

export const ReferenceFormModal: React.FC<ReferenceFormModalProps> = ({
  reference,
  isOpen,
  onClose,
  onSave,
  categories
}) => {
  // Form state
  const [authorFamilyName, setAuthorFamilyName] = useState('');
  const [authorFirstName, setAuthorFirstName] = useState('');
  const [authorFullName, setAuthorFullName] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [language, setLanguage] = useState<LanguageType>('العربية');
  const [referenceType, setReferenceType] = useState<ReferenceType>('كتاب (Book)');
  const [publisher, setPublisher] = useState('');
  const [publicationPlace, setPublicationPlace] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [edition, setEdition] = useState('');
  const [volume, setVolume] = useState('');
  const [pages, setPages] = useState('');
  const [isbn, setIsbn] = useState('');
  const [doi, setDoi] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [fullCitation, setFullCitation] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  
  // File state
  const [attachedFile, setAttachedFile] = useState<ReferenceFile | undefined>(undefined);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [autoFillNotice, setAutoFillNotice] = useState<{
    fileName: string;
    filledFields: { label: string; value: string }[];
  } | null>(null);

  // Suggested citation notice
  const [citationGeneratedNotice, setCitationGeneratedNotice] = useState(false);

  // AI Book Search & Author Name Verification State
  const [aiSearchInput, setAiSearchInput] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [aiSuccessNotice, setAiSuccessNotice] = useState<string | null>(null);

  const handleAiSearchBook = async () => {
    if (!aiSearchInput.trim()) {
      setAiSearchError('يرجى كتابة اسم الكتاب أو المؤلف أو نص التوثيق أولاً للبحث.');
      return;
    }
    setIsAiSearching(true);
    setAiSearchError(null);
    setAiSuccessNotice(null);

    try {
      const result = await searchBookAndAuthorWithAI(aiSearchInput.trim());
      if (result.found) {
        if (result.authorFullName) setAuthorFullName(stripHonorificTitles(result.authorFullName));
        if (result.authorFirstName) setAuthorFirstName(stripHonorificTitles(result.authorFirstName));
        if (result.authorFamilyName) setAuthorFamilyName(stripHonorificTitles(result.authorFamilyName));
        if (result.title) setTitle(result.title);
        if (result.subtitle) setSubtitle(result.subtitle);
        if (result.publisher) setPublisher(result.publisher);
        if (result.publicationPlace) setPublicationPlace(result.publicationPlace);
        if (result.publicationYear) setPublicationYear(result.publicationYear);
        if (result.edition) setEdition(result.edition);
        if (result.volume) setVolume(result.volume);
        if (result.language) setLanguage(result.language);
        if (result.referenceType) setReferenceType(result.referenceType);
        if (result.fullCitation) setFullCitation(result.fullCitation);
        if (result.keywords && result.keywords.length > 0) {
          setKeywords(prev => Array.from(new Set([...prev, ...result.keywords])));
        }
        setAiSuccessNotice(`تم التحقق بنجاح من المرجع! اسم المؤلف الكامل: ${result.authorFullName}`);
      } else {
        setAiSearchError('لم يتم العثور على نتائج دقيقة لهذا المرجع.');
      }
    } catch (err: any) {
      setAiSearchError(err?.message || 'حدث خطأ أثناء فحص وتدقيق الكتاب بالذكاء الاصطناعي.');
    } finally {
      setIsAiSearching(false);
    }
  };

  useEffect(() => {
    if (reference) {
      setAuthorFamilyName(reference.authorFamilyName || '');
      setAuthorFirstName(reference.authorFirstName || '');
      setAuthorFullName(reference.authorFullName || '');
      setTitle(reference.title || '');
      setSubtitle(reference.subtitle || '');
      setLanguage(reference.language || 'العربية');
      setReferenceType(reference.referenceType || 'كتاب (Book)');
      setPublisher(reference.publisher || '');
      setPublicationPlace(reference.publicationPlace || '');
      setPublicationYear(reference.publicationYear || '');
      setEdition(reference.edition || '');
      setVolume(reference.volume || '');
      setPages(reference.pages || '');
      setIsbn(reference.isbn || '');
      setDoi(reference.doi || '');
      setKeywords(reference.keywords || []);
      setFullCitation(reference.fullCitation || '');
      setCategoryIds(reference.categoryIds || []);
      setAttachedFile(reference.file);
      setFileBlob(null);
    } else {
      // Reset form
      setAuthorFamilyName('');
      setAuthorFirstName('');
      setAuthorFullName('');
      setTitle('');
      setSubtitle('');
      setLanguage('العربية');
      setReferenceType('كتاب (Book)');
      setPublisher('');
      setPublicationPlace('');
      setPublicationYear('');
      setEdition('');
      setVolume('');
      setPages('');
      setIsbn('');
      setDoi('');
      setKeywords([]);
      setFullCitation('');
      setCategoryIds([]);
      setAttachedFile(undefined);
      setFileBlob(null);
    }
  }, [reference, isOpen]);

  // If author first & family are typed and full name is empty, provide soft suggestion
  const handleFamilyNameChange = (val: string) => {
    setAuthorFamilyName(val);
    if (!authorFullName && val) {
      setAuthorFullName(authorFirstName ? `${authorFirstName} ${val}` : val);
    }
  };

  const handleFirstNameChange = (val: string) => {
    setAuthorFirstName(val);
    if (!authorFullName && authorFamilyName) {
      setAuthorFullName(`${val} ${authorFamilyName}`);
    }
  };

  // Add keyword
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (tag: string) => {
    setKeywords(keywords.filter((k) => k !== tag));
  };

  // File upload handler with automatic metadata extraction & filling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setAutoFillNotice(null);
    try {
      // 1. Extract metadata from PDF and filename
      const extracted = await extractMetadataFromBookFile(file);
      const fileId = 'file-' + Date.now();
      const refFile: ReferenceFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        pageCount: extracted.pageCount,
        uploadDate: new Date().toISOString()
      };

      setAttachedFile(refFile);
      setFileBlob(file);

      // Store file in IndexedDB
      await dbService.saveFile({
        id: fileId,
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
        blob: file
      });

      // 2. Automatically fill missing form fields
      const filled: { label: string; value: string }[] = [];

      if (!title && extracted.title) {
        setTitle(extracted.title);
        filled.push({ label: 'العنوان', value: extracted.title });
      }
      if (!authorFullName && extracted.authorFullName) {
        setAuthorFullName(extracted.authorFullName);
        filled.push({ label: 'اسم المؤلف', value: extracted.authorFullName });
      }
      if (!authorFamilyName && extracted.authorFamilyName) {
        setAuthorFamilyName(extracted.authorFamilyName);
        if (!authorFullName) {
          filled.push({ label: 'الشهرة / العائلة', value: extracted.authorFamilyName });
        }
      }
      if (!authorFirstName && extracted.authorFirstName) {
        setAuthorFirstName(extracted.authorFirstName);
      }
      if (!publicationYear && extracted.publicationYear) {
        setPublicationYear(extracted.publicationYear);
        filled.push({ label: 'سنة النشر', value: extracted.publicationYear });
      }
      if (!publisher && extracted.publisher) {
        setPublisher(extracted.publisher);
        filled.push({ label: 'دار النشر', value: extracted.publisher });
      }
      if (!publicationPlace && extracted.publicationPlace) {
        setPublicationPlace(extracted.publicationPlace);
        filled.push({ label: 'مكان النشر', value: extracted.publicationPlace });
      }
      if (!pages && extracted.pages) {
        setPages(extracted.pages);
        filled.push({ label: 'عدد الصفحات', value: extracted.pages });
      }
      if (!isbn && extracted.isbn) {
        setIsbn(extracted.isbn);
        filled.push({ label: 'ISBN', value: extracted.isbn });
      }
      if (!doi && extracted.doi) {
        setDoi(extracted.doi);
        filled.push({ label: 'DOI', value: extracted.doi });
      }
      if (!volume && extracted.volume) {
        setVolume(extracted.volume);
        filled.push({ label: 'المجلد', value: extracted.volume });
      }
      if (!edition && extracted.edition) {
        setEdition(extracted.edition);
        filled.push({ label: 'الطبعة', value: extracted.edition });
      }
      if (extracted.keywords && extracted.keywords.length > 0) {
        const merged = Array.from(new Set([...keywords, ...extracted.keywords]));
        setKeywords(merged);
      }

      // If full citation is empty, auto-generate citation suggestion
      if (!fullCitation) {
        const suggested = generateSuggestedCitation({
          authorFamilyName: authorFamilyName || extracted.authorFamilyName,
          authorFirstName: authorFirstName || extracted.authorFirstName,
          authorFullName: authorFullName || extracted.authorFullName,
          title: title || extracted.title,
          publisher: publisher || extracted.publisher,
          publicationPlace: publicationPlace || extracted.publicationPlace,
          publicationYear: publicationYear || extracted.publicationYear,
          edition: edition || extracted.edition,
          volume: volume || extracted.volume,
          pages: pages || extracted.pages,
          language
        }, language === 'العربية' ? 'traditional_arabic' : 'chicago');
        if (suggested) {
          setFullCitation(suggested);
        }
      }

      setAutoFillNotice({
        fileName: file.name,
        filledFields: filled
      });
    } catch (err) {
      console.error('Failed to process file upload', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Generate citation button (optional user helper, strictly preserving user choice)
  const handleGenerateCitation = () => {
    const suggested = generateSuggestedCitation({
      authorFamilyName,
      authorFirstName,
      authorFullName,
      title,
      publisher,
      publicationPlace,
      publicationYear,
      edition,
      volume,
      pages,
      language
    }, language === 'العربية' ? 'traditional_arabic' : 'chicago');

    setFullCitation(suggested);
    setCitationGeneratedNotice(true);
    setTimeout(() => setCitationGeneratedNotice(false), 3000);
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanFullName = stripHonorificTitles(authorFullName);
    const cleanFirstName = stripHonorificTitles(authorFirstName);
    const cleanFamilyName = stripHonorificTitles(authorFamilyName);

    if (!title.trim() && !cleanFamilyName.trim() && !cleanFullName.trim()) {
      alert('يرجى كتابة عنوان المرجع أو اسم المؤلف على الأقل.');
      return;
    }

    const alphabetKey = getAlphabetKey({
      authorFamilyName: cleanFamilyName,
      authorFullName: cleanFullName,
      authorFirstName: cleanFirstName,
      title
    });

    const newReference: Reference = {
      id: reference?.id || 'ref-' + Date.now(),
      authorFamilyName: cleanFamilyName.trim(),
      authorFirstName: cleanFirstName.trim(),
      authorFullName: cleanFullName.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      language,
      referenceType,
      publisher: publisher.trim(),
      publicationPlace: publicationPlace.trim(),
      publicationYear: publicationYear.trim(),
      edition: edition.trim(),
      volume: volume.trim(),
      pages: pages.trim(),
      isbn: isbn.trim(),
      doi: doi.trim(),
      keywords,
      fullCitation: fullCitation.trim() || `${cleanFullName || cleanFamilyName}: ${title}.`,
      alphabetKey,
      categoryIds,
      isFavorite: reference?.isFavorite || false,
      inTrash: false,
      dateAdded: reference?.dateAdded || new Date().toISOString(),
      lastModified: new Date().toISOString(),
      file: attachedFile
    };

    onSave(newReference);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-[#E5E0D5] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#FAF9F5] border-b border-[#E5E0D5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7D2433] text-white flex items-center justify-center font-bold">
              {reference ? 'ت' : '+'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1F2937]">
                {reference ? 'تعديل بيانات المرجع الأكاديمي' : 'إضافة مرجع أو كتاب جديد'}
              </h2>
              <p className="text-xs text-[#6B7280]">
                يحتفظ النظام بالصيغة المدخلة حرفياً دون أي تغيير تلقائي
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-[#9CA3AF] hover:text-[#1F2937] hover:bg-[#EAE5DC] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs md:text-sm">
          {/* Auto-fill notification banner if a file was just uploaded & analyzed */}
          {autoFillNotice && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2 font-bold text-sm text-emerald-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>تم استخراج البيانات وملء الحقول الناقصة تلقائياً من ملف: {autoFillNotice.fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoFillNotice(null)}
                  className="text-emerald-700 hover:text-emerald-950 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {autoFillNotice.filledFields.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {autoFillNotice.filledFields.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded text-xs font-semibold">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{f.label}:</span>
                      <span className="font-mono">{f.value}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-800">
                  تم ربط ملف الكتاب بنجاح. كافة الحقول السابقة تم الحفاظ عليها.
                </p>
              )}
            </div>
          )}

          {/* AI Book Search & Author Name Verification Tool */}
          <div className="bg-linear-to-r from-[#FBF8F3] to-[#F5F0E6] border-2 border-[#D4C3A3] rounded-2xl p-4 md:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[#7D2433] font-bold text-sm">
                <div className="p-1.5 bg-[#7D2433] text-white rounded-lg shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <span>البحث عن الكتاب وتدقيق اسم المؤلف بالذكاء الاصطناعي</span>
              </div>
              <span className="text-[11px] bg-[#7D2433]/10 text-[#7D2433] px-2.5 py-1 rounded-full font-semibold">
                استخراج الاسم الكامل والموثق آلياً
              </span>
            </div>

            <p className="text-xs text-[#5D5548] leading-relaxed">
              اكتب أو الصق اسم الكتاب أو المؤلف أو التوثيق الخام (مثل: <span className="font-mono text-[#7D2433] font-medium" dir="ltr">Akropolites, G., The History</span> أو <span className="font-mono text-[#7D2433] font-medium" dir="ltr">Alix, Precis</span> أو <span className="font-medium text-[#7D2433]">ابن البيبي: تاريخ سلاجقة الروم</span>)، وسيقوم الذكاء الاصطناعي بالبحث والتحقق واستخراج اسم المؤلف الرباعي/الكامل وصيغة التوثيق المعتمدة وتعبئة الحقول آلياً:
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={aiSearchInput}
                  onChange={(e) => setAiSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAiSearchBook();
                    }
                  }}
                  placeholder="اكتب اسم الكتاب أو نص التوثيق هنا للبحث والتدقيق..."
                  className="w-full pl-3 pr-9 py-2.5 bg-white border border-[#C5B79F] rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] focus:border-transparent outline-none shadow-inner"
                />
                <Search className="w-4 h-4 text-[#8C7E6C] absolute right-3 top-3" />
              </div>

              <button
                type="button"
                onClick={handleAiSearchBook}
                disabled={isAiSearching}
                className="px-4 py-2.5 bg-[#7D2433] hover:bg-[#631B27] disabled:bg-[#9E8B83] text-white font-bold rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
              >
                {isAiSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ البحث والتدقيق...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#E6C687]" />
                    <span>تدقيق وتعبئة ذكية</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick pre-set examples */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#6B7280]">
              <span className="font-medium text-[#4B5563]">أمثلة سريعة للتجربة:</span>
              {[
                'Akropolites, G., The History',
                'Bartusis, The Late Byzantine Army',
                'Burns, Catalan Company',
                'ابن البيبي: تاريخ سلاجقة الروم',
                'العاشق باشا زاده'
              ].map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiSearchInput(example);
                  }}
                  className="bg-white/80 hover:bg-white border border-[#D9CEBA] px-2 py-0.5 rounded-md text-[#5D5548] hover:text-[#7D2433] transition-colors cursor-pointer"
                >
                  {example}
                </button>
              ))}
            </div>

            {/* AI Error Alert */}
            {aiSearchError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{aiSearchError}</span>
              </div>
            )}

            {/* AI Success Notice */}
            {aiSuccessNotice && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-3 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{aiSuccessNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiSuccessNotice(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Section 1: Authorship Fields (Strict Separation) */}
          <div className="bg-[#FAF8F3] border border-[#E9E3D6] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-sm text-[#7D2433] flex items-center gap-1.5">
                <span>بيانات المؤلف (محددة لضبط الفهرسة الأبجدية بدقة)</span>
              </h3>
              <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-md font-semibold">
                قاعدة توثيقية: لا تضع ألقاباً أمام اسم المؤلف (دون دكتور/دكتورة/سير/شيخ)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  اسم العائلة / اللقب / الجد (Family Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={authorFamilyName}
                  onChange={(e) => handleFamilyNameChange(e.target.value)}
                  placeholder="مثال: كومنينا / Akropolites / Nicol / ابن الأثير"
                  className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] focus:border-transparent outline-none"
                  required
                />
                <span className="text-[10px] text-[#8C827A] mt-0.5 block">
                  يبدأ به الفهرس الأبجدي وحرف التصنيف
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  الاسم الشخصي (First Name)
                </label>
                <input
                  type="text"
                  value={authorFirstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  placeholder="مثال: آنا / George / Donald M. / عز الدين"
                  className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  اسم المؤلف الكامل (Full Author Name)
                </label>
                <input
                  type="text"
                  value={authorFullName}
                  onChange={(e) => setAuthorFullName(e.target.value)}
                  placeholder="مثال: آنا كومنينا / Donald M. Nicol"
                  className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Reference Title & Core Classification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-2">
              <label className="block font-semibold text-[#374151] mb-1">
                عنوان المرجع / الكتاب / الأطروحة (Title) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: الألكسياد / The Last Centuries of Byzantium"
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm font-citation text-base focus:ring-2 focus:ring-[#7D2433] focus:border-transparent outline-none font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                لغة المرجع (Language)
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageType)}
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] focus:border-transparent outline-none"
              >
                <option value="العربية">العربية</option>
                <option value="English">English (الإنجليزية)</option>
                <option value="Français">Français (الفرنسية)</option>
                <option value="Greek">Greek (اليونانية / البيزنطية)</option>
                <option value="Deutsch">Deutsch (الألمانية)</option>
                <option value="Latin">Latin (اللاتينية)</option>
                <option value="أخرى">لغة أخرى</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                نوع المرجع (Reference Type)
              </label>
              <select
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value as ReferenceType)}
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] focus:border-transparent outline-none"
              >
                <option value="كتاب (Book)">كتاب (Book)</option>
                <option value="مصدر أصلي / مخطوط (Primary Source)">مصدر أصلي / مخطوط (Primary Source)</option>
                <option value="رسالة ماجستير (Master Thesis)">رسالة ماجستير (Master Thesis)</option>
                <option value="أطروحة دكتوراه (PhD Dissertation)">أطروحة دكتوراه (PhD Dissertation)</option>
                <option value="مقالة في دورية محكمة (Journal Article)">مقالة في دورية محكمة (Journal Article)</option>
                <option value="وثيقة أرشيفية (Archival Document)">وثيقة أرشيفية (Archival Document)</option>
                <option value="فصل في كتاب (Book Section)">فصل في كتاب (Book Section)</option>
                <option value="بحث مؤتمر (Conference Paper)">بحث مؤتمر (Conference Paper)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                دار النشر (Publisher)
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="مثال: المجلس الأعلى للثقافة / Oxford University Press"
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                مكان النشر (Publication Place)
              </label>
              <input
                type="text"
                value={publicationPlace}
                onChange={(e) => setPublicationPlace(e.target.value)}
                placeholder="مثال: القاهرة / Oxford / بيروت"
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] outline-none"
              />
            </div>
          </div>

          {/* Section 3: Edition, Volume, Year, Pages */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                سنة النشر (Year)
              </label>
              <input
                type="text"
                value={publicationYear}
                onChange={(e) => setPublicationYear(e.target.value)}
                placeholder="مثال: 2004 أو 1993"
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                الطبعة (Edition)
              </label>
              <input
                type="text"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                placeholder="مثال: طـ1 أو 2nd ed."
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                الجزء / المجلد (Volume)
              </label>
              <input
                type="text"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="مثال: جـ1 أو Vol. 2"
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                الصفحات (Pages)
              </label>
              <input
                type="text"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="مثال: 448 أو 120-145"
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] outline-none"
              />
            </div>
          </div>

          {/* Section 4: ISBN, DOI, Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                الترقيم الدولي (ISBN) إن وجد
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="مثال: 978-0199210671"
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                معرف الكائن الرقمي (DOI) إن وجد
              </label>
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="مثال: 10.1093/acprof:oso/..."
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                الكلمات المفتاحية (Keywords)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="أدخل كلمة ثم اضغط إضافة"
                  className="w-full px-2.5 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs focus:ring-2 focus:ring-[#7D2433] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-3 py-1 bg-[#EAE5DA] hover:bg-[#DDD6CA] text-[#374151] rounded-lg font-semibold cursor-pointer"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywords.map((kw) => (
                <span 
                  key={kw} 
                  className="inline-flex items-center gap-1 bg-[#F1EDE4] text-[#4A5568] px-2.5 py-1 rounded-full text-xs"
                >
                  <span>#{kw}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveKeyword(kw)}
                    className="hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Section 5: Categories */}
          {categories.length > 0 && (
            <div className="bg-[#FAF9F6] border border-[#E9E3D7] rounded-xl p-3.5 space-y-2">
              <label className="block font-semibold text-[#374151] text-xs flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-[#7D2433]" />
                <span>إدراج المرجع في التصنيفات الأكاديمية:</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isChecked = categoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#7D2433]/10 border-[#7D2433] text-[#7D2433] font-semibold'
                          : 'bg-white border-[#DDD6CA] text-[#4B5563] hover:bg-[#F3EFE7]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategoryIds([...categoryIds, cat.id]);
                          } else {
                            setCategoryIds(categoryIds.filter((id) => id !== cat.id));
                          }
                        }}
                        className="rounded text-[#7D2433] focus:ring-[#7D2433]"
                      />
                      <span>{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 6: CRITICAL FIELD - Full Citation (حقل الصيغة الكاملة للمرجع كما أدخلها المستخدم) */}
          <div className="bg-[#FFFDF9] border-2 border-[#7D2433]/30 rounded-xl p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block font-bold text-[#7D2433] text-sm">
                الصيغة الكاملة للمرجع (Full Citation) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateCitation}
                className="inline-flex items-center gap-1.5 text-xs text-[#7D2433] hover:text-[#5A1723] bg-[#F7EBEF] hover:bg-[#F0DCE2] px-2.5 py-1 rounded-md transition-colors font-semibold cursor-pointer"
                title="توليد صيغة أكاديمية مقترحة مع الاحتفاظ بحرية تعديلها"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>توليد صيغة مقترحة تلقائياً</span>
              </button>
            </div>

            <textarea
              value={fullCitation}
              onChange={(e) => setFullCitation(e.target.value)}
              rows={3}
              placeholder="مثال: آنا كومنينا: الألكسياد، ترجمة د. حسن حبشي، جـ1، طـ1، المجلس الأعلى للثقافة، القاهرة، 2004م."
              className="w-full p-3 bg-white border border-[#D5CEC0] rounded-lg font-citation text-base leading-relaxed text-[#1F2937] focus:ring-2 focus:ring-[#7D2433] outline-none"
              required
            />

            <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
              <span>
                🔒 سيتم حفظ هذه الصيغة تماماً كما دونتها دون أي اختصار أو تبديل.
              </span>
              {citationGeneratedNotice && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> تم توليد الصيغة المقترحة، يمكنك تعديلها كما تشاء.
                </span>
              )}
            </div>
          </div>

          {/* Section 7: File Upload (PDF/Document) */}
          <div className="bg-[#FAF9F5] border border-[#E5E0D5] rounded-xl p-4 space-y-2">
            <label className="block font-semibold text-[#374151] mb-1">
              رفع ملف المرجع الأصلي (PDF أو وثيقة)
            </label>

            {attachedFile ? (
              <div className="flex items-center justify-between p-3 bg-white border border-emerald-300 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-[#1F2937] block">
                      {attachedFile.name}
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      الحجم: {(attachedFile.size / (1024 * 1024)).toFixed(2)} ميجابايت • تم الحفظ محلياً
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAttachedFile(undefined);
                    setFileBlob(null);
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                  title="حذف الملف المرفق"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#DDD6CA] hover:border-[#7D2433] rounded-xl p-5 text-center transition-colors bg-white">
                <Upload className="w-7 h-7 mx-auto text-[#9CA3AF] mb-1.5" />
                <p className="text-xs font-semibold text-[#374151]">
                  اسحب وأفلت ملف الـ PDF هنا، أو اضغط للاختيار من جهازك
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  يتم تخزين الملف بأمان في قاعدة بيانات المتصفح (IndexedDB) للقراءة بدون إنترنت
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.epub"
                  onChange={handleFileUpload}
                  className="mt-3 text-xs text-[#6B7280] file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#7D2433] file:text-white hover:file:bg-[#681E2A] cursor-pointer"
                />
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#FAF9F5] border-t border-[#E5E0D5] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#DDD6CA] hover:bg-[#F3EFE7] text-[#4B5563] font-medium rounded-lg text-xs md:text-sm cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white font-bold rounded-lg text-xs md:text-sm shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{reference ? 'حفظ التعديلات' : 'إضافة المرجع للمكتبة'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
