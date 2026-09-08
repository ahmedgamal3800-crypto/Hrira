import React, { useState, useEffect } from 'react';
import { 
  History, 
  RotateCcw, 
  BookOpen, 
  User, 
  Calendar, 
  Clock, 
  Search,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Reference, ReferenceVersion } from '../types';
import { dbService } from '../services/db';

interface VersionHistoryViewProps {
  references: Reference[];
  onOpenVersionHistory: (ref: Reference) => void;
  onRestoreSnapshot: (snapshot: Reference) => void;
}

export const VersionHistoryView: React.FC<VersionHistoryViewProps> = ({
  references,
  onOpenVersionHistory,
  onRestoreSnapshot
}) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVersionCounts() {
      setLoading(true);
      const countsMap: Record<string, number> = {};
      for (const ref of references) {
        if (!ref.inTrash) {
          const versions = await dbService.getVersions(ref.id);
          countsMap[ref.id] = versions.length;
        }
      }
      setCounts(countsMap);
      setLoading(false);
    }
    loadVersionCounts();
  }, [references]);

  const activeReferences = (references || []).filter((r) => !r.inTrash);
  const filtered = activeReferences.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const authorName = (r.authorFullName || r.authorFamilyName || r.authorFirstName || '').toLowerCase();
    const title = (r.title || '').toLowerCase();
    const citation = (r.fullCitation || '').toLowerCase();
    return (
      title.includes(q) ||
      authorName.includes(q) ||
      citation.includes(q)
    );
  });

  return (
    <div id="version-history-view" className="space-y-6 max-w-5xl mx-auto pb-16 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#7D2433] text-white flex items-center justify-center font-bold shadow-xs">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">سجل التعديلات والإصدارات التاريخية</h1>
            <p className="text-xs text-[#6B7280]">
              نظام حفظ النسخ الاحتياطية وتتبع التغييرات على بطاقات المراجع مع إمكانية استعادة أي نسخة سابقة
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="تصفية حسب العنوان أو المؤلف..."
            className="w-full pl-3 pr-9 py-1.5 text-xs bg-white border border-[#DDD6CA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7D2433]"
          />
        </div>
      </div>

      {/* Overview Info Banner */}
      <div className="bg-[#FAF9F5] border border-[#E2DDD3] p-4 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-[#4A5568] space-y-1 leading-relaxed">
          <span className="font-bold text-[#1F2937]">حماية بيانات البحث الأكاديمي: </span>
          يتم تسجيل لقطة (Snapshot) تلقائية لكل مرجع عند تعديل بياناته أو إضافة ملفات جديدة، مما يتيح لك الرجوع لأي صياغة سابقة للاقتباسات أو العناوين دون فقدان أي عمل علمي.
        </div>
      </div>

      {/* References List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E8E3DA] text-[#6B7280]">
            <History className="w-10 h-10 mx-auto mb-3 text-[#B0A695] opacity-60" />
            <p className="text-sm font-semibold text-[#374151]">لم يتم العثور على مراجع مطابقة</p>
            <p className="text-xs text-[#9CA3AF] mt-1">تأكد من كتابة اسم المرجع أو أضف مراجع جديدة للمكتبة</p>
          </div>
        ) : (
          filtered.map((ref) => {
            const versionCount = counts[ref.id] ?? 0;
            return (
              <div
                key={ref.id}
                className="bg-white p-4 rounded-xl border border-[#E5E0D5] hover:border-[#D1C9BC] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3EFE7] text-[#5C4D3C] font-medium">
                      {ref.referenceType || 'مرجع'}
                    </span>
                    {versionCount > 0 ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                        <History className="w-3 h-3" />
                        {versionCount} {versionCount === 1 ? 'نسخة محفوظة' : 'نسخ محفوظة'}
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        النسخة الأساسية الأولى
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#1F2937] truncate" title={ref.title}>
                    {ref.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-[#6B7280] mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#8C827A]" />
                      {ref.authorFullName || ref.authorFamilyName || 'مؤلف غير محدد'}
                    </span>
                    {ref.publicationYear && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#8C827A]" />
                        {ref.publicationYear}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[#8C827A]">
                      <Clock className="w-3.5 h-3.5" />
                      آخر تحديث: {new Date(ref.lastModified || ref.dateAdded).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenVersionHistory(ref)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF9F5] hover:bg-[#F3EFE7] text-[#7D2433] border border-[#DDD6CA] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>سجل النسخ والاستعادة</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
