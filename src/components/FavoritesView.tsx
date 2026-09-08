import React from 'react';
import { Star, BookOpen } from 'lucide-react';
import { Reference, ViewMode } from '../types';
import { ReferenceCard } from './ReferenceCard';

interface FavoritesViewProps {
  references: Reference[];
  onSelectReference: (ref: Reference) => void;
  onEditReference: (ref: Reference) => void;
  onReadReference: (ref: Reference) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteReference: (id: string) => void;
  onDownloadFile?: (ref: Reference) => void;
  onAttachBook?: (ref: Reference, file: File) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  references,
  onSelectReference,
  onEditReference,
  onReadReference,
  onToggleFavorite,
  onDeleteReference,
  onDownloadFile,
  onAttachBook
}) => {
  const favoriteRefs = references.filter((r) => !r.inTrash && r.isFavorite);

  return (
    <div id="favorites-view" className="space-y-6 max-w-6xl mx-auto pb-16 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">المراجع المفضلة والأساسية</h1>
            <p className="text-xs text-[#6B7280]">
              المصادر ذات الأولوية القصوى لأطروحة الماجستير والدكتوراه
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-white border border-[#DDD6CA] rounded-full text-[#374151]">
          {favoriteRefs.length} مرجع مفضل
        </span>
      </div>

      {favoriteRefs.length === 0 ? (
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-12 text-center text-[#6B7280] space-y-2">
          <Star className="w-12 h-12 mx-auto text-[#CBD5E1]" />
          <h3 className="font-bold text-sm text-[#1F2937]">لا توجد مراجع في المفضلة حالياً</h3>
          <p className="text-xs max-w-sm mx-auto">
            اضغط على علامة النجمة في أي بطاقة مرجع لتمييزه وإدراجه في قائمة المراجع المفضلة للوصول السريع.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteRefs.map((ref) => (
            <ReferenceCard
              key={ref.id}
              reference={ref}
              viewMode="grid"
              onSelect={onSelectReference}
              onEdit={onEditReference}
              onRead={onReadReference}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDeleteReference}
              onDownloadFile={onDownloadFile}
              onAttachBook={onAttachBook}
            />
          ))}
        </div>
      )}
    </div>
  );
};
