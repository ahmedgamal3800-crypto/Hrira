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
  AlertTriangle,
  HelpCircle,
  FolderTree,
  Search,
  Loader2,
  Bot,
  BookOpen
} from 'lucide-react';
import { Reference, ReferenceType, LanguageType, CategoryItem, ReferenceFile } from '../types';
import { getAlphabetKey, stripHonorificTitles } from '../services/alphabet';
import { generateSuggestedCitation } from '../services/citationFormatter';
import { dbService } from '../services/db';
import { extractMetadataFromBookFile } from '../services/bookMetadataExtractor';
import { searchBookAndAuthorWithAI } from '../services/aiBookService';
import { checkReferenceDuplicate, DuplicateCheckResult } from '../services/duplicateDetector';

interface ReferenceFormModalProps {
  reference?: Reference | null;
  initialReference?: Reference | null;
  existingReferences?: Reference[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (ref: Reference) => void;
  onOpenExistingReference?: (ref: Reference) => void;
  categories: CategoryItem[];
}

export const ReferenceFormModal: React.FC<ReferenceFormModalProps> = ({
  reference,
  initialReference,
  existingReferences,
  isOpen,
  onClose,
  onSave,
  onOpenExistingReference,
  categories
}) => {
  const activeReference = reference || initialReference || null;

  // Existing references for duplicate detection
  const [allReferences, setAllReferences] = useState<Reference[]>(existingReferences || []);
  const [duplicateError, setDuplicateError] = useState<DuplicateCheckResult | null>(null);
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
  const [translatorOrEditor, setTranslatorOrEditor] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [historicalRelevance, setHistoricalRelevance] = useState('');
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
  const [aiFilledFields, setAiFilledFields] = useState<{ label: string; value: string }[]>([]);

  const handleAiSearchBook = async () => {
    if (!aiSearchInput.trim()) {
      setAiSearchError('يرجى كتابة أو لصق بيانات الكتاب أو التوثيق الخام أولاً للبدء.');
      return;
    }
    setIsAiSearching(true);
    setAiSearchError(null);
    setAiSuccessNotice(null);
    setAiFilledFields([]);

    try {
      const result = await searchBookAndAuthorWithAI(aiSearchInput.trim());
      if (result.found) {
        const filledList: { label: string; value: string }[] = [];

        if (result.authorFullName) {
          const cleanFull = stripHonorificTitles(result.authorFullName);
          setAuthorFullName(cleanFull);
          filledList.push({ label: 'اسم المؤلف الكامل', value: cleanFull });
        }
        if (result.authorFirstName) {
          const cleanFirst = stripHonorificTitles(result.authorFirstName);
          setAuthorFirstName(cleanFirst);
          filledList.push({ label: 'الاسم الأول (للترتيب الأبجدي)', value: cleanFirst });
        }
        if (result.authorFamilyName) {
          const cleanFamily = stripHonorificTitles(result.authorFamilyName);
          setAuthorFamilyName(cleanFamily);
          filledList.push({ label: 'اسم العائلة / الشهرة', value: cleanFamily });
        }
        if (result.title) {
          setTitle(result.title);
          filledList.push({ label: 'عنوان الكتاب', value: result.title });
        }
        if (result.subtitle) {
          setSubtitle(result.subtitle);
          filledList.push({ label: 'العنوان الفرعي', value: result.subtitle });
        }
        if (result.publisher) {
          setPublisher(result.publisher);
          filledList.push({ label: 'دار النشر', value: result.publisher });
        }
        if (result.publicationPlace) {
          setPublicationPlace(result.publicationPlace);
          filledList.push({ label: 'مكان النشر', value: result.publicationPlace });
        }
        if (result.publicationYear) {
          setPublicationYear(result.publicationYear);
          filledList.push({ label: 'سنة النشر', value: result.publicationYear });
        }
        if (result.edition) {
          setEdition(result.edition);
          filledList.push({ label: 'الطبعة', value: result.edition });
        }
        if (result.volume) {
          setVolume(result.volume);
          filledList.push({ label: 'المجلد', value: result.volume });
        }
        if (result.pages) {
          setPages(result.pages);
          filledList.push({ label: 'الصفحات', value: result.pages });
        }
        if (result.translatorOrEditor) {
          setTranslatorOrEditor(result.translatorOrEditor);
          filledList.push({ label: 'المترجم/المحقق', value: result.translatorOrEditor });
        }
        if (result.language) {
          const validLangs: LanguageType[] = ['العربية', 'English', 'Français', 'Greek', 'Deutsch', 'Latin', 'Türkçe', 'Español', 'Italiano', 'أخرى'];
          const matchedLang = validLangs.find(l => l.toLowerCase() === result.language.toLowerCase()) || 
                             (result.language.toLowerCase().includes('eng') ? 'English' : 'العربية');
          setLanguage(matchedLang);
          filledList.push({ label: 'اللغة', value: matchedLang });
        }
        if (result.referenceType) {
          let rType: ReferenceType = 'كتاب (Book)';
          const rtLower = result.referenceType.toLowerCase();
          if (rtLower.includes('book') || rtLower.includes('كتاب')) rType = 'كتاب (Book)';
          else if (rtLower.includes('section') || rtLower.includes('فصل') || rtLower.includes('chapter')) rType = 'فصل في كتاب (Book Section)';
          else if (rtLower.includes('article') || rtLower.includes('مقال') || rtLower.includes('دورية')) rType = 'مقالة في دورية محكمة (Journal Article)';
          else if (rtLower.includes('primary') || rtLower.includes('مصدر') || rtLower.includes('مخطوط')) rType = 'مصدر أصلي / مخطوط (Primary Source)';
          else if (rtLower.includes('thesis') || rtLower.includes('رسالة')) rType = 'رسالة ماجستير (Master Thesis)';
          else if (rtLower.includes('dissertation') || rtLower.includes('دكتوراه')) rType = 'أطروحة دكتوراه (PhD Dissertation)';
          else if (rtLower.includes('document') || rtLower.includes('وثيقة')) rType = 'وثيقة أرشيفية (Archival Document)';
          else if (rtLower.includes('conference') || rtLower.includes('مؤتمر')) rType = 'بحث مؤتمر (Conference Paper)';
          setReferenceType(rType);
          filledList.push({ label: 'نوع المرجع', value: rType });
        }
        if (result.fullCitation) {
          setFullCitation(result.fullCitation);
        }
        if (result.authorBio) {
          setAuthorBio(result.authorBio);
        }
        if (result.historicalRelevance) {
          setHistoricalRelevance(result.historicalRelevance);
        }
        if (result.keywords && result.keywords.length > 0) {
          setKeywords(prev => Array.from(new Set([...prev, ...result.keywords])));
          filledList.push({ label: 'الكلمات المفتاحية', value: result.keywords.slice(0, 4).join(', ') });
        }

        setAiFilledFields(filledList);
        setAiSuccessNotice(`تم استخراج وتعبئة بيانات المرجع بالكامل بنجاح بواسطة الذكاء الاصطناعي (${filledList.length} حقول تم ملؤها تلقائياً بدقة).`);
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
    if (existingReferences && existingReferences.length > 0) {
      setAllReferences(existingReferences);
    } else if (isOpen) {
      dbService.getAllReferences().then(setAllReferences).catch(console.error);
    }
  }, [existingReferences, isOpen]);

  useEffect(() => {
    setDuplicateError(null);
    if (activeReference) {
      setAuthorFamilyName(activeReference.authorFamilyName || '');
      setAuthorFirstName(activeReference.authorFirstName || '');
      setAuthorFullName(activeReference.authorFullName || '');
      setTitle(activeReference.title || '');
      setSubtitle(activeReference.subtitle || '');
      setLanguage(activeReference.language || 'العربية');
      setReferenceType(activeReference.referenceType || 'كتاب (Book)');
      setPublisher(activeReference.publisher || '');
      setPublicationPlace(activeReference.publicationPlace || '');
      setPublicationYear(activeReference.publicationYear || '');
      setEdition(activeReference.edition || '');
      setVolume(activeReference.volume || '');
      setPages(activeReference.pages || '');
      setTranslatorOrEditor(activeReference.translatorOrEditor || '');
      setAuthorBio(activeReference.authorBio || '');
      setHistoricalRelevance(activeReference.historicalRelevance || '');
      setIsbn(activeReference.isbn || '');
      setDoi(activeReference.doi || '');
      setKeywords(activeReference.keywords || []);
      setFullCitation(activeReference.fullCitation || '');
      setCategoryIds(activeReference.categoryIds || []);
      setAttachedFile(activeReference.file);
      setFileBlob(null);
      setAiFilledFields([]);
      setAiSuccessNotice(null);
      setAiSearchError(null);
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
      setTranslatorOrEditor('');
      setAuthorBio('');
      setHistoricalRelevance('');
      setIsbn('');
      setDoi('');
      setKeywords([]);
      setFullCitation('');
      setCategoryIds([]);
      setAttachedFile(undefined);
      setFileBlob(null);
      setAiSearchInput('');
      setAiFilledFields([]);
      setAiSuccessNotice(null);
      setAiSearchError(null);
    }
  }, [activeReference, isOpen]);

  // Real-time live duplicate check as the user types
  const liveDuplicate = React.useMemo(() => {
    if (!isOpen) return null;
    const cleanFam = stripHonorificTitles(authorFamilyName).trim();
    const cleanFull = stripHonorificTitles(authorFullName).trim();
    const cleanFirst = stripHonorificTitles(authorFirstName).trim();

    if (title.trim().length < 3 && fullCitation.trim().length < 15 && isbn.trim().length < 8) {
      return null;
    }

    const res = checkReferenceDuplicate({
      id: activeReference?.id,
      title: title.trim(),
      authorFamilyName: cleanFam,
      authorFullName: cleanFull,
      authorFirstName: cleanFirst,
      publicationYear: publicationYear.trim(),
      publisher: publisher.trim(),
      isbn: isbn.trim(),
      doi: doi.trim(),
      fullCitation: fullCitation.trim()
    }, allReferences, activeReference?.id);

    return res.isDuplicate ? res : null;
  }, [isOpen, title, authorFamilyName, authorFullName, authorFirstName, publicationYear, publisher, isbn, doi, fullCitation, allReferences, activeReference]);

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

    // DUPLICATE REFERENCE VERIFICATION GUARD
    const dupCheck = checkReferenceDuplicate({
      id: activeReference?.id,
      title: title.trim(),
      authorFamilyName: cleanFamilyName.trim(),
      authorFirstName: cleanFirstName.trim(),
      authorFullName: cleanFullName.trim(),
      publicationYear: publicationYear.trim(),
      publisher: publisher.trim(),
      isbn: isbn.trim(),
      doi: doi.trim(),
      fullCitation: fullCitation.trim()
    }, allReferences, activeReference?.id);

    if (dupCheck.isDuplicate) {
      setDuplicateError(dupCheck);
      // Scroll to top of modal form to show the error banner clearly
      const formEl = document.getElementById('reference-form-scrollable');
      if (formEl) {
        formEl.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const alphabetKey = getAlphabetKey({
      authorFamilyName: cleanFamilyName,
      authorFullName: cleanFullName,
      authorFirstName: cleanFirstName,
      title
    });

    const newReference: Reference = {
      id: activeReference?.id || 'ref-' + Date.now(),
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
      translatorOrEditor: translatorOrEditor.trim(),
      authorBio: authorBio.trim(),
      historicalRelevance: historicalRelevance.trim(),
      isbn: isbn.trim(),
      doi: doi.trim(),
      keywords,
      fullCitation: fullCitation.trim() || `${cleanFullName || cleanFamilyName}: ${title}.`,
      alphabetKey,
      categoryIds,
      isFavorite: activeReference?.isFavorite || false,
      inTrash: false,
      dateAdded: activeReference?.dateAdded || new Date().toISOString(),
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
        <form 
          id="reference-form-scrollable"
          onSubmit={handleSubmit} 
          className="flex-1 overflow-y-auto p-6 space-y-6 text-xs md:text-sm"
        >
          {/* DUPLICATE REFERENCE ERROR BANNER */}
          {duplicateError && duplicateError.matchedReference && (
            <div 
              id="duplicate-reference-error-card" 
              className="bg-red-50 border-2 border-red-500 rounded-2xl p-5 text-red-950 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-red-900 flex items-center gap-2">
                      <span>خطأ: لا يمكن إضافة هذا المرجع لأنه مكرر ومسجل مسبقاً!</span>
                    </h3>
                    <p className="text-xs text-red-800 mt-1 leading-relaxed">
                      {duplicateError.detailsMessage || 'تم العثور على تطابق كامل مع مرجع آخر مسجل في مكتبتك الأكاديمية.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDuplicateError(null)}
                  className="p-1 text-red-500 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                  title="إغلاق التنبيه"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Matched Reference Details Box */}
              <div className="bg-white border border-red-200 rounded-xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-red-100">
                  <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#7D2433]" />
                    <span>بيانات المرجع الأصلي المطابق في مكتبتك:</span>
                  </span>
                  <span className="text-[11px] bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full font-bold">
                    سبب المنع: {duplicateError.matchReason}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-[#374151]">
                  <div>
                    <span className="font-semibold text-[#1F2937]">عنوان الكتاب: </span>
                    <span className="font-bold text-[#7D2433] text-sm">{duplicateError.matchedReference.title}</span>
                    {duplicateError.matchedReference.subtitle && (
                      <span className="text-[#6B7280]"> - {duplicateError.matchedReference.subtitle}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-[#1F2937]">المؤلف: </span>
                    <span className="font-medium text-[#111827]">
                      {duplicateError.matchedReference.authorFullName || duplicateError.matchedReference.authorFamilyName || 'غير محدد'}
                    </span>
                    {duplicateError.matchedReference.publicationYear && (
                      <span className="text-[#6B7280]"> • سنة النشر: {duplicateError.matchedReference.publicationYear}</span>
                    )}
                    {duplicateError.matchedReference.publisher && (
                      <span className="text-[#6B7280]"> • دار النشر: {duplicateError.matchedReference.publisher}</span>
                    )}
                  </div>

                  {duplicateError.matchedReference.fullCitation && (
                    <div className="mt-2 text-[11px] text-[#4B5563] bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E9E3D6] font-serif leading-relaxed">
                      <span className="font-bold block mb-0.5 text-[#7D2433]">الصيغة التوثيقية المعتمدة للمرجع المطابق:</span>
                      {duplicateError.matchedReference.fullCitation}
                    </div>
                  )}

                  {duplicateError.isInTrash && (
                    <div className="bg-amber-50 border border-amber-300 text-amber-900 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>تنبيه: هذا المرجع موجود حالياً داخل «سلة المحذوفات». يمكنك استعادته مباشرة بدلاً من تكرار إضافته.</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-red-100 mt-2">
                  {onOpenExistingReference && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenExistingReference(duplicateError.matchedReference!);
                        onClose();
                      }}
                      className="px-4 py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>الانتقال فوراً إلى المرجع المسجل في المكتبة</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDuplicateError(null)}
                    className="px-3.5 py-2 bg-white border border-[#D5CEC0] hover:bg-[#F3EFE7] text-[#374151] rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    العودة لتعديل البيانات وتغيير العنوان
                  </button>
                </div>
              </div>
            </div>
          )}

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
                <span>استخراج وتعبئة بيانات الكتاب بالذكاء الاصطناعي (Smart Citation Parser)</span>
              </div>
              <span className="text-[11px] bg-[#7D2433]/10 text-[#7D2433] px-2.5 py-1 rounded-full font-semibold">
                تحليل التوثيقات الخام وتجريد الألقاب آلياً
              </span>
            </div>

            <p className="text-xs text-[#5D5548] leading-relaxed">
              الصق أي صيغة توثيق خام أو اسم كتاب باللغة العربية أو الإنجليزية (مثل: <span className="font-mono text-[#7D2433] font-semibold" dir="ltr">Angelov, D., Imperial Ideology and Political Thought in Byzantium,1204–1330, Cambridge, Cambridge University Press,2007, PP. 78- 133.</span>)، وسيقوم الذكاء الاصطناعي فوراً بتفكيك النص وتعبئة جميع الحقول (المؤلف مجرداً من الألقاب، العنوان، الدار، المكان، السنة، والصفحات):
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <textarea
                  value={aiSearchInput}
                  onChange={(e) => setAiSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAiSearchBook();
                    }
                  }}
                  rows={2}
                  placeholder="الصق هنا نص التوثيق الخام أو اسم الكتاب للتحليل والتعبئة التلقائية..."
                  className="w-full pl-3 pr-9 py-2 bg-white border border-[#C5B79F] rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] focus:border-transparent outline-none shadow-inner resize-none font-sans"
                />
                <Search className="w-4 h-4 text-[#8C7E6C] absolute right-3 top-3" />
              </div>

              <button
                type="button"
                onClick={handleAiSearchBook}
                disabled={isAiSearching}
                className="px-5 py-2.5 bg-[#7D2433] hover:bg-[#631B27] disabled:bg-[#9E8B83] text-white font-bold rounded-xl text-xs md:text-sm transition-all flex sm:flex-col items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                {isAiSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ التحليل والتعبئة...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#E6C687]" />
                    <span>تعبئة ذكية فورية</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick pre-set examples */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#6B7280]">
              <span className="font-medium text-[#4B5563]">أمثلة للتجربة بنقرة واحدة:</span>
              {[
                { label: 'Angelov (توثيق خام كامل مع الصفحات)', val: 'Angelov, D., Imperial Ideology and Political Thought in Byzantium,1204–1330, Cambridge, Cambridge University Press,2007, PP. 78- 133.' },
                { label: 'Akropolites, G., The History', val: 'Akropolites, G., The History' },
                { label: 'Bartusis, The Late Byzantine Army', val: 'Bartusis, The Late Byzantine Army' },
                { label: 'ابن البيبي: تاريخ سلاجقة الروم', val: 'ابن البيبي: تاريخ سلاجقة الروم' },
                { label: 'العاشق باشا زاده', val: 'العاشق باشا زاده' }
              ].map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiSearchInput(example.val);
                  }}
                  className="bg-white/80 hover:bg-white border border-[#D9CEBA] px-2 py-1 rounded-md text-[#5D5548] hover:text-[#7D2433] transition-colors cursor-pointer text-right"
                  title={example.val}
                >
                  {example.label}
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

            {/* AI Success Notice & Badges */}
            {aiSuccessNotice && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-3.5 rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2 font-semibold">
                  <div className="flex items-center gap-2">
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

                {aiFilledFields.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-emerald-200/60">
                    {aiFilledFields.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-white/90 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md text-[11px]">
                        <span className="font-bold text-emerald-950">{f.label}:</span>
                        <span className="max-w-[200px] truncate" dir="auto">{f.value}</span>
                      </span>
                    ))}
                  </div>
                )}
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
                className={`w-full px-3 py-2 bg-white border rounded-lg text-xs md:text-sm font-citation text-base focus:ring-2 outline-none font-bold ${
                  liveDuplicate 
                    ? 'border-red-400 focus:ring-red-500 bg-red-50/30' 
                    : 'border-[#DDD6CA] focus:ring-[#7D2433]'
                }`}
                required
              />

              {/* Real-time live duplicate warning */}
              {liveDuplicate && liveDuplicate.matchedReference && (
                <div className="mt-1.5 p-2.5 bg-red-50 border border-red-300 rounded-lg text-xs text-red-900 flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      <strong>تنبيه تكرار:</strong> هذا المرجع مسجل بالفعل للمؤلف ({liveDuplicate.matchedReference.authorFullName || liveDuplicate.matchedReference.authorFamilyName}) - لن يُسمح بحفظه مكرراً.
                    </span>
                  </div>
                  {onOpenExistingReference && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenExistingReference(liveDuplicate.matchedReference!);
                        onClose();
                      }}
                      className="text-[#7D2433] hover:underline font-bold text-[11px] shrink-0 cursor-pointer"
                    >
                      عرض المرجع الحالي
                    </button>
                  )}
                </div>
              )}
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

          {/* Section 3: Edition, Volume, Year, Pages, Translator */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
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
                placeholder="مثال: 448 أو 78-133"
                className="w-full px-3 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7D2433] outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#374151] mb-1">
                المترجم / المحقق / المحرر
              </label>
              <input
                type="text"
                value={translatorOrEditor}
                onChange={(e) => setTranslatorOrEditor(e.target.value)}
                placeholder="مثال: ترجمة: ... / تحقيق: ..."
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

          {/* Historical Relevance & Academic Bio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-[#FAF9F5] border border-[#E9E3D6] rounded-xl p-3.5">
            <div>
              <label className="block font-semibold text-[#374151] mb-1 text-xs">
                الأهمية التاريخية للمرجع في سياق الأطروحة:
              </label>
              <textarea
                value={historicalRelevance}
                onChange={(e) => setHistoricalRelevance(e.target.value)}
                rows={2}
                placeholder="أهمية الكتاب للأطروحة، أو الفترة التاريخية التي يغطيها..."
                className="w-full px-3 py-1.5 bg-white border border-[#DDD6CA] rounded-lg text-xs focus:ring-2 focus:ring-[#7D2433] outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#374151] mb-1 text-xs">
                نبذة أكاديمية عن المؤلف:
              </label>
              <textarea
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                rows={2}
                placeholder="تخصص المؤلف، مكانته العلمية، انتمائه الأكاديمي..."
                className="w-full px-3 py-1.5 bg-white border border-[#DDD6CA] rounded-lg text-xs focus:ring-2 focus:ring-[#7D2433] outline-none"
              />
            </div>
          </div>

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
        <div className="px-6 py-3.5 bg-[#FAF9F5] border-t border-[#E5E0D5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#DDD6CA] hover:bg-[#F3EFE7] text-[#4B5563] font-medium rounded-lg text-xs md:text-sm cursor-pointer"
            >
              إلغاء
            </button>

            {(duplicateError || liveDuplicate) && (
              <span className="text-xs text-red-700 font-bold flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>المرجع مكرر - يُمنع تكرار الإضافة</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={Boolean(liveDuplicate)}
            className={`px-6 py-2 font-bold rounded-lg text-xs md:text-sm shadow-sm transition-colors flex items-center gap-2 ${
              liveDuplicate 
                ? 'bg-red-200 text-red-700 border border-red-300 cursor-not-allowed' 
                : 'bg-[#7D2433] hover:bg-[#681E2A] text-white cursor-pointer'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{reference ? 'حفظ التعديلات' : 'إضافة المرجع للمكتبة'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
