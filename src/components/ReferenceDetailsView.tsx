import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  Copy, 
  Check, 
  Download, 
  Edit3, 
  Star, 
  FileText, 
  Quote, 
  Plus, 
  History, 
  Calendar, 
  Globe, 
  Trash2,
  Layers,
  Sparkles,
  Upload,
  Save,
  X,
  RefreshCw,
  Info,
  Sliders
} from 'lucide-react';
import { 
  Reference, 
  ResearchNote, 
  CitationQuote, 
  CategoryItem, 
  ReferenceFile, 
  LanguageType, 
  ReferenceType 
} from '../types';
import { getAlphabetKey } from '../services/alphabet';
import { generateSuggestedCitation } from '../services/citationFormatter';
import { dbService } from '../services/db';
import { 
  extractMetadataFromBookFile, 
  mergeBookMetadataWithReference 
} from '../services/bookMetadataExtractor';

interface ReferenceDetailsViewProps {
  reference: Reference;
  categories?: CategoryItem[];
  notes?: ResearchNote[];
  citations?: CitationQuote[];
  onBack: () => void;
  onEdit: (ref: Reference) => void;
  onRead?: (ref: Reference) => void;
  onOpenReader?: (ref: Reference) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNote?: (refId: string) => void;
  onAddCitation?: (refId: string) => void;
  onViewVersions?: (refId: string) => void;
  onOpenVersionHistory?: (ref: Reference) => void;
  onDownloadFile?: (ref: Reference) => void;
  onUpdateReference?: (ref: Reference, fileBlob?: Blob, reason?: string) => Promise<void>;
  onSearchEvidence?: (ref: Reference) => void;
}

export const ReferenceDetailsView: React.FC<ReferenceDetailsViewProps> = ({
  reference,
  categories = [],
  notes = [],
  citations = [],
  onBack,
  onEdit,
  onRead,
  onOpenReader,
  onToggleFavorite,
  onDelete,
  onAddNote,
  onAddCitation,
  onViewVersions,
  onOpenVersionHistory,
  onDownloadFile,
  onUpdateReference,
  onSearchEvidence
}) => {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-extraction & Upload State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractNotice, setExtractNotice] = useState<{
    fileName: string;
    filledFields: { label: string; value: string }[];
  } | null>(null);

  // Success Notification State
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Inline Editing State
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(reference.title || '');
  const [editSubtitle, setEditSubtitle] = useState(reference.subtitle || '');
  const [editAuthorFamilyName, setEditAuthorFamilyName] = useState(reference.authorFamilyName || '');
  const [editAuthorFirstName, setEditAuthorFirstName] = useState(reference.authorFirstName || '');
  const [editAuthorFullName, setEditAuthorFullName] = useState(reference.authorFullName || '');
  const [editPublisher, setEditPublisher] = useState(reference.publisher || '');
  const [editPublicationPlace, setEditPublicationPlace] = useState(reference.publicationPlace || '');
  const [editPublicationYear, setEditPublicationYear] = useState(reference.publicationYear || '');
  const [editEdition, setEditEdition] = useState(reference.edition || '');
  const [editVolume, setEditVolume] = useState(reference.volume || '');
  const [editPages, setEditPages] = useState(reference.pages || '');
  const [editIsbn, setEditIsbn] = useState(reference.isbn || '');
  const [editDoi, setEditDoi] = useState(reference.doi || '');
  const [editFullCitation, setEditFullCitation] = useState(reference.fullCitation || '');
  const [editKeywords, setEditKeywords] = useState<string[]>(reference.keywords || []);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [editLanguage, setEditLanguage] = useState<LanguageType>(reference.language || 'العربية');
  const [editReferenceType, setEditReferenceType] = useState<ReferenceType>(reference.referenceType || 'كتاب (Book)');

  // Sync state whenever the selected reference changes
  useEffect(() => {
    setEditTitle(reference.title || '');
    setEditSubtitle(reference.subtitle || '');
    setEditAuthorFamilyName(reference.authorFamilyName || '');
    setEditAuthorFirstName(reference.authorFirstName || '');
    setEditAuthorFullName(reference.authorFullName || '');
    setEditPublisher(reference.publisher || '');
    setEditPublicationPlace(reference.publicationPlace || '');
    setEditPublicationYear(reference.publicationYear || '');
    setEditEdition(reference.edition || '');
    setEditVolume(reference.volume || '');
    setEditPages(reference.pages || '');
    setEditIsbn(reference.isbn || '');
    setEditDoi(reference.doi || '');
    setEditFullCitation(reference.fullCitation || '');
    setEditKeywords(reference.keywords || []);
    setEditLanguage(reference.language || 'العربية');
    setEditReferenceType(reference.referenceType || 'كتاب (Book)');
  }, [reference]);

  const handleCopyCitation = () => {
    if (reference?.fullCitation) {
      navigator.clipboard.writeText(reference.fullCitation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRead = () => {
    if (onRead) {
      onRead(reference);
    } else if (onOpenReader) {
      onOpenReader(reference);
    }
  };

  const handleViewVersions = () => {
    if (onViewVersions) {
      onViewVersions(reference.id);
    } else if (onOpenVersionHistory) {
      onOpenVersionHistory(reference);
    }
  };

  // Upload book & trigger intelligent auto-fill
  const handleAttachBookFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractNotice(null);

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

      // 2. Intelligently merge into existing reference (only filling missing fields)
      const { updatedRef, filledFields } = mergeBookMetadataWithReference(reference, extracted, refFile);

      // 3. Save file blob to IndexedDB
      await dbService.saveFile(fileId, file, file.name, file.type || 'application/pdf');

      // 4. Save updated reference
      const reason = filledFields.length > 0
        ? `تحديث تلقائي للمرجع وملء الحقول الناقصة (${filledFields.map((f) => f.label).join('، ')}) من الكتاب: ${file.name}`
        : `إرفاق كتاب بالمرجع: ${file.name}`;

      if (onUpdateReference) {
        await onUpdateReference(updatedRef, file, reason);
      } else {
        await dbService.saveReference(updatedRef, reason);
      }

      setExtractNotice({
        fileName: file.name,
        filledFields
      });

      setSaveFeedback('تم إرفاق الكتاب وتحديث بيانات المرجع بنجاح!');
      setTimeout(() => setSaveFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to attach book and extract metadata', err);
      alert('حدث خطأ أثناء قراءة ملف الكتاب. يرجى التأكد من صلاحية الملف.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save inline modifications
  const handleSaveInlineEdit = async () => {
    const alphabetKey = getAlphabetKey({
      authorFamilyName: editAuthorFamilyName,
      authorFullName: editAuthorFullName,
      authorFirstName: editAuthorFirstName,
      title: editTitle
    });

    const updated: Reference = {
      ...reference,
      title: editTitle.trim(),
      subtitle: editSubtitle.trim(),
      authorFamilyName: editAuthorFamilyName.trim(),
      authorFirstName: editAuthorFirstName.trim(),
      authorFullName: editAuthorFullName.trim() || `${editAuthorFirstName} ${editAuthorFamilyName}`.trim(),
      language: editLanguage,
      referenceType: editReferenceType,
      publisher: editPublisher.trim(),
      publicationPlace: editPublicationPlace.trim(),
      publicationYear: editPublicationYear.trim(),
      edition: editEdition.trim(),
      volume: editVolume.trim(),
      pages: editPages.trim(),
      isbn: editIsbn.trim(),
      doi: editDoi.trim(),
      keywords: editKeywords,
      fullCitation: editFullCitation.trim() || reference.fullCitation,
      alphabetKey,
      lastModified: new Date().toISOString()
    };

    if (onUpdateReference) {
      await onUpdateReference(updated, undefined, 'تعديل وتحرير بيانات المرجع يدوياً');
    } else {
      await dbService.saveReference(updated, 'تعديل وتحرير بيانات المرجع يدوياً');
    }

    setIsInlineEditing(false);
    setSaveFeedback('تم حفظ التعديلات على المرجع بنجاح!');
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  // Re-generate proposed citation based on current edited values
  const handleRegenerateCitation = () => {
    const suggested = generateSuggestedCitation(
      {
        authorFamilyName: editAuthorFamilyName,
        authorFirstName: editAuthorFirstName,
        authorFullName: editAuthorFullName,
        title: editTitle,
        publisher: editPublisher,
        publicationPlace: editPublicationPlace,
        publicationYear: editPublicationYear,
        edition: editEdition,
        volume: editVolume,
        pages: editPages,
        language: editLanguage
      },
      editLanguage === 'العربية' ? 'traditional_arabic' : 'chicago'
    );
    setEditFullCitation(suggested);
  };

  // Add keyword in inline edit
  const handleAddKeyword = () => {
    if (newKeywordInput.trim() && !editKeywords.includes(newKeywordInput.trim())) {
      setEditKeywords([...editKeywords, newKeywordInput.trim()]);
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (tag: string) => {
    setEditKeywords(editKeywords.filter((k) => k !== tag));
  };

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeNotes = Array.isArray(notes) ? notes : [];
  const safeCitations = Array.isArray(citations) ? citations : [];

  const refCategories = safeCategories.filter((c) => reference?.categoryIds?.includes(c.id));
  const refNotes = safeNotes.filter((n) => n?.referenceId === reference?.id);
  const refCitations = safeCitations.filter((c) => c?.referenceId === reference?.id);

  const isLatin = /^[A-Za-z]/.test(reference.alphabetKey);

  return (
    <div id="reference-details-view" className="space-y-6 max-w-5xl mx-auto pb-12 text-right" dir="rtl">
      {/* Hidden File Input for Book Attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAttachBookFile}
        accept=".pdf,.doc,.docx,.epub"
        className="hidden"
      />

      {/* Top Navigation & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DDD3] pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#F3EFE7] border border-[#DDD6CA] text-[#4B5563] text-xs md:text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى المكتبة</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(reference.id)}
            className={`p-2 rounded-lg border border-[#DDD6CA] transition-colors cursor-pointer ${
              reference.isFavorite ? 'bg-amber-50 text-amber-600 border-amber-300' : 'bg-white text-[#6B7280] hover:text-amber-600'
            }`}
            title={reference.isFavorite ? 'في المفضلة' : 'إضافة إلى المفضلة'}
          >
            <Star className={`w-4 h-4 ${reference.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Version history button */}
          <button
            onClick={handleViewVersions}
            className="p-2 rounded-lg bg-white border border-[#DDD6CA] text-[#4B5563] hover:text-[#111827] hover:bg-[#F3EFE7] transition-colors cursor-pointer"
            title="سجل التعديلات والإصدارات"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Quick Inline Edit Toggle Button */}
          <button
            onClick={() => setIsInlineEditing(!isInlineEditing)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer shadow-2xs ${
              isInlineEditing 
                ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-300' 
                : 'bg-white text-[#374151] border-[#DDD6CA] hover:bg-[#F3EFE7]'
            }`}
            title="التحرير والتعديل المباشر على الصفحة"
          >
            <Sliders className="w-4 h-4 text-[#7D2433]" />
            <span>{isInlineEditing ? 'إلغاء التحرير المباشر' : 'تحرير وتعديل المرجع'}</span>
          </button>

          {/* Full Form Modal Editor Button */}
          <button
            onClick={() => onEdit(reference)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#DDD6CA] hover:bg-[#F3EFE7] text-[#374151] text-xs md:text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="فتح نافذة التحرير الشاملة"
          >
            <Edit3 className="w-4 h-4 text-[#7D2433]" />
            <span>المحرر الكامل</span>
          </button>

          {/* Read Reference */}
          <button
            onClick={handleRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white text-xs md:text-sm font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>قراءة المرجع</span>
          </button>

          {/* Search Evidence inside this book */}
          {onSearchEvidence && (
            <button
              onClick={() => onSearchEvidence(reference)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs md:text-sm font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="البحث عن معلومة أو استدلال داخل نصوص هذا الكتاب"
            >
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>استدلال من نصوص الكتاب</span>
            </button>
          )}
        </div>
      </div>

      {/* Extracting / Analyzing Progress Indicator */}
      {isExtracting && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl flex items-center gap-3 animate-pulse shadow-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-700 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">جاري قراءة الكتاب واستخراج البيانات الببليوغرافية تلقائياً...</p>
            <p className="text-xs text-amber-700 mt-0.5">
              يقوم النظام بتحليل نصوص ومحددات الكتاب الرقمية، استخراج دار النشر، سنة النشر، عدد الصفحات، والـ ISBN وملء الحقول الناقصة.
            </p>
          </div>
        </div>
      )}

      {/* Auto-fill Success Announcement Banner */}
      {extractNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-xl shadow-xs space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                تم استخراج البيانات وملء الحقول الناقصة تلقائياً من الكتاب: <span className="underline">{extractNotice.fileName}</span>
              </span>
            </div>
            <button
              onClick={() => setExtractNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {extractNotice.filledFields.length > 0 ? (
            <div>
              <p className="text-xs text-emerald-800 mb-1.5 font-medium">
                تم تحديث وملء الحقول التالية بالبيانات الدقيقة من الكتاب:
              </p>
              <div className="flex flex-wrap gap-2">
                {extractNotice.filledFields.map((field, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-900 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{field.label}:</span>
                    <span className="text-emerald-950 font-mono font-bold">{field.value}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-emerald-800">
              تم ربط الكتاب بالمرجع وحفظه بنجاح، وجميع البيانات الأساسية للمرجع كانت مكتملة بالفعل.
            </p>
          )}

          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={() => setIsInlineEditing(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>مراجعة وتعديل البيانات الآن</span>
            </button>
            <button
              onClick={() => setExtractNotice(null)}
              className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              تم، إغلاق الإشعار
            </button>
          </div>
        </div>
      )}

      {/* Save Feedback Notice */}
      {saveFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* ========================================================
          MODE 1: INLINE EDITING INTERFACE (تمكين تحرير وتعديل على المرجع)
          ======================================================== */}
      {isInlineEditing ? (
        <div className="bg-white border-2 border-[#7D2433] rounded-2xl p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#7D2433]/10 text-[#7D2433] flex items-center justify-center font-bold">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">تحرير وتعديل بيانات المرجع</h2>
                <p className="text-xs text-[#6B7280]">
                  يمكنك تعديل أي معلومة، وسيتم حفظ نسخة في سجل الإصدارات التاريخية للمرجع
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInlineEditing(false)}
                className="px-3 py-1.5 bg-white border border-[#DDD6CA] hover:bg-[#F3EFE7] text-[#4B5563] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                إلغاء التحرير
              </button>
              <button
                type="button"
                onClick={handleSaveInlineEdit}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#7D2433] hover:bg-[#681E2A] text-white text-xs md:text-sm font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>

          {/* Quick Attach Book Button inside Inline Editor */}
          <div className="bg-[#FAF9F5] border border-[#E5E0D5] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#374151]">
              <Upload className="w-4 h-4 text-[#7D2433]" />
              <span>
                {reference.file ? `الملف المرتبط حالياً: ${reference.file.name}` : 'لا يوجد ملف كتاب مرتبط بهذا المرجع حالياً'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#7D2433] text-[#7D2433] hover:bg-[#7D2433] hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{reference.file ? 'استبدال الكتاب وملء النواقص' : 'إرفاق كتاب وملء النواقص تلقائياً'}</span>
            </button>
          </div>

          {/* Form Fields Grid */}
          <div className="space-y-4 text-xs md:text-sm">
            {/* Row 1: Title & Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="block font-bold text-[#374151]">عنوان المرجع / الكتاب <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] focus:border-[#7D2433] rounded-lg outline-none font-citation text-base font-bold text-[#111827]"
                  placeholder="عنوان الكتاب أو المرجع"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">عنوان فرعي إن وجد</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] focus:border-[#7D2433] rounded-lg outline-none text-[#1F2937]"
                  placeholder="عنوان فرعي"
                />
              </div>
            </div>

            {/* Row 2: Author Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FAF9F5] p-3.5 rounded-xl border border-[#EBE6DC]">
              <div className="space-y-1">
                <label className="block font-bold text-[#7D2433]">اسم المؤلف الكامل</label>
                <input
                  type="text"
                  value={editAuthorFullName}
                  onChange={(e) => setEditAuthorFullName(e.target.value)}
                  className="w-full p-2 bg-white border border-[#DDD6CA] focus:border-[#7D2433] rounded-lg outline-none font-bold text-[#111827]"
                  placeholder="مثال: دونالد إم. نيكول"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">اسم العائلة / الشهرة / الجد</label>
                <input
                  type="text"
                  value={editAuthorFamilyName}
                  onChange={(e) => setEditAuthorFamilyName(e.target.value)}
                  className="w-full p-2 bg-white border border-[#DDD6CA] focus:border-[#7D2433] rounded-lg outline-none text-[#111827]"
                  placeholder="مثال: نيكول أو ابن الأثير"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">الاسم الأول / الشخصي</label>
                <input
                  type="text"
                  value={editAuthorFirstName}
                  onChange={(e) => setEditAuthorFirstName(e.target.value)}
                  className="w-full p-2 bg-white border border-[#DDD6CA] focus:border-[#7D2433] rounded-lg outline-none text-[#111827]"
                  placeholder="مثال: دونالد"
                />
              </div>
            </div>

            {/* Row 3: Language and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">نوع المرجع الأكاديمي</label>
                <select
                  value={editReferenceType}
                  onChange={(e) => setEditReferenceType(e.target.value as ReferenceType)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none font-semibold text-[#1F2937]"
                >
                  <option value="كتاب (Book)">كتاب (Book)</option>
                  <option value="رسالة ماجستير (Master Thesis)">رسالة ماجستير (Master Thesis)</option>
                  <option value="أطروحة دكتوراه (PhD Dissertation)">أطروحة دكتوراه (PhD Dissertation)</option>
                  <option value="مقالة في دورية محكمة (Journal Article)">مقالة في دورية محكمة (Journal Article)</option>
                  <option value="مصدر أصلي / مخطوط (Primary Source)">مصدر أصلي / مخطوط (Primary Source)</option>
                  <option value="وثيقة أرشيفية (Archival Document)">وثيقة أرشيفية (Archival Document)</option>
                  <option value="فصل في كتاب (Book Section)">فصل في كتاب (Book Section)</option>
                  <option value="بحث مؤتمر (Conference Paper)">بحث مؤتمر (Conference Paper)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">لغة المرجع</label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value as LanguageType)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none font-semibold text-[#1F2937]"
                >
                  <option value="العربية">العربية</option>
                  <option value="English">English</option>
                  <option value="Français">Français</option>
                  <option value="Greek">Greek</option>
                  <option value="Deutsch">Deutsch</option>
                  <option value="Latin">Latin</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
            </div>

            {/* Row 4: Bibliographic Details (Publisher, Place, Year, Edition, Volume, Pages) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">دار النشر</label>
                <input
                  type="text"
                  value={editPublisher}
                  onChange={(e) => setEditPublisher(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none text-[#1F2937]"
                  placeholder="مثال: دار المعارف"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">مكان النشر</label>
                <input
                  type="text"
                  value={editPublicationPlace}
                  onChange={(e) => setEditPublicationPlace(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none text-[#1F2937]"
                  placeholder="مثال: القاهرة"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">سنة النشر</label>
                <input
                  type="text"
                  value={editPublicationYear}
                  onChange={(e) => setEditPublicationYear(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none font-bold text-[#1F2937]"
                  placeholder="مثال: 1993"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">عدد الصفحات / الصفحات</label>
                <input
                  type="text"
                  value={editPages}
                  onChange={(e) => setEditPages(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none text-[#1F2937]"
                  placeholder="مثال: 456 ص"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">المجلد / الجزء</label>
                <input
                  type="text"
                  value={editVolume}
                  onChange={(e) => setEditVolume(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none text-[#1F2937]"
                  placeholder="مثال: جـ1 أو Vol. 2"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">الطبعة</label>
                <input
                  type="text"
                  value={editEdition}
                  onChange={(e) => setEditEdition(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none text-[#1F2937]"
                  placeholder="مثال: ط1 أو 2nd ed."
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">الرقم الدولي (ISBN)</label>
                <input
                  type="text"
                  value={editIsbn}
                  onChange={(e) => setEditIsbn(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none font-mono text-xs text-[#1F2937]"
                  placeholder="978-..."
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#374151]">المعرف الرقمي (DOI)</label>
                <input
                  type="text"
                  value={editDoi}
                  onChange={(e) => setEditDoi(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none font-mono text-xs text-[#1F2937]"
                  placeholder="10...."
                />
              </div>
            </div>

            {/* Row 5: Keywords Tag Editor */}
            <div className="space-y-2">
              <label className="block font-bold text-[#374151]">الكلمات المفتاحية والوسوم</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="أدخل كلمة مفتاحية ثم اضغط إضافة"
                  className="flex-1 p-2 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-3 py-2 bg-[#FAF8F3] hover:bg-[#7D2433] text-[#7D2433] hover:text-white border border-[#DDD6CA] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  إضافة
                </button>
              </div>

              {editKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {editKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 bg-[#F1EDE4] text-[#4A5568] px-2.5 py-1 rounded-full text-xs font-medium"
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
            </div>

            {/* Row 6: Full Citation Formatter */}
            <div className="bg-[#FFFDF9] border-2 border-[#7D2433]/30 rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block font-bold text-[#7D2433] text-sm">
                  الصيغة الكاملة المعتمدة للمرجع (Full Citation) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateCitation}
                  className="inline-flex items-center gap-1.5 text-xs text-[#7D2433] hover:text-[#5A1723] bg-[#F7EBEF] hover:bg-[#F0DCE2] px-2.5 py-1 rounded-md transition-colors font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>إعادة توليد الصيغة تلقائياً من البيانات أعلاه</span>
                </button>
              </div>

              <textarea
                value={editFullCitation}
                onChange={(e) => setEditFullCitation(e.target.value)}
                rows={3}
                className="w-full p-3 bg-white border border-[#D5CEC0] rounded-lg font-citation text-base leading-relaxed text-[#1F2937] focus:ring-2 focus:ring-[#7D2433] outline-none"
                required
              />
            </div>

            {/* Bottom Save / Cancel Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE5DC]">
              <button
                type="button"
                onClick={() => setIsInlineEditing(false)}
                className="px-4 py-2 bg-white border border-[#DDD6CA] hover:bg-[#F3EFE7] text-[#4B5563] text-xs md:text-sm font-semibold rounded-lg cursor-pointer"
              >
                إلغاء التحرير
              </button>
              <button
                type="button"
                onClick={handleSaveInlineEdit}
                className="inline-flex items-center gap-2 px-6 py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white text-xs md:text-sm font-bold rounded-lg shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ كافة التعديلات الآن</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================
           MODE 2: STANDARD READ VIEW WITH DIRECT BOOK ATTACHMENT
           ======================================================== */
        <>
          {/* Main Header Hero Card */}
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="flex-1 space-y-3">
                {/* Alphabet Badge & Language & Type */}
                <div className="flex flex-wrap items-center gap-2">
                  <span 
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base border shadow-2xs ${
                      isLatin
                        ? 'bg-[#EBF1F6] text-[#1E3A8A] border-[#D0DFEB] font-mono'
                        : 'bg-[#F9ECEF] text-[#7D2433] border-[#F2D1D8] font-citation'
                    }`}
                    title={`حرف التصنيف الأبجدي: ${reference.alphabetKey}`}
                  >
                    {reference.alphabetKey}
                  </span>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F1F5F9] text-[#334155]">
                    {reference.referenceType}
                  </span>

                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#F4F1EA] text-[#554E45] flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#8C827A]" />
                    {reference.language}
                  </span>

                  {reference.publicationYear && (
                    <span className="text-xs text-[#6B7280] flex items-center gap-1 bg-[#F4F1EA] px-2 py-1 rounded-md">
                      <Calendar className="w-3 h-3 text-[#8C827A]" />
                      {reference.publicationYear}
                    </span>
                  )}

                  {reference.pages && (
                    <span className="text-xs text-[#6B7280] flex items-center gap-1 bg-[#F4F1EA] px-2 py-1 rounded-md">
                      <Layers className="w-3 h-3 text-[#8C827A]" />
                      {reference.pages}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#111827] font-citation leading-tight">
                    {reference.title}
                  </h1>
                  {reference.subtitle && (
                    <p className="text-sm md:text-base text-[#4B5563] font-citation mt-1">
                      {reference.subtitle}
                    </p>
                  )}
                </div>

                {/* Author */}
                <div className="text-sm md:text-base font-semibold text-[#7D2433] flex flex-wrap items-center gap-2">
                  <span>المؤلف:</span>
                  <span className="text-[#1F2937] font-bold">
                    {reference.authorFullName || `${reference.authorFamilyName}، ${reference.authorFirstName}`}
                  </span>
                  {reference.authorFamilyName && (
                    <span className="text-xs text-[#6B7280] font-normal bg-[#F3EFE7] px-2 py-0.5 rounded">
                      الشهرة / الجد: {reference.authorFamilyName}
                    </span>
                  )}
                </div>

                {/* Assigned Categories */}
                {refCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {refCategories.map((cat) => (
                      <span
                        key={cat.id}
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        • {cat.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* PDF Status and Action Card / Book Attachment Zone */}
              <div className="w-full md:w-72 bg-[#FAF9F5] border border-[#E2DDD3] rounded-xl p-4 flex flex-col justify-between shrink-0 space-y-3 shadow-2xs">
                <div>
                  <span className="text-xs font-bold text-[#374151] block mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#7D2433]" />
                    <span>ملف الكتاب الرقمي والوثيقة:</span>
                  </span>

                  {reference.file ? (
                    <div className="space-y-1.5 bg-white p-3 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>ملف الكتاب محفوظ محلياً</span>
                      </div>
                      <p className="text-xs text-[#1F2937] font-semibold truncate" title={reference.file.name}>
                        {reference.file.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-[#6B7280] pt-1 border-t border-[#F2ECE1]">
                        <span>{(reference.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                        {reference.file.pageCount && <span>{reference.file.pageCount} صفحة</span>}
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#C5BCAD] hover:border-[#7D2433] bg-white hover:bg-[#FAF8F5] rounded-xl p-4 text-center cursor-pointer transition-all group"
                    >
                      <Upload className="w-6 h-6 mx-auto text-[#8C827A] group-hover:text-[#7D2433] mb-1 transition-colors" />
                      <p className="text-xs font-bold text-[#7D2433]">إضافة الكتاب إلى المرجع</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        رفع ملف PDF لملء وتحديث البيانات الناقصة تلقائياً
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleRead}
                    className="w-full py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>فتح القارئ المدمج</span>
                  </button>

                  {reference.file ? (
                    <div className="grid grid-cols-2 gap-2">
                      {onDownloadFile && (
                        <button
                          onClick={() => onDownloadFile(reference)}
                          className="py-1.5 bg-white hover:bg-[#F3EFE7] border border-[#DDD6CA] text-[#374151] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="تنزيل الملف"
                        >
                          <Download className="w-3 h-3 text-[#6B7280]" />
                          <span>تنزيل</span>
                        </button>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="py-1.5 bg-white hover:bg-[#F3EFE7] border border-[#DDD6CA] text-[#7D2433] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="استبدال الكتاب أو إعادة الفحص"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>استبدال</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-1.5 bg-white hover:bg-[#F3EFE7] border border-[#7D2433] text-[#7D2433] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>اختيار ملف الكتاب الآن</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Full Citation Block */}
            <div className="mt-6 bg-[#FAF7F0] border-2 border-[#7D2433]/25 rounded-xl p-4.5 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#7D2433] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>الصيغة الكاملة المعتمدة للمرجع (كما أدخلها الباحث):</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsInlineEditing(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F3EFE7] border border-[#DDD6CA] rounded-md text-xs font-semibold text-[#7D2433] transition-colors cursor-pointer"
                    title="تعديل الصيغة"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={handleCopyCitation}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#F3EFE7] border border-[#DDD6CA] rounded-md text-xs font-semibold text-[#374151] transition-colors cursor-pointer"
                    title="نسخ صيغة المرجع إلى الحافظة"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span>نسخ الصيغة</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-base font-citation leading-relaxed text-[#1F2937] select-all bg-white p-3.5 rounded-lg border border-[#E5E0D5]">
                {reference.fullCitation}
              </p>
            </div>
          </div>

          {/* Bibliographic Metadata Grid with Quick Edit Link */}
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFEBE4] pb-2">
              <h2 className="text-base font-bold text-[#1F2937]">
                البيانات الببليوغرافية التفصيلية
              </h2>
              <button
                onClick={() => setIsInlineEditing(true)}
                className="inline-flex items-center gap-1 text-xs text-[#7D2433] hover:underline font-bold cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>تعديل هذه البيانات</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm">
              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EFEBE4]">
                <span className="text-[#8C827A] text-xs block mb-0.5">دار النشر:</span>
                <span className="font-semibold text-[#1F2937]">{reference.publisher || 'غير محدد'}</span>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EFEBE4]">
                <span className="text-[#8C827A] text-xs block mb-0.5">مكان النشر:</span>
                <span className="font-semibold text-[#1F2937]">{reference.publicationPlace || 'غير محدد'}</span>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EFEBE4]">
                <span className="text-[#8C827A] text-xs block mb-0.5">سنة النشر:</span>
                <span className="font-semibold text-[#1F2937]">{reference.publicationYear || 'غير محدد'}</span>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EFEBE4]">
                <span className="text-[#8C827A] text-xs block mb-0.5">الطبعة:</span>
                <span className="font-semibold text-[#1F2937]">{reference.edition || 'غير محدد'}</span>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EFEBE4]">
                <span className="text-[#8C827A] text-xs block mb-0.5">المجلد / الجزء:</span>
                <span className="font-semibold text-[#1F2937]">{reference.volume || 'غير محدد'}</span>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EFEBE4]">
                <span className="text-[#8C827A] text-xs block mb-0.5">الصفحات:</span>
                <span className="font-semibold text-[#1F2937]">{reference.pages || 'غير محدد'}</span>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EFEBE4]">
                <span className="text-[#8C827A] text-xs block mb-0.5">ISBN:</span>
                <span className="font-mono text-xs font-semibold text-[#1F2937]">{reference.isbn || '—'}</span>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EFEBE4]">
                <span className="text-[#8C827A] text-xs block mb-0.5">DOI:</span>
                <span className="font-mono text-xs font-semibold text-[#1F2937] truncate block" title={reference.doi}>
                  {reference.doi || '—'}
                </span>
              </div>

              {reference.translatorOrEditor && (
                <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EFEBE4] col-span-2">
                  <span className="text-[#8C827A] text-xs block mb-0.5">المترجم / المحقق / المحرر:</span>
                  <span className="font-semibold text-[#1F2937]">{reference.translatorOrEditor}</span>
                </div>
              )}

              {reference.historicalRelevance && (
                <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#EFEBE4] col-span-2">
                  <span className="text-[#8C827A] text-xs block mb-0.5">الأهمية العلمية والصلة بالأطروحة:</span>
                  <span className="font-semibold text-[#1F2937]">{reference.historicalRelevance}</span>
                </div>
              )}
            </div>

            {reference.authorBio && (
              <div className="bg-[#F8F5EE] border border-[#E6DEC9] rounded-xl p-4 mt-3">
                <div className="flex items-center gap-2 text-[#7D2433] font-bold text-xs mb-1">
                  <Info className="w-4 h-4" />
                  <span>نبذة أكاديمية عن المؤلف ومكانته العلمية:</span>
                </div>
                <p className="text-xs md:text-sm text-[#374151] leading-relaxed">
                  {reference.authorBio}
                </p>
              </div>
            )}

            {reference.keywords && reference.keywords.length > 0 && (
              <div className="pt-2">
                <span className="text-xs text-[#8C827A] block mb-1.5">الكلمات المفتاحية:</span>
                <div className="flex flex-wrap gap-1.5">
                  {reference.keywords.map((kw) => (
                    <span key={kw} className="px-2.5 py-1 bg-[#F4F1EA] text-[#4A5568] rounded-md text-xs font-medium">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Citations & Quotes section */}
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFEBE4] pb-3">
              <div className="flex items-center gap-2">
                <Quote className="w-5 h-5 text-[#7D2433]" />
                <h2 className="text-base font-bold text-[#1F2937]">
                  الاقتباسات والنصوص المنتقاة ({refCitations.length})
                </h2>
              </div>

              <button
                onClick={() => onAddCitation && onAddCitation(reference.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#7D2433] text-[#7D2433] hover:text-white border border-[#DDD6CA] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة اقتباس جديد</span>
              </button>
            </div>

            {refCitations.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] py-3 text-center">
                لم تسجل اقتباسات من هذا المرجع بعد. يمكنك إضافة اقتباسات محددة بأرقام الصفحات لاستخدامها في حواشي الأطروحة.
              </p>
            ) : (
              <div className="space-y-3">
                {refCitations.map((q) => (
                  <div key={q.id} className="bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#7D2433] font-semibold">
                      <span>صفحة: {q.pageNumber}</span>
                      <span className="text-[#8C827A] font-normal">{new Date(q.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <blockquote className="font-citation text-base text-[#111827] italic leading-relaxed border-r-2 border-[#7D2433] pr-3">
                      {q.quoteText}
                    </blockquote>
                    {q.commentary && (
                      <p className="text-xs text-[#4B5563] bg-white p-2.5 rounded-lg border border-[#EDE8DE]">
                        <strong className="text-[#1F2937]">تعليق الباحث:</strong> {q.commentary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFEBE4] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7D2433]" />
                <h2 className="text-base font-bold text-[#1F2937]">
                  الملاحظات النقدية والتحليلية ({refNotes.length})
                </h2>
              </div>

              <button
                onClick={() => onAddNote && onAddNote(reference.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#7D2433] text-[#7D2433] hover:text-white border border-[#DDD6CA] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تدوين ملاحظة</span>
              </button>
            </div>

            {refNotes.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] py-3 text-center">
                لا توجد ملاحظات مدونة لهذا المرجع.
              </p>
            ) : (
              <div className="space-y-3">
                {refNotes.map((note) => (
                  <div key={note.id} className="bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#1F2937]">{note.title}</h3>
                      {note.pageNumber && (
                        <span className="text-xs text-[#6B7280] bg-[#EFEBE2] px-2 py-0.5 rounded">
                          ص {note.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Danger Zone */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E2DDD3]">
            <span className="text-xs text-[#8C827A]">
              تاريخ الإضافة: {new Date(reference.dateAdded).toLocaleDateString('ar-EG')} • آخر تعديل: {new Date(reference.lastModified).toLocaleDateString('ar-EG')}
            </span>

            <button
              onClick={() => onDelete(reference.id)}
              className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف المرجع إلى سلة المحذوفات</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
