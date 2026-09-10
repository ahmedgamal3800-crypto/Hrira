export type LanguageType = 'العربية' | 'English' | 'Français' | 'Greek' | 'Deutsch' | 'Latin' | 'Türkçe' | 'Español' | 'Italiano' | 'أخرى';

export type ReferenceType = 
  | 'كتاب (Book)'
  | 'رسالة ماجستير (Master Thesis)'
  | 'أطروحة دكتوراه (PhD Dissertation)'
  | 'مقالة في دورية محكمة (Journal Article)'
  | 'مصدر أصلي / مخطوط (Primary Source)'
  | 'وثيقة أرشيفية (Archival Document)'
  | 'فصل في كتاب (Book Section)'
  | 'موسوعة أو معجم (Encyclopedia)'
  | 'بحث مؤتمر (Conference Paper)';

export type SortRule = 
  | 'author'       // 1. ترتيب حسب أول اسم المؤلف (الاسم الأول - المعتمد)
  | 'title'        // 2. ترتيب حسب عنوان الكتاب
  | 'year'         // 3. ترتيب حسب سنة النشر
  | 'dateAdded'    // 4. ترتيب حسب تاريخ الإضافة
  | 'type';        // 5. ترتيب حسب نوع المصدر

export type ViewMode = 'grid' | 'list';

export interface ReferenceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // or object URL
  blob?: Blob;
  pageCount?: number;
  uploadDate: string;
}

export interface ReferenceVersion {
  id: string;
  referenceId: string;
  timestamp: string;
  editorNote: string;
  snapshot: Partial<Reference>;
}

export interface CitationQuote {
  id: string;
  referenceId: string;
  referenceTitle: string;
  authorName: string;
  pageNumber: string;
  quoteText: string;
  commentary?: string;
  tags?: string[];
  createdAt: string;
}

export interface ResearchNote {
  id: string;
  referenceId?: string;
  referenceTitle?: string;
  title: string;
  content: string;
  pageNumber?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  referenceCount?: number;
}

export interface Reference {
  id: string;
  
  // Mandatory exact author fields
  authorFamilyName: string;   // اسم العائلة / اللقب / الجد (e.g. كومنينا, Akropolites, Nicol)
  authorFirstName: string;    // الاسم (e.g. آنا, George, Donald M.)
  authorFullName: string;     // اسم المؤلف الكامل (e.g. آنا كومنينا, Donald M. Nicol)
  
  // Title and language
  title: string;              // Reference Title / عنوان المرجع
  subtitle?: string;          // عنوان فرعي إن وجد
  language: LanguageType;     // اللغة
  referenceType: ReferenceType; // نوع المرجع
  
  // Publication details
  publisher?: string;         // دار النشر
  publicationPlace?: string;  // مكان النشر
  publicationYear?: string;   // سنة النشر
  edition?: string;           // الطبعة
  volume?: string;            // الجزء / المجلد
  pages?: string;             // الصفحات (e.g. 120-145 or 450 ص)
  translatorOrEditor?: string;// المترجم أو المحقق أو المحرر
  authorBio?: string;         // نبذة أكاديمية عن المؤلف
  historicalRelevance?: string; // الأهمية التاريخية للأطروحة
  
  // Identifiers
  isbn?: string;              // ISBN إن وجد
  doi?: string;               // DOI إن وجد
  keywords: string[];         // الكلمات المفتاحية
  
  // Full citation - strictly user controlled!
  fullCitation: string;       // الصيغة الكاملة للمرجع
  
  // System metadata
  alphabetKey: string;        // الحرف الأبجدي (A-Z or أ-ي)
  categoryIds: string[];      // معرفات التصنيفات
  isFavorite: boolean;        // المفضلة
  inTrash: boolean;           // في سلة المحذوفات
  dateAdded: string;          // تاريخ الإضافة
  lastModified: string;       // تاريخ آخر تعديل
  
  // Attached files
  file?: ReferenceFile;
  coverImage?: string;        // صورة الغلاف إن وجدت
  notesCount?: number;
  quotesCount?: number;
}

export interface AppSettings {
  primarySortRule: SortRule;
  sortDirection: 'asc' | 'desc';
  ignoreArabicArticleInSorting: boolean; // تجاهل "الـ" التعريف في الترتيب الأبجدي
  defaultLanguage: 'ar' | 'en';
  readerTheme: 'light' | 'sepia' | 'dark';
  defaultViewMode: ViewMode;
  thesisTitle: string;
  researcherName: string;
}

export interface ToolMemoryActivity {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ToolMemoryState {
  lastSynchronized: string;
  version: number;
  totalBooksIndexed: number;
  totalAuthorsIndexed: number;
  totalFilesAttached: number;
  alphabeticalLetterCoverage: string[];
  topKeywords: Array<{ keyword: string; count: number }>;
  recentActivities: ToolMemoryActivity[];
  cachedBookTitles: Array<{
    id: string;
    title: string;
    author: string;
    year?: string;
    letter: string;
    hasFile: boolean;
  }>;
}

export interface SecondaryEvidenceQuote {
  printedPage: string;
  originalQuote: string;
  academicTranslation: string;
  evidenceAnalysis?: string;
}

export interface EvidenceSearchResult {
  evidenceFound: boolean;
  bookTitle: string;
  author: string;
  editionOrPublication?: string;
  printedPage: string;
  volume?: string;
  chapterOrSection?: string;
  originalLanguage?: string;
  originalQuote: string;
  academicTranslation: string;
  evidenceAnalysis: string;
  thesisRelevance?: string;
  formalCitation: string;
  secondaryQuotes?: SecondaryEvidenceQuote[];
  note?: string;
}

export interface EvidenceSearchPayload {
  claimOrTopic: string;
  bookTitle?: string;
  author?: string;
  edition?: string;
  volume?: string;
  publisher?: string;
  publicationYear?: string;
  language?: string;
  fullCitation?: string;
  thesisTitle?: string;
  customTextExcerpt?: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'library'
  | 'master_catalogue'
  | 'evidence_search'
  | 'add_reference'
  | 'reference_details'
  | 'pdf_reader'
  | 'advanced_search'
  | 'categories'
  | 'favorites'
  | 'notes'
  | 'citations'
  | 'trash'
  | 'settings'
  | 'storage'
  | 'version_history'
  | 'import_export';
