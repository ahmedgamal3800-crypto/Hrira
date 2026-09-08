import React from 'react';
import { Trash2, RotateCcw, AlertTriangle, BookOpen } from 'lucide-react';
import { Reference } from '../types';

interface TrashViewProps {
  references: Reference[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
  references,
  onRestore,
  onPermanentDelete,
  onEmptyTrash
}) => {
  const trashRefs = references.filter((r) => r.inTrash);

  return (
    <div id="trash-view" className="space-y-6 max-w-5xl mx-auto pb-16 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">سلة المحذوفات</h1>
            <p className="text-xs text-[#6B7280]">
              المراجع المحذوفة مؤقتاً، يمكنك استعادتها أو حذفها نهائياً
            </p>
          </div>
        </div>

        {trashRefs.length > 0 && (
          <button
            onClick={() => {
              if (confirm('هل أنت متأكد من تفريغ سلة المحذوفات نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.')) {
                onEmptyTrash();
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>تفريغ السلة نهائياً</span>
          </button>
        )}
      </div>

      {trashRefs.length === 0 ? (
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-12 text-center text-[#6B7280] space-y-2">
          <Trash2 className="w-12 h-12 mx-auto text-[#CBD5E1]" />
          <p className="font-bold text-sm text-[#1F2937]">سلة المحذوفات فارغة تماماً</p>
          <p className="text-xs">المراجع المحذوفة ستظهر هنا بحيث يمكنك استرجاعها في أي وقت دون خوف من فقدان بياناتك.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trashRefs.map((ref) => (
            <div
              key={ref.id}
              className="bg-white border border-[#E5E0D5] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded bg-[#F4F1EA] text-[#554E45] font-bold text-xs flex items-center justify-center font-citation">
                    {ref.alphabetKey}
                  </span>
                  <h3 className="font-bold text-sm text-[#111827] font-citation">
                    {ref.title}
                  </h3>
                </div>
                <p className="text-xs text-[#6B7280]">
                  المؤلف: {ref.authorFullName || ref.authorFamilyName} • {ref.referenceType.split('(')[0]}
                </p>
                <p className="text-[11px] text-[#8C827A] italic font-citation truncate max-w-xl">
                  {ref.fullCitation}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onRestore(ref.id)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة للمكتبة</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`هل أنت متأكد من حذف المرجع "${ref.title}" نهائياً من قاعدة البيانات؟`)) {
                      onPermanentDelete(ref.id);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف نهائي</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
