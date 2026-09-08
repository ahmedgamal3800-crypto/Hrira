import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  BookOpen, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Layers
} from 'lucide-react';
import { CategoryItem, Reference } from '../types';
import { ReferenceCard } from './ReferenceCard';

interface CategoriesViewProps {
  categories: CategoryItem[];
  references: Reference[];
  onSaveCategory: (cat: CategoryItem) => void;
  onDeleteCategory: (id: string) => void;
  onSelectReference: (ref: Reference) => void;
  onEditReference: (ref: Reference) => void;
  onReadReference: (ref: Reference) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteReference: (id: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  references,
  onSaveCategory,
  onDeleteCategory,
  onSelectReference,
  onEditReference,
  onReadReference,
  onToggleFavorite,
  onDeleteReference
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('#7D2433');

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const refsInActiveCategory = references.filter(
    (r) => !r.inTrash && r.categoryIds?.includes(activeCategoryId)
  );

  const handleStartNew = () => {
    setEditCatId(null);
    setCatName('');
    setCatDesc('');
    setCatColor('#7D2433');
    setIsEditing(true);
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setEditCatId(cat.id);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatColor(cat.color || '#7D2433');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const newCategory: CategoryItem = {
      id: editCatId || 'cat-' + Date.now(),
      name: catName.trim(),
      description: catDesc.trim(),
      color: catColor
    };

    onSaveCategory(newCategory);
    setIsEditing(false);
    setActiveCategoryId(newCategory.id);
  };

  const colors = ['#7D2433', '#1E3A8A', '#14532D', '#78350F', '#581C87', '#0F766E', '#C2410C', '#4338CA'];

  return (
    <div id="categories-view" className="space-y-6 max-w-6xl mx-auto pb-16 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-[#7D2433]" />
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">التصنيفات والموضوعات الأكاديمية</h1>
            <p className="text-xs text-[#6B7280]">تنظيم المراجع وفق فصول وأبواب الأطروحة</p>
          </div>
        </div>

        <button
          onClick={handleStartNew}
          className="px-3 py-1.5 bg-[#7D2433] hover:bg-[#681E2A] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تصنيف جديد</span>
        </button>
      </div>

      {/* Edit / New Category Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-white border-2 border-[#7D2433]/30 rounded-2xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold text-[#1F2937]">
              {editCatId ? 'تعديل التصنيف' : 'إنشاء تصنيف أكاديمي جديد'}
            </h2>
            <button type="button" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">اسم التصنيف أو الموضوع:</label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="مثال: المصادر الأولية للحروب الصليبية"
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#7D2433]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">لون الوسم التمييزي:</label>
              <div className="flex items-center gap-2 pt-1">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCatColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${catColor === c ? 'scale-125 border-gray-900 ring-2 ring-gray-400' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">وصف التصنيف وعلاقته بمحاور البحث:</label>
            <textarea
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              rows={2}
              placeholder="شرح موجز لنوعية المراجع المندرجة تحت هذا الباب..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#7D2433]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-[#7D2433] hover:bg-[#681E2A] text-white rounded-lg text-xs font-bold"
            >
              حفظ التصنيف
            </button>
          </div>
        </form>
      )}

      {/* Categories Tabs & Selector */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const count = references.filter((r) => !r.inTrash && r.categoryIds?.includes(cat.id)).length;
          const isActive = activeCategoryId === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer shadow-2xs ${
                isActive
                  ? 'bg-white border-[#7D2433] text-[#7D2433] ring-2 ring-[#7D2433]/20 shadow-xs'
                  : 'bg-white/80 border-[#E2DDD3] text-[#4B5563] hover:bg-white'
              }`}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <div>
                <span className="font-bold text-xs md:text-sm block">{cat.name}</span>
                <span className="text-[10px] text-[#8C827A]">{count} مرجع</span>
              </div>

              {isActive && (
                <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-1 hover:text-blue-600 rounded"
                    title="تعديل"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  {categories.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف تصنيف "${cat.name}"؟ لن يتم حذف المراجع نفسها.`)) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className="p-1 hover:text-red-600 rounded"
                      title="حذف"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Category Description Header */}
      {activeCategory && (
        <div className="bg-[#FAF9F5] border border-[#E5E0D5] rounded-xl p-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-[#1F2937] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeCategory.color }} />
              <span>{activeCategory.name}</span>
            </h2>
            {activeCategory.description && (
              <p className="text-xs text-[#6B7280] mt-1">{activeCategory.description}</p>
            )}
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-white border border-[#DDD6CA] rounded-full text-[#374151]">
            {refsInActiveCategory.length} مرجع مسجل
          </span>
        </div>
      )}

      {/* References inside active category */}
      {refsInActiveCategory.length === 0 ? (
        <div className="bg-white border border-[#E5E0D5] rounded-2xl p-12 text-center text-[#6B7280] space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-[#9CA3AF]" />
          <p className="font-semibold text-sm text-[#1F2937]">لا توجد مراجع مسجلة تحت هذا التصنيف بعد</p>
          <p className="text-xs">قم بتعديل المراجع وإدراجها ضمن هذا التصنيف لتظهر هنا بشكل منظم.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {refsInActiveCategory.map((ref) => (
            <ReferenceCard
              key={ref.id}
              reference={ref}
              viewMode="grid"
              onSelect={onSelectReference}
              onEdit={onEditReference}
              onRead={onReadReference}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDeleteReference}
            />
          ))}
        </div>
      )}
    </div>
  );
};
