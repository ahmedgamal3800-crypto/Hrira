import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  BookOpen, 
  Tag, 
  X 
} from 'lucide-react';
import { ResearchNote, Reference } from '../types';

interface NotesViewProps {
  notes: ResearchNote[];
  references: Reference[];
  onSaveNote: (note: ResearchNote) => void;
  onDeleteNote: (id: string) => void;
  onSelectReference: (ref: Reference) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  references,
  onSaveNote,
  onDeleteNote,
  onSelectReference
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRefFilter, setSelectedRefFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editNoteId, setEditNoteId] = useState<string | null>(null);

  // Form fields
  const [refId, setRefId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeRefs = references.filter((r) => !r.inTrash);

  const handleStartNew = () => {
    setEditNoteId(null);
    setRefId('');
    setTitle('');
    setContent('');
    setPageNumber('');
    setTags([]);
    setIsFormOpen(true);
  };

  const handleStartEdit = (note: ResearchNote) => {
    setEditNoteId(note.id);
    setRefId(note.referenceId || '');
    setTitle(note.title);
    setContent(note.content);
    setPageNumber(note.pageNumber || '');
    setTags(note.tags || []);
    setIsFormOpen(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const matchedRef = references.find((r) => r.id === refId);

    const noteToSave: ResearchNote = {
      id: editNoteId || 'note-' + Date.now(),
      referenceId: refId || undefined,
      referenceTitle: matchedRef?.title,
      title: title.trim(),
      content: content.trim(),
      pageNumber: pageNumber.trim() || undefined,
      tags,
      createdAt: editNoteId ? (notes.find((n) => n.id === editNoteId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveNote(noteToSave);
    setIsFormOpen(false);
  };

  const handleCopyNote = (note: ResearchNote) => {
    const text = `${note.title}\n${note.referenceTitle ? `المرجع: ${note.referenceTitle} (ص ${note.pageNumber || ''})\n` : ''}\n${note.content}`;
    navigator.clipboard.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNotes = notes.filter((n) => {
    if (selectedRefFilter !== 'all' && n.referenceId !== selectedRefFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      const matchTags = n.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTags) return false;
    }
    return true;
  });

  return (
    <div id="notes-view" className="space-y-6 max-w-5xl mx-auto pb-16 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#7D2433] text-white flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">الملاحظات النقدية والبحثية</h1>
            <p className="text-xs text-[#6B7280]">
              تدوين استدراكات الباحث، المقارنات المنهجية، والملاحظات الميدانية
            </p>
          </div>
        </div>

        <button
          onClick={handleStartNew}
          className="px-4 py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>تدوين ملاحظة جديدة</span>
        </button>
      </div>

      {/* Note Form Drawer / Modal */}
      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-white border-2 border-[#7D2433]/30 rounded-2xl p-6 shadow-md space-y-4 animate-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-bold text-[#1F2937]">
              {editNoteId ? 'تعديل الملاحظة البحثية' : 'إضافة ملاحظة بحثية جديدة'}
            </h2>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">عنوان الملاحظة: <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مقارنة بين رواية ابن الأثير وآنا كومنينا حول حصار أنطاكية"
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">ربط بمرجع من المكتبة (اختياري):</label>
              <select
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
              >
                <option value="">ملاحظة عامة (غير مرتبطة بمرجع محدد)</option>
                {activeRefs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.authorFullName || r.authorFamilyName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">رقم الصفحة أو الجزء إن وجد:</label>
              <input
                type="text"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder="مثال: ص 142 أو جـ2، ص 80"
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">الوسوم والكلمات المفتاحية:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="أدخل الوسم ثم اضغط إضافة"
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 bg-[#F4F1EA] text-[#4A5568] px-2.5 py-0.5 rounded-full text-xs">
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)} className="text-gray-500 hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1 text-xs">
              نص الملاحظة والتحليل: <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="اكتب أفكارك وتحليلاتك ومقارناتك العلمية هنا بالتفصيل..."
              className="w-full p-3 border border-gray-300 rounded-lg text-xs md:text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#7D2433]"
              required
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
              حفظ الملاحظة
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
            placeholder="بحث في نصوص الملاحظات والوسوم..."
            className="w-full bg-transparent outline-none text-[#1F2937]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#6B7280]">حسب المرجع:</span>
          <select
            value={selectedRefFilter}
            onChange={(e) => setSelectedRefFilter(e.target.value)}
            className="p-1.5 bg-[#FAF9F5] border border-[#DDD6CA] rounded-lg outline-none text-xs"
          >
            <option value="all">جميع الملاحظات ({notes.length})</option>
            {activeRefs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-12 text-center text-[#6B7280] space-y-2">
          <FileText className="w-12 h-12 mx-auto text-[#CBD5E1]" />
          <p className="font-bold text-sm text-[#1F2937]">لا توجد ملاحظات مسجلة</p>
          <p className="text-xs">اضغط على زر "تدوين ملاحظة جديدة" لتوثيق أفكارك وملاحظاتك الميدانية.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => {
            const matchedRef = references.find((r) => r.id === note.referenceId);

            return (
              <div
                key={note.id}
                className="bg-white border border-[#E5E0D5] hover:border-[#7D2433]/40 rounded-2xl p-5 shadow-2xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-[#1F2937] leading-snug">
                      {note.title}
                    </h3>

                    {matchedRef && (
                      <div className="flex items-center gap-2 text-xs text-[#7D2433]">
                        <BookOpen className="w-3.5 h-3.5" />
                        <button
                          onClick={() => onSelectReference(matchedRef)}
                          className="hover:underline font-semibold text-right"
                        >
                          مرتبط بمرجع: {matchedRef.title}
                        </button>
                        {note.pageNumber && (
                          <span className="text-[#6B7280] bg-[#F4F1EA] px-2 py-0.5 rounded">
                            صـ {note.pageNumber}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopyNote(note)}
                      className="p-1.5 text-gray-400 hover:text-[#7D2433] hover:bg-[#FAF8F5] rounded-md transition-colors"
                      title="نسخ الملاحظة"
                    >
                      {copiedId === note.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleStartEdit(note)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-[#374151] leading-relaxed whitespace-pre-wrap font-citation bg-[#FAF9F6] p-3.5 rounded-xl border border-[#EFEBE4]">
                  {note.content}
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#8C827A] pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags?.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[#4A5568]">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <span>
                    آخر تحديث: {new Date(note.updatedAt || note.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
