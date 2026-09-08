import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  FileText, 
  Download, 
  Trash2, 
  Database, 
  Check, 
  RefreshCw, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Reference } from '../types';
import { dbService } from '../services/db';

interface StorageViewProps {
  references: Reference[];
  onRefreshReferences: () => void;
}

export const StorageView: React.FC<StorageViewProps> = ({
  references,
  onRefreshReferences
}) => {
  const [stats, setStats] = useState<{
    referenceCount: number;
    fileCount: number;
    totalSizeBytes: number;
    notesCount: number;
    citationsCount: number;
    usageBytes?: number;
    quotaBytes?: number;
  }>({
    referenceCount: 0,
    fileCount: 0,
    totalSizeBytes: 0,
    notesCount: 0,
    citationsCount: 0
  });

  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const s = await dbService.getStorageStats();
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [references]);

  const refsWithFiles = references.filter((r) => !r.inTrash && r.file);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadFile = async (ref: Reference) => {
    if (!ref.file?.id) return;
    const fileRecord = await dbService.getFile(ref.file.id);
    if (fileRecord?.blob) {
      const url = URL.createObjectURL(fileRecord.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ref.file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteFileOnly = async (ref: Reference) => {
    if (!confirm(`هل أنت متأكد من حذف الملف المرفق لكتاب "${ref.title}" مع الإبقاء على بيانات المرجع؟`)) {
      return;
    }
    if (ref.file?.id) {
      await dbService.deleteFile(ref.file.id);
    }
    const updated = { ...ref, file: undefined };
    await dbService.saveReference(updated, 'حذف الملف المرفق لتوفير مساحة التخزين');
    onRefreshReferences();
    loadStats();
  };

  const usagePercentage = stats.quotaBytes && stats.usageBytes
    ? Math.min(100, Math.round((stats.usageBytes / stats.quotaBytes) * 100))
    : null;

  return (
    <div id="storage-view" className="space-y-6 max-w-5xl mx-auto pb-16 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#7D2433] text-white flex items-center justify-center font-bold">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">إدارة التخزين والملفات المرفقة</h1>
            <p className="text-xs text-[#6B7280]">
              متابعة حجم المستندات وكتب الـ PDF المخزنة محلياً في قاعدة بيانات المتصفح
            </p>
          </div>
        </div>

        <button
          onClick={loadStats}
          className="p-2 bg-white border border-[#DDD6CA] hover:bg-[#F3EFE7] text-[#4B5563] rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث الحساب</span>
        </button>
      </div>

      {/* Storage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>إجمالي حجم الملفات المخزنة:</span>
            <Database className="w-4 h-4 text-[#7D2433]" />
          </div>
          <span className="text-2xl font-bold text-[#1F2937] block">
            {formatBytes(stats.totalSizeBytes)}
          </span>
          <p className="text-[11px] text-[#8C827A]">
            محفوظة في مخزن الملفات الثنائية (IndexedDB Blobs)
          </p>
        </div>

        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>عدد الكتب والمستندات المرفقة:</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-[#1F2937] block">
            {stats.fileCount} ملف PDF
          </span>
          <p className="text-[11px] text-[#8C827A]">
            من إجمالي {stats.referenceCount} مرجع مسجل في المكتبة
          </p>
        </div>

        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>حالة السعة المتوفرة بالمتصفح:</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#1F2937]">
              {stats.usageBytes ? formatBytes(stats.usageBytes) : 'قيد الفحص'}
            </span>
            {stats.quotaBytes && (
              <span className="text-xs text-[#6B7280]">
                من أصل {formatBytes(stats.quotaBytes)}
              </span>
            )}
          </div>
          {usagePercentage !== null && (
            <div className="w-full bg-[#E5E0D5] h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#7D2433] h-full rounded-full transition-all"
                style={{ width: `${Math.max(1, usagePercentage)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Safety Banner */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D5] rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h3 className="font-bold text-[#1F2937]">أمان البيانات والخصوصية التامة</h3>
          <p className="text-[#6B7280] leading-relaxed">
            جميع ملفات الـ PDF وبيانات مراجع أطروحتك العلمية يتم تخزينها بالكامل محلياً داخل بيئة المتصفح الخاصة بك (IndexedDB Sandbox). لا ترفع أي وثيقة إلى أي خادم خارجي، وتظل متاحة دائماً للقراءة بدون اتصال بالإنترنت.
          </p>
        </div>
      </div>

      {/* List of stored files */}
      <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#1F2937] border-b border-[#EFEBE4] pb-3">
          قائمة ملفات الكتب والوثائق المخزنة ({refsWithFiles.length})
        </h2>

        {refsWithFiles.length === 0 ? (
          <p className="text-xs text-[#9CA3AF] py-6 text-center">
            لا توجد ملفات PDF مرفوعة حالياً. يمكنك رفع الملفات أثناء إضافة أو تعديل أي مرجع.
          </p>
        ) : (
          <div className="space-y-3">
            {refsWithFiles.map((ref) => (
              <div
                key={ref.id}
                className="p-3.5 bg-[#FAF9F6] border border-[#EBE6DC] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs md:text-sm text-[#1F2937] font-citation">
                      {ref.title}
                    </h3>
                    <p className="text-[11px] text-[#6B7280]">
                      {ref.file?.name} • الحجم: {formatBytes(ref.file?.size || 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleDownloadFile(ref)}
                    className="px-3 py-1.5 bg-white hover:bg-[#F3EFE7] border border-[#DDD6CA] text-[#374151] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تنزيل</span>
                  </button>

                  <button
                    onClick={() => handleDeleteFileOnly(ref)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الملف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
