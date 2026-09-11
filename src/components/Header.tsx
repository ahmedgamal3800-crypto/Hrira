import React from 'react';
import { 
  Search, 
  Plus, 
  BookOpen, 
  GraduationCap, 
  Menu
} from 'lucide-react';
import { ActiveTab, AppSettings } from '../types';

export interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  settings?: AppSettings;
  onToggleMobileSidebar?: () => void;
  onQuickAdd?: () => void;
  onOpenAddModal?: () => void;
  onOpenReader?: () => void;
  totalReferences?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  settings,
  onToggleMobileSidebar,
  onQuickAdd,
  onOpenAddModal,
  onOpenReader,
  totalReferences
}) => {
  const handleAdd = onQuickAdd || onOpenAddModal || (() => {});
  const researcherName = settings?.researcherName || 'الباحث الأكاديمي';
  const thesisTitle = settings?.thesisTitle || 'مشروع الأطروحة الأكاديمية';

  return (
    <header id="app-header" className="bg-[#FAF9F5] border-b border-[#E2DDD3] px-4 md:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left side: Mobile Hamburger & Search input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg bg-white border border-[#DDD6CA] text-[#4A5568]"
          title="فتح القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A]" />
          <input
            id="global-header-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (onSelectTab && activeTab !== 'library' && activeTab !== 'advanced_search') {
                onSelectTab('library');
              }
            }}
            placeholder="بحث موحد: باسم الكتاب، أو اسم المؤلف، أو اسم الجد / العائلة، أو نص التوثيق..."
            className="w-full pl-3 pr-9 py-2 bg-white border border-[#DDD6CA] rounded-lg text-xs md:text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7D2433] focus:border-transparent transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] hover:text-[#4B5563] bg-[#F3F0E9] w-4 h-4 rounded-full flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right side: Researcher Info & Add Reference Button */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="hidden lg:flex flex-col items-end pl-2 border-l border-[#E2DDD3]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F2937]">
            <GraduationCap className="w-3.5 h-3.5 text-[#7D2433]" />
            <span>{researcherName}</span>
          </div>
          <span className="text-[11px] text-[#555E68] font-medium truncate max-w-[280px] xl:max-w-[380px]" title={thesisTitle}>
            «{thesisTitle}»
          </span>
        </div>

        <button
          id="btn-quick-add-reference"
          onClick={handleAdd}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#7D2433] hover:bg-[#681E2A] text-white text-xs md:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">إضافة مرجع جديد</span>
          <span className="sm:hidden">إضافة</span>
        </button>

        <button
          onClick={() => {
            if (onOpenReader) {
              onOpenReader();
            } else if (onSelectTab) {
              onSelectTab('library');
            }
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F3EFE7] border border-[#DDD6CA] text-[#4B5563] text-xs font-medium rounded-lg transition-colors cursor-pointer"
          title="فتح قارئ الوثائق المدمج"
        >
          <BookOpen className="w-4 h-4 text-[#7D2433]" />
          <span>القارئ</span>
        </button>
      </div>
    </header>
  );
};
