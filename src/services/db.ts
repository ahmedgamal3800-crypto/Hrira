import { 
  Reference, 
  ReferenceFile, 
  ResearchNote, 
  CitationQuote, 
  CategoryItem, 
  ReferenceVersion, 
  AppSettings,
  ToolMemoryState,
  ToolMemoryActivity
} from '../types';
import { getAlphabetKey } from './alphabet';
import { SEED_REFERENCES_LIST } from '../data/seedReferences';

const DB_NAME = 'HurairahAcademicLibraryDB';
const DB_VERSION = 1;

export const DEFAULT_TOOL_MEMORY: ToolMemoryState = {
  lastSynchronized: new Date().toISOString(),
  version: 1,
  totalBooksIndexed: 0,
  totalAuthorsIndexed: 0,
  totalFilesAttached: 0,
  alphabeticalLetterCoverage: [],
  topKeywords: [],
  recentActivities: [
    {
      id: 'act-init',
      action: 'تهيئة ذاكرة الأداة',
      details: 'تم تأسيس ذاكرة وفهرس الكتب الأكاديمية بنجاح.',
      timestamp: new Date().toISOString()
    }
  ],
  cachedBookTitles: []
};

export const DEFAULT_SETTINGS: AppSettings = {
  primarySortRule: 'author',
  sortDirection: 'asc',
  ignoreArabicArticleInSorting: false,
  defaultLanguage: 'ar',
  readerTheme: 'light',
  defaultViewMode: 'grid',
  thesisTitle: 'قسطنطين الحادي عشر باليولوجوس (1449–1453م) في ضوء المصادر البيزنطية والعثمانية',
  researcherName: 'الباحث الأكاديمي'
};

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'المصادر البيزنطية المعاصرة (1449–1453م)', description: 'المؤرخون البيزنطيون الكبار (سفرانتزيس، دوكاس، خالكوكونديليس، كريتوفولوس) والوثائق الإمبراطورية', color: '#7D2433' },
  { id: 'cat-2', name: 'المصادر والتواريخ العثمانية المعاصرة', description: 'حوليات الفتح وتواريخ الدولة العثمانية المبكرة (عاشق باشا زاده، طرسون بك، نشري، روحي أدرنه لي)', color: '#14532D' },
  { id: 'cat-3', name: 'شهود العيان والمصادر الغربية واللاتينية', description: 'يوميات حصار 1453 ورسائل شهود العيان (نيكولو باربارو، ليوناردو الخيوسي، فرانشيسكو برانزارو)', color: '#1E3A8A' },
  { id: 'cat-4', name: 'الدراسات والمراجع التاريخية الحديثة', description: 'أبحاث ودراسات المؤرخين المعاصرين حول عهد قسطنطين الحادي عشر وسقوط القسطنطينية 1453م', color: '#78350F' },
  { id: 'cat-5', name: 'أطروحات ورسائل ماجستير ودكتوراه', description: 'رسائل جامعية غير منشورة ودراسات أكاديمية مقارنة في العلاقات البيزنطية العثمانية', color: '#581C87' }
];

export const INITIAL_REFERENCES: Reference[] = SEED_REFERENCES_LIST.map((ref) => ({
  ...ref,
  alphabetKey: getAlphabetKey(ref)
}));

export const INITIAL_QUOTES: CitationQuote[] = [
  {
    id: 'q-1',
    referenceId: 'ref-1',
    referenceTitle: 'الألكسياد',
    authorName: 'آنا كومنينا',
    pageNumber: '142',
    quoteText: '«إن الزمن في تدفقه الأبدي الذي لا ينقطع، يجرف كل ما ولد، ويغرقه في لجة النسيان المظلمة... ولهذا عزمت أنا آنا ابنة القيصر ألكسيوس على تدوين هذه المآثر وفاءً للحق التاريخي.»',
    commentary: 'مقدمة الألكسياد الفلسفية المعبرة عن مفهوم التاريخ لدى الأميرة البيزنطية وضرورة استشهادها في تمهيد الأطروحة.',
    tags: ['فلسفة التاريخ', 'مقدمات', 'منهجية'],
    createdAt: '2026-09-02T10:00:00.000Z'
  },
  {
    id: 'q-2',
    referenceId: 'ref-2',
    referenceTitle: 'The History',
    authorName: 'George Akropolites',
    pageNumber: '89',
    quoteText: '"The Empire of the Romans, though fractured and displaced to Nicaea after the Western conquest of 1204, never lost its legitimate continuity nor its administrative memory."',
    commentary: 'استدلال جوهري حول استمرارية الشرعية الإمبراطورية في نيقية لمناقشة فصل سقوط القسطنطينية 1204.',
    tags: ['نيقية', 'الشرعية', '1204'],
    createdAt: '2026-09-03T11:00:00.000Z'
  }
];

export const INITIAL_NOTES: ResearchNote[] = [
  {
    id: 'note-1',
    referenceId: 'ref-1',
    referenceTitle: 'الألكسياد',
    title: 'ملاحظة نقدية حول رؤية آنا كومنينا للصليبيين اللاتين',
    content: 'تصف آنا كومنينا قادة الحملة الصليبية الأولى (وخاصة بوهيموند النورماندي) بنبرة تجمع بين الإعجاب بهيبتهم العسكرية والحذر الشديد من طموحاتهم التوسعية على حساب أراضي بيزنطة. يجب مضاهاة هذا الوصف مع ما ورد في كتاب أعمال الفرنجة (Gesta Francorum).',
    pageNumber: '215-220',
    tags: ['بوهيموند', 'النورمان', 'الحملة الأولى'],
    createdAt: '2026-09-02T14:00:00.000Z',
    updatedAt: '2026-09-02T14:00:00.000Z'
  }
];

class AcademicDatabase {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('references')) {
          const refStore = db.createObjectStore('references', { keyPath: 'id' });
          refStore.createIndex('alphabetKey', 'alphabetKey', { unique: false });
          refStore.createIndex('authorFamilyName', 'authorFamilyName', { unique: false });
          refStore.createIndex('inTrash', 'inTrash', { unique: false });
          refStore.createIndex('isFavorite', 'isFavorite', { unique: false });
        }

        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('referenceId', 'referenceId', { unique: false });
        }

        if (!db.objectStoreNames.contains('citations')) {
          const citStore = db.createObjectStore('citations', { keyPath: 'id' });
          citStore.createIndex('referenceId', 'referenceId', { unique: false });
        }

        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('versions')) {
          const verStore = db.createObjectStore('versions', { keyPath: 'id' });
          verStore.createIndex('referenceId', 'referenceId', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Check if database needs seeding
        try {
          await this.internalSeedIfEmpty(db);
        } catch (e) {
          console.error('Error seeding initial data', e);
        }
        resolve(db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private internalSeedIfEmpty(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(['references', 'categories', 'notes', 'citations', 'settings'], 'readwrite');
        const refStore = tx.objectStore('references');
        const countReq = refStore.count();

        countReq.onsuccess = () => {
          // If database is empty or has old incomplete sample data (< 50 items)
          if (countReq.result < 50) {
            // Clear any old sample references and load the full 114 references
            refStore.clear();
            INITIAL_REFERENCES.forEach((ref) => refStore.put(ref));

            // Seed categories
            const catStore = tx.objectStore('categories');
            catStore.clear();
            INITIAL_CATEGORIES.forEach((cat) => catStore.put(cat));

            // Seed citations
            const citStore = tx.objectStore('citations');
            INITIAL_QUOTES.forEach((q) => citStore.put(q));

            // Seed notes
            const noteStore = tx.objectStore('notes');
            INITIAL_NOTES.forEach((n) => noteStore.put(n));

            // Seed settings
            const setStore = tx.objectStore('settings');
            setStore.put({ key: 'main', value: DEFAULT_SETTINGS });
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      } catch (err) {
        resolve(); // Continue even if seed encounters non-fatal error
      }
    });
  }

  // Public seed method
  async seedInitialData(): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['references', 'categories', 'citations', 'notes', 'settings'], 'readwrite');
    const refStore = tx.objectStore('references');
    refStore.clear();
    INITIAL_REFERENCES.forEach((ref) => refStore.put(ref));
    const catStore = tx.objectStore('categories');
    catStore.clear();
    INITIAL_CATEGORIES.forEach((cat) => catStore.put(cat));
    const citStore = tx.objectStore('citations');
    INITIAL_QUOTES.forEach((q) => citStore.put(q));
    const noteStore = tx.objectStore('notes');
    INITIAL_NOTES.forEach((n) => noteStore.put(n));
    const setStore = tx.objectStore('settings');
    setStore.put({ key: 'main', value: DEFAULT_SETTINGS });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Generic helpers
  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.dbPromise;
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // References
  async getAllReferences(): Promise<Reference[]> {
    const store = await this.getStore('references');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const raw = req.result || [];
        const normalized = raw.map((r: Reference) => ({
          ...r,
          alphabetKey: getAlphabetKey(r)
        }));
        resolve(normalized);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getReferenceById(id: string): Promise<Reference | undefined> {
    const store = await this.getStore('references');
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async saveReference(ref: Reference, note = 'تحديث بيانات المرجع'): Promise<Reference> {
    // Determine alphabetical key
    const alphabetKey = getAlphabetKey(ref);
    const updatedRef: Reference = {
      ...ref,
      alphabetKey,
      lastModified: new Date().toISOString()
    };

    // Save version history snapshot before saving
    try {
      const existing = await this.getReferenceById(ref.id);
      if (existing) {
        await this.addVersion({
          id: 'v-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          referenceId: ref.id,
          timestamp: new Date().toISOString(),
          editorNote: note,
          snapshot: existing
        });
      }
    } catch {
      // ignore versioning error
    }

    const store = await this.getStore('references', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(updatedRef);
      req.onsuccess = () => resolve(updatedRef);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteReference(id: string, permanent = false): Promise<void> {
    if (permanent) {
      const store = await this.getStore('references', 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } else {
      const ref = await this.getReferenceById(id);
      if (ref) {
        ref.inTrash = true;
        await this.saveReference(ref, 'نقل إلى سلة المحذوفات');
      }
    }
  }

  async softDeleteReference(id: string): Promise<void> {
    return this.deleteReference(id, false);
  }

  async permanentDeleteReference(id: string): Promise<void> {
    return this.deleteReference(id, true);
  }

  async emptyTrash(): Promise<void> {
    const refs = await this.getAllReferences();
    const trashRefs = refs.filter((r) => r.inTrash);
    for (const ref of trashRefs) {
      await this.deleteReference(ref.id, true);
    }
  }

  async restoreReference(id: string): Promise<void> {
    const ref = await this.getReferenceById(id);
    if (ref) {
      ref.inTrash = false;
      await this.saveReference(ref, 'استعادة من سلة المحذوفات');
    }
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const ref = await this.getReferenceById(id);
    if (ref) {
      ref.isFavorite = !ref.isFavorite;
      await this.saveReference(ref, ref.isFavorite ? 'إضافة إلى المفضلة' : 'إزالة من المفضلة');
      return ref.isFavorite;
    }
    return false;
  }

  // Files
  async saveFile(
    fileRecordOrId: string | { id: string; name: string; type: string; size: number; blob: Blob },
    blob?: Blob,
    name?: string,
    type?: string
  ): Promise<void> {
    const store = await this.getStore('files', 'readwrite');
    let record: { id: string; name: string; type: string; size: number; blob: Blob };
    if (typeof fileRecordOrId === 'string') {
      record = {
        id: fileRecordOrId,
        blob: blob!,
        name: name || 'document.pdf',
        type: type || 'application/pdf',
        size: blob?.size || 0
      };
    } else {
      record = fileRecordOrId;
    }

    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getFile(id: string): Promise<{ id: string; name: string; type: string; size: number; blob: Blob } | undefined> {
    const store = await this.getStore('files');
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteFile(id: string): Promise<void> {
    const store = await this.getStore('files', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Categories
  async getAllCategories(): Promise<CategoryItem[]> {
    const store = await this.getStore('categories');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getCategories(): Promise<CategoryItem[]> {
    return this.getAllCategories();
  }

  async saveCategory(category: CategoryItem): Promise<void> {
    const store = await this.getStore('categories', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(category);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const store = await this.getStore('categories', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Notes
  async getAllNotes(): Promise<ResearchNote[]> {
    const store = await this.getStore('notes');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getNotes(): Promise<ResearchNote[]> {
    return this.getAllNotes();
  }

  async saveNote(note: ResearchNote): Promise<void> {
    const store = await this.getStore('notes', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(note);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteNote(id: string): Promise<void> {
    const store = await this.getStore('notes', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Citations / Quotes
  async getAllCitations(): Promise<CitationQuote[]> {
    const store = await this.getStore('citations');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getCitations(): Promise<CitationQuote[]> {
    return this.getAllCitations();
  }

  async saveCitation(citation: CitationQuote): Promise<void> {
    const store = await this.getStore('citations', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(citation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteCitation(id: string): Promise<void> {
    const store = await this.getStore('citations', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Versions
  async getVersionsForReference(referenceId: string): Promise<ReferenceVersion[]> {
    const db = await this.dbPromise;
    const tx = db.transaction('versions', 'readonly');
    const store = tx.objectStore('versions');
    const index = store.index('referenceId');

    return new Promise((resolve, reject) => {
      const req = index.getAll(referenceId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getVersions(referenceId: string): Promise<ReferenceVersion[]> {
    return this.getVersionsForReference(referenceId);
  }

  async addVersion(version: ReferenceVersion): Promise<void> {
    const store = await this.getStore('versions', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(version);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Settings
  async getSettings(): Promise<AppSettings> {
    const store = await this.getStore('settings');
    return new Promise((resolve) => {
      const req = store.get('main');
      req.onsuccess = async () => {
        if (req.result && req.result.value) {
          const loaded: AppSettings = { ...DEFAULT_SETTINGS, ...req.result.value };
          // If the stored thesis title is empty or the previous generic topic, update to the active thesis
          if (!loaded.thesisTitle || loaded.thesisTitle.includes('سلاجقة الروم والدولة العثمانية واللاتين')) {
            loaded.thesisTitle = DEFAULT_SETTINGS.thesisTitle;
            try {
              const writeStore = await this.getStore('settings', 'readwrite');
              writeStore.put({ key: 'main', value: loaded });
            } catch {
              // ignore write error
            }
          }
          resolve(loaded);
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const store = await this.getStore('settings', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put({ key: 'main', value: settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Tool Memory & Master Index Synchronization
  async getToolMemory(): Promise<ToolMemoryState> {
    const store = await this.getStore('settings');
    return new Promise((resolve) => {
      const req = store.get('tool_memory');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve(req.result.value as ToolMemoryState);
        } else {
          this.rebuildToolMemory(false)
            .then(resolve)
            .catch(() => resolve(DEFAULT_TOOL_MEMORY));
        }
      };
      req.onerror = () => resolve(DEFAULT_TOOL_MEMORY);
    });
  }

  async saveToolMemory(memory: ToolMemoryState): Promise<void> {
    const store = await this.getStore('settings', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put({ key: 'tool_memory', value: memory });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async recordMemoryActivity(action: string, details: string): Promise<void> {
    try {
      const memory = await this.getToolMemory();
      const newActivity: ToolMemoryActivity = {
        id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action,
        details,
        timestamp: new Date().toISOString()
      };
      const updatedActivities = [newActivity, ...(memory.recentActivities || [])].slice(0, 30);
      await this.saveToolMemory({
        ...memory,
        recentActivities: updatedActivities
      });
    } catch {
      // safe fallback
    }
  }

  async rebuildToolMemory(manualTrigger = true): Promise<ToolMemoryState> {
    const refs = (await this.getAllReferences()).filter((r) => !r.inTrash);
    const settings = await this.getSettings();

    const authorsSet = new Set<string>();
    let filesAttached = 0;
    const letterSet = new Set<string>();
    const keywordCountMap: Record<string, number> = {};

    const cachedBookTitles = refs.map((ref) => {
      const author = ref.authorFullName || `${ref.authorFirstName} ${ref.authorFamilyName}`.trim();
      if (author) authorsSet.add(author);
      if (ref.file?.id || ref.file?.name) filesAttached++;

      const letter = ref.alphabetKey || getAlphabetKey(ref, settings.ignoreArabicArticleInSorting);
      if (letter && letter !== '#') letterSet.add(letter);

      if (ref.keywords && Array.isArray(ref.keywords)) {
        ref.keywords.forEach((kw) => {
          const trimmed = kw.trim();
          if (trimmed) {
            keywordCountMap[trimmed] = (keywordCountMap[trimmed] || 0) + 1;
          }
        });
      }

      return {
        id: ref.id,
        title: ref.title,
        author,
        year: ref.publicationYear,
        letter,
        hasFile: Boolean(ref.file?.id || ref.file?.name)
      };
    });

    const topKeywords = Object.entries(keywordCountMap)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const existingMem = await new Promise<ToolMemoryState | null>((resolve) => {
      this.getStore('settings')
        .then((store) => {
          const req = store.get('tool_memory');
          req.onsuccess = () => resolve(req.result?.value || null);
          req.onerror = () => resolve(null);
        })
        .catch(() => resolve(null));
    });

    const existingActivities = existingMem?.recentActivities || [];
    const newActivity: ToolMemoryActivity = {
      id: 'act-' + Date.now(),
      action: manualTrigger ? 'تحديث الفهرس والذاكرة بطلب المستخدم' : 'مزامنة تلقائية لذاكرة الكتب',
      details: `تم تحديث الفهرس الشامل وفهرسة ${refs.length} كتاباً ومرجعاً، وتغطية ${letterSet.size} حرفاً هجائياً.`,
      timestamp: new Date().toISOString()
    };

    const newMemoryState: ToolMemoryState = {
      lastSynchronized: new Date().toISOString(),
      version: (existingMem?.version || 0) + 1,
      totalBooksIndexed: refs.length,
      totalAuthorsIndexed: authorsSet.size,
      totalFilesAttached: filesAttached,
      alphabeticalLetterCoverage: Array.from(letterSet).sort(),
      topKeywords,
      recentActivities: [newActivity, ...existingActivities].slice(0, 30),
      cachedBookTitles
    };

    await this.saveToolMemory(newMemoryState);
    return newMemoryState;
  }

  // Storage Stats
  async getStorageStats(): Promise<{
    referenceCount: number;
    fileCount: number;
    totalSizeBytes: number;
    notesCount: number;
    citationsCount: number;
    quotaBytes?: number;
    usageBytes?: number;
  }> {
    const refs = await this.getAllReferences();
    const notes = await this.getAllNotes();
    const citations = await this.getAllCitations();

    // Query files store
    const fileStore = await this.getStore('files');
    const files: Array<{ size: number }> = await new Promise((resolve) => {
      const req = fileStore.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    const totalFileBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);

    let quotaBytes: number | undefined;
    let usageBytes: number | undefined;

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        quotaBytes = est.quota;
        usageBytes = est.usage;
      } catch {
        // ignore
      }
    }

    return {
      referenceCount: refs.filter((r) => !r.inTrash).length,
      fileCount: files.length,
      totalSizeBytes: totalFileBytes,
      notesCount: notes.length,
      citationsCount: citations.length,
      quotaBytes,
      usageBytes
    };
  }

  async clearAllFiles(): Promise<void> {
    const store = await this.getStore('files', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const dbService = new AcademicDatabase();
