import React from 'react';
import { 
  LayoutDashboard, 
  Library, 
  PlusCircle, 
  Search, 
  FolderTree, 
  Star, 
  FileText, 
  Quote, 
  Trash2, 
  HardDrive, 
  History, 
  ArrowDownUp, 
  Settings,
  BookMarked,
  Sparkles
} from 'lucide-react';
import { ActiveTab } from '../types';

export interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  onTabChange?: (tab: ActiveTab) => void;
  stats?: {
    total?: number;
    favorites?: number;
    trash?: number;
    notes?: number;
    citations?: number;
  };
  totalReferences?: number;
  totalFavorites?: number;
  totalNotes?: number;
  totalCitations?: number;
  totalTrash?: number;
  thesisTitle?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onAddNewReference?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onTabChange,
  stats,
  totalReferences,
  totalFavorites,
  totalNotes,
  totalCitations,
  totalTrash,
  thesisTitle,
  isOpenMobile,
  onCloseMobile,
  onAddNewReference
}) => {
  const total = totalReferences ?? stats?.total ?? 0;
  const favorites = totalFavorites ?? stats?.favorites ?? 0;
  const notesCount = totalNotes ?? stats?.notes ?? 0;
  const citationsCount = totalCitations ?? stats?.citations ?? 0;
  const trashCount = totalTrash ?? stats?.trash ?? 0;

  const handleSelect = (id: ActiveTab) => {
    if (id === 'add_reference' && onAddNewReference) {
      onAddNewReference();
    } else {
      if (onTabChange) onTabChange(id);
      if (onSelectTab) onSelectTab(id);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'library', label: 'المكتبة الرئيسية', icon: <Library className="w-4 h-4" />, badge: total },
    { 
      id: 'master_catalogue', 
      label: 'فهرس الكتب الأبجدي الشامل', 
      icon: <BookMarked className="w-4 h-4 text-[#FCA5A5]" />, 
      badge: total,
      badgeColor: 'bg-[#8B2635]/80 text-[#FEE2E2] border border-[#8B2635]' 
    },
    { 
      id: 'evidence_search', 
      label: 'البحث والاستدلال في الكتب', 
      icon: <Sparkles className="w-4 h-4 text-amber-400" />
    },
    { id: 'add_reference', label: 'إضافة مرجع جديد', icon: <PlusCircle className="w-4 h-4 text-[#8b2635]" /> },
    { id: 'advanced_search', label: 'البحث المتقدم', icon: <Search className="w-4 h-4" /> },
    { id: 'categories', label: 'التصنيفات والموضوعات', icon: <FolderTree className="w-4 h-4" /> },
    { id: 'favorites', label: 'المراجع المفضلة', icon: <Star className="w-4 h-4" />, badge: favorites, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'notes', label: 'الملاحظات الأكاديمية', icon: <FileText className="w-4 h-4" />, badge: notesCount },
    { id: 'citations', label: 'مستودع الاقتباسات', icon: <Quote className="w-4 h-4" />, badge: citationsCount },
    { id: 'version_history', label: 'سجل الإصدارات', icon: <History className="w-4 h-4" /> },
    { id: 'storage', label: 'إدارة التخزين والملفات', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'import_export', label: 'الاستيراد والتصدير', icon: <ArrowDownUp className="w-4 h-4" /> },
    { id: 'trash', label: 'سلة المحذوفات', icon: <Trash2 className="w-4 h-4" />, badge: trashCount > 0 ? trashCount : undefined, badgeColor: 'bg-red-100 text-red-800' },
    { id: 'settings', label: 'الإعدادات وقواعد الترتيب', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="app-sidebar"
        className={`w-72 bg-[#1B242C] text-[#E5E9EC] flex flex-col h-screen border-l border-[#2E3B46] shrink-0 select-none z-50 transition-all duration-300 ${
          isOpenMobile 
            ? 'fixed inset-y-0 right-0 shadow-2xl flex translate-x-0' 
            : 'hidden md:flex'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#2E3B46]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B2635] to-[#591621] flex items-center justify-center text-white shadow-md">
              <BookMarked className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg text-white tracking-wide">مكتبة هريرة</h1>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-[#8B2635]/40 text-[#FCA5A5] px-1.5 py-0.5 rounded border border-[#8B2635]/60">
                  أكاديمي
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] truncate">مكتبتي الأكاديمية للأطروحات</p>
            </div>
          </div>

          {/* Close button on mobile */}
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2E3B46]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Thesis Focus Banner */}
        {thesisTitle && (
          <div className="mx-3 mt-3 p-2.5 bg-[#232F3A] rounded-md border border-[#334454] text-xs">
            <div className="text-[11px] font-medium text-[#93C5FD] flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>مشروع الأطروحة الحالي:</span>
            </div>
            <p className="text-gray-300 font-citation line-clamp-2 text-xs leading-relaxed" title={thesisTitle}>
              «{thesisTitle}»
            </p>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-150 text-right cursor-pointer ${
                  isActive
                    ? 'bg-[#8B2635] text-white shadow-sm'
                    : 'text-[#C5D0D9] hover:bg-[#273542] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-[#8FA0AF]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-[#2E3D4C] text-[#9FB0C0]')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-3 border-t border-[#2E3B46] text-[11px] text-[#7E8F9F] flex items-center justify-between bg-[#151D24]">
          <span>إصدار الرسائل الأكاديمي v2.4</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            قاعدة آمنة محلياً
          </span>
        </div>
      </aside>
    </>
  );
};
