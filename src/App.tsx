import React, { useState, useEffect, useCallback } from 'react';
import { 
  Reference, 
  CategoryItem, 
  ResearchNote, 
  CitationQuote, 
  AppSettings, 
  ActiveTab, 
  ViewMode, 
  SortRule,
  ReferenceFile,
  ToolMemoryState
} from './types';
import { dbService, DEFAULT_SETTINGS } from './services/db';
import { extractMetadataFromBookFile, mergeBookMetadataWithReference } from './services/bookMetadataExtractor';
import { checkReferenceDuplicate } from './services/duplicateDetector';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { LibraryView } from './components/LibraryView';
import { MasterCatalogueView } from './components/MasterCatalogueView';
import { AdvancedSearchView } from './components/AdvancedSearchView';
import { CategoriesView } from './components/CategoriesView';
import { FavoritesView } from './components/FavoritesView';
import { NotesView } from './components/NotesView';
import { CitationsView } from './components/CitationsView';
import { TrashView } from './components/TrashView';
import { StorageView } from './components/StorageView';
import { ImportExportView } from './components/ImportExportView';
import { SettingsView } from './components/SettingsView';
import { VersionHistoryView } from './components/VersionHistoryView';
import { ReferenceDetailsView } from './components/ReferenceDetailsView';
import { ReferenceFormModal } from './components/ReferenceFormModal';
import { PdfReaderModal } from './components/PdfReaderModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { EvidenceSearchView } from './components/EvidenceSearchView';

export default function App() {
  // Navigation & View states
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [evidenceTargetReference, setEvidenceTargetReference] = useState<Reference | null>(null);

  // Data states
  const [references, setReferences] = useState<Reference[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [citations, setCitations] = useState<CitationQuote[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [toolMemory, setToolMemory] = useState<ToolMemoryState | null>(null);

  // Modal states
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [readingReference, setReadingReference] = useState<Reference | null>(null);
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
  const [historyReference, setHistoryReference] = useState<Reference | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Initial Data Fetch
  const refreshAllData = useCallback(async () => {
    const [allRefs, allCats, allNotes, allQuotes, appSettings, mem] = await Promise.all([
      dbService.getAllReferences(),
      dbService.getCategories(),
      dbService.getNotes(),
      dbService.getCitations(),
      dbService.getSettings(),
      dbService.getToolMemory()
    ]);

    setReferences(allRefs);
    setCategories(allCats);
    setNotes(allNotes);
    setCitations(allQuotes);
    setSettings(appSettings);
    setToolMemory(mem);
    setViewMode(appSettings.defaultViewMode || 'grid');
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handler: User-requested memory & master catalogue refresh
  const handleRefreshToolMemory = async (): Promise<ToolMemoryState> => {
    const updatedMem = await dbService.rebuildToolMemory(true);
    setToolMemory(updatedMem);
    await refreshAllData();
    return updatedMem;
  };

  // Handler: Save Reference (Create or Update with optional Attached File)
  const handleSaveReference = async (ref: Reference, fileBlob?: Blob, reason?: string) => {
    // Duplicate safety guard
    const dupCheck = checkReferenceDuplicate(ref, references, editingReference?.id || ref.id);
    if (dupCheck.isDuplicate && !editingReference) {
      alert(`خطأ: لا يمكن إضافة هذا المرجع لأنه مسجل مسبقاً في مكتبتك!\n\n${dupCheck.detailsMessage}`);
      return;
    }

    // 1. If file attached, save to file store
    let updatedRef = { ...ref };
    if (fileBlob && ref.file) {
      await dbService.saveFile(ref.file.id, fileBlob, ref.file.name, ref.file.type);
    }

    // 2. Save Reference and version log
    await dbService.saveReference(updatedRef, reason || 'تحديث بيانات المرجع');

    // 3. Refresh data
    await refreshAllData();
    setIsFormModalOpen(false);
    setEditingReference(null);

    // If currently viewing this reference in details view, update it
    if (selectedReference?.id === ref.id) {
      setSelectedReference(updatedRef);
    }
  };

  // Handler: Soft Delete (Move to Trash)
  const handleDeleteReference = async (id: string) => {
    await dbService.softDeleteReference(id);
    await refreshAllData();
    if (selectedReference?.id === id) {
      setSelectedReference(null);
    }
  };

  // Handler: Restore from Trash
  const handleRestoreReference = async (id: string) => {
    await dbService.restoreReference(id);
    await refreshAllData();
  };

  // Handler: Permanent Delete
  const handlePermanentDelete = async (id: string) => {
    await dbService.permanentDeleteReference(id);
    await refreshAllData();
  };

  // Handler: Empty Trash
  const handleEmptyTrash = async () => {
    await dbService.emptyTrash();
    await refreshAllData();
  };

  // Handler: Toggle Favorite
  const handleToggleFavorite = async (id: string) => {
    await dbService.toggleFavorite(id);
    await refreshAllData();
    if (selectedReference?.id === id) {
      setSelectedReference((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  // Handler: Attach Book to Reference and auto-fill missing fields
  const handleAttachBookToRef = async (ref: Reference, file: File) => {
    try {
      const extracted = await extractMetadataFromBookFile(file);
      const fileId = 'file-' + Date.now();
      const refFile: ReferenceFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        pageCount: extracted.pageCount,
        uploadDate: new Date().toISOString()
      };

      const { updatedRef, filledFields } = mergeBookMetadataWithReference(ref, extracted, refFile);
      await dbService.saveFile(fileId, file, file.name, file.type || 'application/pdf');

      const reason = filledFields.length > 0
        ? `تحديث تلقائي للمرجع وملء (${filledFields.map(f => f.label).join('، ')}) من الكتاب: ${file.name}`
        : `إرفاق كتاب بالمرجع: ${file.name}`;

      await dbService.saveReference(updatedRef, reason);
      await refreshAllData();

      if (selectedReference?.id === ref.id) {
        setSelectedReference(updatedRef);
      }
    } catch (err) {
      console.error('Failed to attach book to reference', err);
    }
  };

  // Handler: Download File
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

  // Handler: Open PDF Reader
  const handleOpenReader = (ref: Reference) => {
    setReadingReference(ref);
    setIsReaderModalOpen(true);
  };

  // Handler: Open Version History
  const handleOpenVersionHistory = (ref: Reference) => {
    setHistoryReference(ref);
    setIsHistoryModalOpen(true);
  };

  // Handler: Restore Reference Version
  const handleRestoreReferenceVersion = async (snapshot: Reference) => {
    await dbService.saveReference(snapshot, 'استعادة نسخة سابقة من سجل التعديلات');
    refreshAllData();
    if (selectedReference?.id === snapshot.id) {
      setSelectedReference(snapshot);
    }
  };

  // Handler: Save Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    await dbService.saveSettings(newSettings);
    setSettings(newSettings);
    setViewMode(newSettings.defaultViewMode);
  };

  // Handler: Reset Sample Data
  const handleResetSampleData = async () => {
    await dbService.seedInitialData();
    await refreshAllData();
  };

  // Handler: Open Evidence Search for a specific book or generally
  const handleOpenEvidenceSearch = (ref?: Reference) => {
    if (ref) {
      setEvidenceTargetReference(ref);
    }
    setSelectedReference(null);
    setActiveTab('evidence_search');
  };

  // Total counts for sidebar badges
  const activeCount = (references || []).filter((r) => !r.inTrash).length;
  const favoritesCount = (references || []).filter((r) => !r.inTrash && r.isFavorite).length;
  const trashCount = (references || []).filter((r) => r.inTrash).length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E252B] flex flex-col antialiased selection:bg-[#7D2433]/20 selection:text-[#7D2433]" dir="rtl">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedReference(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        settings={settings}
        onQuickAdd={() => {
          setEditingReference(null);
          setIsFormModalOpen(true);
        }}
        onOpenAddModal={() => {
          setEditingReference(null);
          setIsFormModalOpen(true);
        }}
        onOpenReader={() => {
          const refWithDoc = references.find((r) => !r.inTrash && r.file) || references.find((r) => !r.inTrash);
          if (refWithDoc) {
            handleOpenReader(refWithDoc);
          } else {
            setActiveTab('library');
          }
        }}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        totalReferences={activeCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'add_reference') {
              setEditingReference(null);
              setIsFormModalOpen(true);
              return;
            }
            setActiveTab(tab);
            setSelectedReference(null); // Return to list view
            setIsMobileSidebarOpen(false);
          }}
          onAddNewReference={() => {
            setEditingReference(null);
            setIsFormModalOpen(true);
          }}
          totalReferences={activeCount}
          totalFavorites={favoritesCount}
          totalNotes={notes.length}
          totalCitations={citations.length}
          totalTrash={trashCount}
          thesisTitle={settings.thesisTitle}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {/* Conditional Rendering of Views */}
          {selectedReference ? (
            /* 1. Reference Details View */
            <ReferenceDetailsView
              reference={selectedReference}
              categories={categories}
              notes={notes}
              citations={citations}
              onBack={() => setSelectedReference(null)}
              onEdit={(ref) => {
                setEditingReference(ref);
                setIsFormModalOpen(true);
              }}
              onDelete={handleDeleteReference}
              onToggleFavorite={handleToggleFavorite}
              onRead={handleOpenReader}
              onOpenReader={handleOpenReader}
              onViewVersions={handleOpenVersionHistory}
              onOpenVersionHistory={handleOpenVersionHistory}
              onAddNote={() => setActiveTab('notes')}
              onAddCitation={() => setActiveTab('citations')}
              onDownloadFile={handleDownloadFile}
              onUpdateReference={handleSaveReference}
              onSearchEvidence={handleOpenEvidenceSearch}
            />
          ) : activeTab === 'dashboard' ? (
            /* 2. Dashboard View */
            <DashboardView
              references={references}
              categories={categories}
              quotes={citations}
              notes={notes}
              thesisTitle={settings.thesisTitle}
              onNavigateToLibrary={() => setActiveTab('library')}
              onNavigateToCatalogue={() => setActiveTab('master_catalogue')}
              onOpenAddModal={() => {
                setEditingReference(null);
                setIsFormModalOpen(true);
              }}
              onSelectReference={(ref) => setSelectedReference(ref)}
              onSelectLetter={(letter) => {
                setSelectedLetter(letter);
                setActiveTab('library');
              }}
            />
          ) : activeTab === 'library' ? (
            /* 3. Library View with Alphabetical Index & Grid/List */
            <LibraryView
              references={references}
              categories={categories}
              viewMode={viewMode}
              onToggleViewMode={setViewMode}
              selectedLetter={selectedLetter}
              onSelectLetter={setSelectedLetter}
              onSelectReference={(ref) => setSelectedReference(ref)}
              onEditReference={(ref) => {
                setEditingReference(ref);
                setIsFormModalOpen(true);
              }}
              onReadReference={handleOpenReader}
              onToggleFavorite={handleToggleFavorite}
              onDeleteReference={handleDeleteReference}
              onAddNewReference={() => {
                setEditingReference(null);
                setIsFormModalOpen(true);
              }}
              onDownloadFile={handleDownloadFile}
              onAttachBook={handleAttachBookToRef}
              primarySortRule={settings.primarySortRule}
              onSortRuleChange={(rule) => {
                const updated = { ...settings, primarySortRule: rule };
                handleSaveSettings(updated);
              }}
              searchQuery={searchQuery}
              onSearchEvidence={handleOpenEvidenceSearch}
            />
          ) : activeTab === 'master_catalogue' ? (
            /* Master Alphabetical Book Catalogue & Tool Memory */
            <MasterCatalogueView
              references={references}
              categories={categories}
              toolMemory={toolMemory}
              onRefreshMemory={handleRefreshToolMemory}
              onSelectReference={(ref) => setSelectedReference(ref)}
              onEditReference={(ref) => {
                setEditingReference(ref);
                setIsFormModalOpen(true);
              }}
              onReadReference={handleOpenReader}
              onToggleFavorite={handleToggleFavorite}
              onAttachBook={handleAttachBookToRef}
              onDownloadFile={handleDownloadFile}
              onSearchEvidence={handleOpenEvidenceSearch}
              settings={settings}
            />
          ) : (activeTab === 'search' || activeTab === 'advanced_search') ? (
            /* 4. Advanced Search View */
            <AdvancedSearchView
              references={references}
              categories={categories}
              onSelectReference={(ref) => setSelectedReference(ref)}
              onEditReference={(ref) => {
                setEditingReference(ref);
                setIsFormModalOpen(true);
              }}
              onReadReference={handleOpenReader}
              onToggleFavorite={handleToggleFavorite}
              onDeleteReference={handleDeleteReference}
            />
          ) : activeTab === 'categories' ? (
            /* 5. Categories / Subjects View */
            <CategoriesView
              categories={categories}
              references={references}
              onSaveCategory={async (cat) => {
                await dbService.saveCategory(cat);
                refreshAllData();
              }}
              onDeleteCategory={async (id) => {
                await dbService.deleteCategory(id);
                refreshAllData();
              }}
              onSelectReference={(ref) => setSelectedReference(ref)}
              onEditReference={(ref) => {
                setEditingReference(ref);
                setIsFormModalOpen(true);
              }}
              onReadReference={handleOpenReader}
              onToggleFavorite={handleToggleFavorite}
              onDeleteReference={handleDeleteReference}
            />
          ) : activeTab === 'favorites' ? (
            /* 6. Favorites View */
            <FavoritesView
              references={references}
              onSelectReference={(ref) => setSelectedReference(ref)}
              onEditReference={(ref) => {
                setEditingReference(ref);
                setIsFormModalOpen(true);
              }}
              onReadReference={handleOpenReader}
              onToggleFavorite={handleToggleFavorite}
              onDeleteReference={handleDeleteReference}
              onDownloadFile={handleDownloadFile}
              onAttachBook={handleAttachBookToRef}
            />
          ) : activeTab === 'notes' ? (
            /* 7. Research Notes View */
            <NotesView
              notes={notes}
              references={references}
              onSaveNote={async (note) => {
                await dbService.saveNote(note);
                refreshAllData();
              }}
              onDeleteNote={async (id) => {
                await dbService.deleteNote(id);
                refreshAllData();
              }}
              onSelectReference={(ref) => setSelectedReference(ref)}
            />
          ) : activeTab === 'citations' ? (
            /* 8. Citations / Quotes View */
            <CitationsView
              citations={citations}
              references={references}
              onSaveCitation={async (citation) => {
                await dbService.saveCitation(citation);
                refreshAllData();
              }}
              onDeleteCitation={async (id) => {
                await dbService.deleteCitation(id);
                refreshAllData();
              }}
              onSelectReference={(ref) => setSelectedReference(ref)}
            />
          ) : activeTab === 'version_history' ? (
            /* 9. Version History View */
            <VersionHistoryView
              references={references}
              onOpenVersionHistory={handleOpenVersionHistory}
              onRestoreSnapshot={handleRestoreReferenceVersion}
            />
          ) : activeTab === 'trash' ? (
            /* 10. Trash View */
            <TrashView
              references={references}
              onRestore={handleRestoreReference}
              onPermanentDelete={handlePermanentDelete}
              onEmptyTrash={handleEmptyTrash}
            />
          ) : activeTab === 'storage' ? (
            /* 11. Storage Management View */
            <StorageView
              references={references}
              onRefreshReferences={refreshAllData}
            />
          ) : (activeTab === 'import_export' || (activeTab as string) === 'import-export') ? (
            /* 12. Import, Export & Thesis Bibliography View */
            <ImportExportView
              references={references}
              categories={categories}
              quotes={citations}
              notes={notes}
              onImportComplete={refreshAllData}
            />
          ) : activeTab === 'settings' ? (
            /* 13. Settings & Customization View */
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetSampleData={handleResetSampleData}
            />
          ) : activeTab === 'evidence_search' ? (
            /* 14. Academic Evidence & Semantic Source Search */
            <EvidenceSearchView
              references={references}
              settings={settings}
              preSelectedReference={evidenceTargetReference}
              onSaveCitationQuote={async (quote) => {
                await dbService.saveCitation(quote);
                refreshAllData();
              }}
              onSaveResearchNote={async (note) => {
                await dbService.saveNote(note);
                refreshAllData();
              }}
              onOpenReader={handleOpenReader}
              onNavigateToCatalogue={() => setActiveTab('master_catalogue')}
            />
          ) : null}
        </main>
      </div>

      {/* Reference Form Modal (Add / Edit) */}
      <ReferenceFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingReference(null);
        }}
        onSave={handleSaveReference}
        initialReference={editingReference}
        reference={editingReference}
        existingReferences={references}
        onOpenExistingReference={(existingRef) => {
          setIsFormModalOpen(false);
          setEditingReference(null);
          setSelectedReference(existingRef);
          setActiveTab('library');
        }}
        categories={categories}
      />

      {/* PDF & Document Reader Modal */}
      <PdfReaderModal
        isOpen={isReaderModalOpen}
        reference={readingReference}
        onClose={() => {
          setIsReaderModalOpen(false);
          setReadingReference(null);
        }}
        onSaveQuote={async (newQuote) => {
          await dbService.saveCitation(newQuote);
          refreshAllData();
        }}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        reference={historyReference}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryReference(null);
        }}
        onRestoreVersion={handleRestoreReferenceVersion}
      />
    </div>
  );
}
