import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  Copy, 
  Check, 
  BookOpen, 
  Printer, 
  FileSpreadsheet, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Reference, CategoryItem, CitationQuote, ResearchNote } from '../types';
import { 
  exportToJson, 
  importFromJson, 
  exportToBibTeX, 
  exportToRis, 
  generateThesisBibliographyText 
} from '../services/exportImport';

interface ImportExportViewProps {
  references: Reference[];
  categories: CategoryItem[];
  quotes: CitationQuote[];
  notes: ResearchNote[];
  onImportComplete: () => void;
}

export const ImportExportView: React.FC<ImportExportViewProps> = ({
  references,
  categories,
  quotes,
  notes,
  onImportComplete
}) => {
  const [copiedBib, setCopiedBib] = useState(false);
  const [separateLang, setSeparateLang] = useState(true);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const activeRefs = references.filter((r) => !r.inTrash);

  // Generate complete thesis bibliography formatted text
  const bibliographyText = useMemo(() => {
    return generateThesisBibliographyText(activeRefs, separateLang);
  }, [activeRefs, separateLang]);

  const handleCopyBibliography = () => {
    navigator.clipboard.writeText(bibliographyText);
    setCopiedBib(true);
    setTimeout(() => setCopiedBib(false), 2000);
  };

  const handleExportBibTeX = () => {
    const content = exportToBibTeX(activeRefs);
    downloadFile(content, 'hurairah-library-references.bib', 'text/plain');
  };

  const handleExportRIS = () => {
    const content = exportToRis(activeRefs);
    downloadFile(content, 'hurairah-library-references.ris', 'text/plain');
  };

  const handleExportFullJson = () => {
    const jsonStr = exportToJson(activeRefs, categories, notes, quotes);
    downloadFile(jsonStr, `hurairah-library-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('جاري استيراد البيانات...');
      const text = await file.text();
      const res = await importFromJson(text);
      setImportStatus(`تم استيراد ${res.referencesCount} مرجعاً بنجاح!`);
      onImportComplete();
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      setImportStatus('حدث خطأ أثناء فحص ملف النسخة الاحتياطية: ' + err.message);
    }
  };

  return (
    <div id="import-export-view" className="space-y-6 max-w-5xl mx-auto pb-16 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#7D2433] text-white flex items-center justify-center font-bold">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">الاستيراد، التصدير، وقائمة مراجع الرسالة</h1>
            <p className="text-xs text-[#6B7280]">
              توليد قائمة المصادر والمراجع للأطروحة وتصدير واستيراد البيانات بصيغ علمية قياسية
            </p>
          </div>
        </div>
      </div>

      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Full Backup */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[#1F2937] flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#7D2433]" />
              <span>نسخة احتياطية كاملة (JSON)</span>
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              تصدير كافة المراجع، التصنيفات، الاقتباسات، والملاحظات في ملف واحد متكامل.
            </p>
          </div>
          <button
            onClick={handleExportFullJson}
            className="w-full py-2 bg-[#FAF8F5] hover:bg-[#7D2433] text-[#374151] hover:text-white border border-[#DDD6CA] rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            تنزيل النسخة الاحتياطية (.json)
          </button>
        </div>

        {/* BibTeX */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[#1F2937] flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-blue-700" />
              <span>تصدير بصيغة BibTeX (.bib)</span>
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              جاهز للاستيراد المباشر في LaTeX وOverleaf والبرمجيات الأكاديمية.
            </p>
          </div>
          <button
            onClick={handleExportBibTeX}
            className="w-full py-2 bg-[#FAF8F5] hover:bg-blue-700 text-[#374151] hover:text-white border border-[#DDD6CA] rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            تصدير ملف BibTeX (.bib)
          </button>
        </div>

        {/* RIS */}
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[#1F2937] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>تصدير بصيغة RIS (.ris)</span>
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              متوافق مع Zotero، EndNote، وMendeley لتبادل المراجع بسهولة.
            </p>
          </div>
          <button
            onClick={handleExportRIS}
            className="w-full py-2 bg-[#FAF8F5] hover:bg-emerald-700 text-[#374151] hover:text-white border border-[#DDD6CA] rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            تصدير ملف RIS (.ris)
          </button>
        </div>
      </div>

      {/* Import Backup Section */}
      <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#7D2433]" />
          <span>استعادة أو استيراد مكتبة من ملف JSON:</span>
        </h2>

        <div className="p-4 border-2 border-dashed border-[#DCD5C9] rounded-xl text-center space-y-2 bg-[#FAF8F5]">
          <Upload className="w-8 h-8 mx-auto text-[#8C827A]" />
          <p className="text-xs font-semibold text-[#374151]">
            اختر ملف النسخة الاحتياطية (.json) لاستعادة مراجعك
          </p>
          <label className="inline-block px-4 py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors">
            استعراض الملف
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
          {importStatus && (
            <p className="text-xs text-[#7D2433] font-bold mt-2">{importStatus}</p>
          )}
        </div>
      </div>

      {/* Complete Thesis Bibliography Section */}
      <div className="bg-white border border-[#E5E0D5] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#EFEBE4] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>قائمة المصادر والمراجع النهائية لرسالة الماجستير / الدكتوراه</span>
            </h2>
            <p className="text-xs text-[#6B7280]">
              مرتبة أبجدياً بدقة حسب اسم المؤلف مع صيانة النص الحرفي للتوثيق
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[#374151] flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={separateLang}
                onChange={(e) => setSeparateLang(e.target.checked)}
                className="rounded text-[#7D2433]"
              />
              <span>فصل المراجع العربية عن الأجنبية</span>
            </label>

            <button
              onClick={handleCopyBibliography}
              className="px-3.5 py-1.5 bg-[#7D2433] hover:bg-[#681E2A] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              {copiedBib ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedBib ? 'تم النسخ بنجاح!' : 'نسخ القائمة كاملة إلى Word'}</span>
            </button>
          </div>
        </div>

        {/* Formatted Text Box */}
        <div className="p-4 bg-[#FAF9F6] border border-[#E2DDD3] rounded-xl font-citation text-xs md:text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto text-[#1E252B]">
          {bibliographyText}
        </div>

        <p className="text-[11px] text-[#8C827A]">
          * يمكنك نسخ النص أعلاه ولصقه مباشرة في ملف رسالتك ببرنامج Word أو LibreOffice؛ حيث تتضمن القائمة فهارس الأبجدية وتوثيقات كل مرجع كاملة.
        </p>
      </div>
    </div>
  );
};
