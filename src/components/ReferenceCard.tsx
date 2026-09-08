import React, { useState } from 'react';
import { 
  BookOpen, 
  Download, 
  Edit3, 
  MoreVertical, 
  Star, 
  FileText, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  Upload
} from 'lucide-react';
import { Reference, ViewMode } from '../types';

interface ReferenceCardProps {
  reference: Reference;
  viewMode: ViewMode;
  onSelect: (ref: Reference) => void;
  onEdit: (ref: Reference) => void;
  onRead: (ref: Reference) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDownloadFile?: (ref: Reference) => void;
  onAttachBook?: (ref: Reference, file: File) => void;
  onSearchEvidence?: (ref: Reference) => void;
}

export const ReferenceCard: React.FC<ReferenceCardProps> = ({
  reference,
  viewMode,
  onSelect,
  onEdit,
  onRead,
  onToggleFavorite,
  onDelete,
  onDownloadFile,
  onAttachBook,
  onSearchEvidence
}) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const cardFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttachBook) {
      onAttachBook(reference, file);
    }
    if (e.target) e.target.value = '';
  };

  const handleCopyCitation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = reference.fullCitation || `${reference.authorFullName}: ${reference.title}.`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLatin = /^[A-Za-z]/.test(reference.alphabetKey);

  // List View Rendering
  if (viewMode === 'list') {
    return (
      <div 
        id={`ref-card-${reference.id}`}
        onClick={() => onSelect(reference)}
        className="bg-white hover:bg-[#FDFBF7] border border-[#E5E0D5] hover:border-[#7D2433]/40 rounded-xl p-3.5 md:p-4 transition-all duration-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs group cursor-pointer"
      >
        <input 
          type="file" 
          ref={cardFileInputRef} 
          onChange={handleCardFileChange} 
          accept=".pdf,.doc,.docx,.epub" 
          className="hidden" 
        />
        {/* Alphabet Key & Main Info */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Alphabet Key Badge */}
          <div 
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shrink-0 shadow-2xs border ${
              isLatin
                ? 'bg-[#EBF1F6] text-[#1E3A8A] border-[#D0DFEB] font-mono'
                : 'bg-[#F9ECEF] text-[#7D2433] border-[#F2D1D8] font-citation'
            }`}
            title={`حرف التصنيف الأبجدي للمؤلف: ${reference.alphabetKey}`}
          >
            {reference.alphabetKey || '#'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-bold text-sm text-[#1F2937] hover:text-[#7D2433] transition-colors">
                {reference.authorFullName || `${reference.authorFamilyName}، ${reference.authorFirstName}`}
              </span>
              <span className="text-xs text-[#9CA3AF]">•</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F3EFE6] text-[#6B7280]">
                {reference.language}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569]">
                {reference.referenceType.split('(')[0].trim()}
              </span>
              {reference.publicationYear && (
                <span className="text-xs text-[#6B7280] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#9CA3AF]" />
                  {reference.publicationYear}
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-[#111827] line-clamp-1 mb-1 font-citation">
              {reference.title}
              {reference.volume && <span className="text-xs text-[#6B7280] font-sans mr-2">({reference.volume})</span>}
            </h3>

            {/* Verbatim citation snippet */}
            <p className="text-xs text-[#526071] line-clamp-1 italic font-citation bg-[#FAF8F5] px-2 py-1 rounded border border-[#EDE8DE]">
              {reference.fullCitation}
            </p>
          </div>
        </div>

        {/* Status Badges & Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* File state badge */}
          {reference.file ? (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
              <FileText className="w-3 h-3" />
              PDF مرفق
            </span>
          ) : (
            <span className="text-[11px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded">
              لا يوجد ملف
            </span>
          )}

          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(reference.id)}
            className={`p-1.5 rounded-md transition-colors ${
              reference.isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-[#9CA3AF] hover:text-amber-500'
            }`}
            title={reference.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <Star className={`w-4 h-4 ${reference.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Copy citation button */}
          <button
            onClick={handleCopyCitation}
            className="p-1.5 text-[#6B7280] hover:text-[#7D2433] hover:bg-[#FAF8F5] rounded-md transition-colors"
            title="نسخ صيغة المرجع الأصلية"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Read button */}
          <button
            onClick={() => onRead(reference)}
            className="px-2.5 py-1.5 text-xs font-semibold bg-[#FAF8F5] hover:bg-[#7D2433] text-[#7D2433] hover:text-white border border-[#E2DDD3] rounded-md transition-colors flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>قراءة</span>
          </button>

          {/* Edit button */}
          <button
            onClick={() => onEdit(reference)}
            className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] rounded-md transition-colors"
            title="تعديل المرجع"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Quick Attach Book Button */}
          {onAttachBook && (
            <button
              onClick={() => cardFileInputRef.current?.click()}
              className="p-1.5 text-[#6B7280] hover:text-[#7D2433] hover:bg-[#FAF8F5] rounded-md transition-colors"
              title="إرفاق كتاب وملء البيانات الناقصة تلقائياً"
            >
              <Upload className="w-4 h-4" />
            </button>
          )}

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] rounded-md"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div 
                className="absolute left-0 top-full mt-1 w-44 bg-white border border-[#DDD6CA] rounded-lg shadow-lg py-1 z-30 text-xs"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSelect(reference);
                  }}
                  className="w-full text-right px-3 py-1.5 hover:bg-[#F8F6F0] flex items-center gap-2 text-[#374151]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>عرض التفاصيل الكاملة</span>
                </button>
                {onSearchEvidence && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onSearchEvidence(reference);
                    }}
                    className="w-full text-right px-3 py-1.5 hover:bg-amber-50 flex items-center gap-2 text-amber-900 font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>استدلال من نصوص الكتاب</span>
                  </button>
                )}
                {reference.file && onDownloadFile && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDownloadFile(reference);
                    }}
                    className="w-full text-right px-3 py-1.5 hover:bg-[#F8F6F0] flex items-center gap-2 text-[#374151]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تنزيل الملف الأصلي</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(reference.id);
                  }}
                  className="w-full text-right px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>نقل إلى سلة المحذوفات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid View Rendering
  return (
    <div 
      id={`ref-card-${reference.id}`}
      onClick={() => onSelect(reference)}
      className="bg-white hover:bg-[#FCFBF8] border border-[#E5E0D5] hover:border-[#7D2433]/50 rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md group cursor-pointer relative"
    >
      <input 
        type="file" 
        ref={cardFileInputRef} 
        onChange={handleCardFileChange} 
        accept=".pdf,.doc,.docx,.epub" 
        className="hidden" 
      />
      {/* Top Banner with Alphabet Key & Type Badge */}
      <div className="p-3.5 pb-2.5 bg-gradient-to-b from-[#FAF8F3] to-white border-b border-[#EFEBE4] flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Alphabet Key Badge */}
          <div 
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-2xs border ${
              isLatin
                ? 'bg-[#EBF1F6] text-[#1E3A8A] border-[#D0DFEB] font-mono'
                : 'bg-[#F9ECEF] text-[#7D2433] border-[#F2D1D8] font-citation'
            }`}
            title={`حرف التصنيف الأبجدي للمؤلف: ${reference.alphabetKey}`}
          >
            {reference.alphabetKey || '#'}
          </div>

          <div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] block">
              {reference.referenceType.split('(')[0].trim()}
            </span>
          </div>
        </div>

        {/* Favorite & Quick Copy Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleCopyCitation}
            className="p-1 text-[#6B7280] hover:text-[#7D2433] rounded transition-colors"
            title="نسخ صيغة المرجع الأصلية"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onToggleFavorite(reference.id)}
            className={`p-1 rounded transition-colors ${
              reference.isFavorite ? 'text-amber-500' : 'text-[#9CA3AF] hover:text-amber-500'
            }`}
            title={reference.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <Star className={`w-3.5 h-3.5 ${reference.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Book Cover / Typographic Spine & Info */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Author details */}
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-bold text-[#1F2937] hover:text-[#7D2433] transition-colors truncate" title={reference.authorFullName}>
            {reference.authorFullName || `${reference.authorFamilyName}، ${reference.authorFirstName}`}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F2EA] text-[#6B7280] font-medium">
            {reference.language}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#111827] line-clamp-2 font-citation leading-snug mb-2 group-hover:text-[#7D2433] transition-colors">
          {reference.title}
        </h3>

        {/* Verbatim Full Citation preview as requested by user */}
        <div className="mt-auto pt-2 border-t border-[#F2ECE1] text-[11px] text-[#556372] font-citation line-clamp-2 italic bg-[#FAF8F5] p-2 rounded">
          {reference.fullCitation}
        </div>

        {/* Metadata Footer Tags */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#6B7280]">
          {reference.publicationYear && (
            <span className="flex items-center gap-1 bg-[#F4F1EA] px-1.5 py-0.5 rounded">
              <Calendar className="w-3 h-3 text-[#9CA3AF]" />
              {reference.publicationYear}
            </span>
          )}
          {reference.pages && (
            <span className="flex items-center gap-1 bg-[#F4F1EA] px-1.5 py-0.5 rounded">
              <Layers className="w-3 h-3 text-[#9CA3AF]" />
              {reference.pages} ص
            </span>
          )}
          {reference.file ? (
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
              <FileText className="w-2.5 h-2.5" />
              PDF
            </span>
          ) : (
            <span className="text-[#9CA3AF] text-[10px]">بدون ملف</span>
          )}
        </div>
      </div>

      {/* Card Action Buttons Footer */}
      <div 
        className="px-3.5 py-2.5 bg-[#FAF9F6] border-t border-[#EFEBE4] flex items-center justify-between text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onRead(reference)}
            className="px-3 py-1.5 bg-[#7D2433] hover:bg-[#681E2A] text-white font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>قراءة المرجع</span>
          </button>

          {onSearchEvidence && (
            <button
              onClick={() => onSearchEvidence(reference)}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              title="بحث عن معلومة أو استدلال داخل هذا الكتاب"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>استدلال</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {reference.file && onDownloadFile && (
            <button
              onClick={() => onDownloadFile(reference)}
              className="p-1.5 text-[#526071] hover:text-[#111827] hover:bg-[#EAE5DA] rounded-md transition-colors"
              title="تنزيل ملف المرجع"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onEdit(reference)}
            className="p-1.5 text-[#526071] hover:text-[#111827] hover:bg-[#EAE5DA] rounded-md transition-colors"
            title="تعديل المرجع"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {onAttachBook && (
            <button
              onClick={() => cardFileInputRef.current?.click()}
              className="p-1.5 text-[#526071] hover:text-[#7D2433] hover:bg-[#EAE5DA] rounded-md transition-colors"
              title="إرفاق كتاب وملء البيانات الناقصة تلقائياً"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onDelete(reference.id)}
            className="p-1.5 text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="حذف إلى السلة"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
