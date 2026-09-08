import React, { useState, useEffect } from 'react';
import { 
  History, 
  X, 
  RotateCcw, 
  Check, 
  Calendar, 
  ArrowLeft,
  FileText 
} from 'lucide-react';
import { Reference, ReferenceVersion } from '../types';
import { dbService } from '../services/db';

interface VersionHistoryModalProps {
  reference: Reference | null;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (snapshot: Reference) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  reference,
  isOpen,
  onClose,
  onRestoreVersion
}) => {
  const [versions, setVersions] = useState<ReferenceVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ReferenceVersion | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      if (reference?.id) {
        setLoading(true);
        const list = await dbService.getVersions(reference.id);
        setVersions(list);
        setSelectedVersion(list[0] || null);
        setLoading(false);
      }
    }

    if (isOpen && reference) {
      loadHistory();
    }
  }, [reference, isOpen]);

  if (!isOpen || !reference) return null;

  const handleRestore = (snapshot: Reference) => {
    if (confirm(`هل أنت متأكد من استعادة هذه النسخة المؤرخة بتاريخ ${new Date(snapshot.lastModified || snapshot.dateAdded).toLocaleString('ar-EG')}؟`)) {
      onRestoreVersion(snapshot);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-[#E5E0D5] overflow-hidden text-right animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DDD3] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7D2433] text-white flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">سجل تعديلات المرجع (Version History)</h2>
              <p className="text-xs text-[#6B7280] truncate max-w-md font-citation">
                {reference.title}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#E5E0D5]">
          {/* Versions list */}
          <div className="p-4 overflow-y-auto space-y-2 max-h-[60vh] md:max-h-full">
            <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">
              النسخ المسجلة ({versions.length})
            </h3>

            {loading ? (
              <p className="text-xs text-[#8C827A] py-4 text-center">جاري تحميل السجل...</p>
            ) : versions.length === 0 ? (
              <p className="text-xs text-[#8C827A] py-4 text-center">لا توجد تعديلات مسجلة بعد لهذا المرجع.</p>
            ) : (
              versions.map((ver) => {
                const isSelected = selectedVersion?.id === ver.id;
                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#F9ECEF] border-[#7D2433] text-[#7D2433] font-semibold'
                        : 'bg-white border-[#E2DDD3] hover:bg-[#FAF8F5] text-[#374151]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">تعديل #{ver.id.slice(-4)}</span>
                      <span className="text-[10px] text-[#8C827A]">
                        {new Date(ver.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {ver.changeReason || 'تعديل بيانات'}
                    </p>
                    <span className="text-[10px] text-[#8C827A] block mt-1">
                      {new Date(ver.timestamp).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Version details & Comparison */}
          <div className="md:col-span-2 p-6 overflow-y-auto max-h-[60vh] md:max-h-full space-y-4">
            {selectedVersion ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#1F2937]">تفاصيل النسخة المحددة</h3>
                    <p className="text-xs text-[#6B7280]">
                      تم الحفظ في: {new Date(selectedVersion.timestamp).toLocaleString('ar-EG')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRestore(selectedVersion.snapshot)}
                    className="px-3.5 py-1.5 bg-[#7D2433] hover:bg-[#681E2A] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة هذه النسخة</span>
                  </button>
                </div>

                {/* Changes fields */}
                <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E5E0D5] space-y-1.5">
                  <span className="font-bold text-[#374151] block">سبب التعديل المسجل:</span>
                  <p className="text-[#6B7280]">{selectedVersion.changeReason || 'تحديث دوري لبيانات المرجع'}</p>
                </div>

                {/* Snapshot preview */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-[#1F2937]">بيانات المرجع في هذه النسخة:</h4>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-white border border-[#E5E0D5] rounded-xl text-[11px]">
                    <div>
                      <span className="text-[#8C827A] block">العنوان:</span>
                      <strong className="text-[#1F2937] font-citation">{selectedVersion.snapshot.title}</strong>
                    </div>
                    <div>
                      <span className="text-[#8C827A] block">المؤلف:</span>
                      <strong className="text-[#1F2937]">{selectedVersion.snapshot.authorFullName || selectedVersion.snapshot.authorFamilyName}</strong>
                    </div>
                    <div>
                      <span className="text-[#8C827A] block">سنة النشر:</span>
                      <span className="text-[#1F2937]">{selectedVersion.snapshot.publicationYear || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[#8C827A] block">دار النشر:</span>
                      <span className="text-[#1F2937]">{selectedVersion.snapshot.publisher || '—'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#8C827A] block text-xs mb-1">صيغة التوثيق الكاملة في تلك النسخة:</span>
                    <div className="p-3 bg-[#FAF8F5] border border-[#DDD6CA] rounded-xl font-citation text-xs leading-relaxed text-[#1F2937]">
                      {selectedVersion.snapshot.fullCitation}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#9CA3AF] text-xs">
                اختر نسخة من القائمة الجانبية لمعاينة تفاصيلها ومقارنتها.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2DDD3] bg-[#FAF8F5] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
