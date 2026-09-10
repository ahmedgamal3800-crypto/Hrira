import { Reference, ReferenceType, CategoryItem, ResearchNote, CitationQuote } from '../types';
import { sortReferences } from './alphabet';

/**
 * Full JSON export of library data
 */
export function exportToJson(
  references: Reference[],
  categories?: CategoryItem[],
  notes?: ResearchNote[],
  citations?: CitationQuote[]
): string {
  const payload = {
    appName: 'مكتبة هريرة الأكاديمية',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    references,
    categories: categories || [],
    notes: notes || [],
    citations: citations || []
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Import library from JSON text
 */
export async function importFromJson(jsonString: string): Promise<{
  referencesCount: number;
  skippedDuplicatesCount: number;
  categoriesCount: number;
}> {
  const data = JSON.parse(jsonString);
  if (!data || !Array.isArray(data.references)) {
    throw new Error('صيغة الملف غير صحيحة أو لا تحتوي على مراجع');
  }

  const { dbService } = await import('./db');
  const { checkReferenceDuplicate } = await import('./duplicateDetector');
  const existingRefs = await dbService.getAllReferences();

  let importedCount = 0;
  let skippedDuplicatesCount = 0;

  for (const ref of data.references) {
    const dupCheck = checkReferenceDuplicate(ref, existingRefs);
    if (dupCheck.isDuplicate) {
      skippedDuplicatesCount++;
      continue;
    }

    await dbService.saveReference(ref, 'استيراد من ملف خارجي');
    existingRefs.push(ref);
    importedCount++;
  }

  if (Array.isArray(data.categories)) {
    for (const cat of data.categories) {
      await dbService.saveCategory(cat);
    }
  }

  if (Array.isArray(data.notes)) {
    for (const n of data.notes) {
      await dbService.saveNote(n);
    }
  }

  if (Array.isArray(data.citations)) {
    for (const c of data.citations) {
      await dbService.saveCitation(c);
    }
  }

  return {
    referencesCount: importedCount,
    skippedDuplicatesCount,
    categoriesCount: data.categories?.length || 0
  };
}

/**
 * Generates a clean BibTeX file content from references
 */
export function exportToBibTeX(references: Reference[]): string {
  return references
    .map((ref) => {
      let entryType = 'book';
      if (ref.referenceType.includes('مقالة')) entryType = 'article';
      else if (ref.referenceType.includes('رسالة ماجستير')) entryType = 'mastersthesis';
      else if (ref.referenceType.includes('أطروحة دكتوراه')) entryType = 'phdthesis';
      else if (ref.referenceType.includes('فصل')) entryType = 'incollection';
      else if (ref.referenceType.includes('مؤتمر')) entryType = 'inproceedings';

      const keyAuthor = (ref.authorFamilyName || ref.authorFullName || 'anon')
        .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '')
        .slice(0, 12);
      const keyYear = ref.publicationYear ? ref.publicationYear.replace(/[^0-9]/g, '') : 'nd';
      const citeKey = `${keyAuthor}_${keyYear}`;

      const fields: string[] = [];
      fields.push(`  author = {${ref.authorFullName || `${ref.authorFamilyName}, ${ref.authorFirstName}`}}`);
      fields.push(`  title = {${ref.title}}`);
      if (ref.publisher) fields.push(`  publisher = {${ref.publisher}}`);
      if (ref.publicationYear) fields.push(`  year = {${ref.publicationYear}}`);
      if (ref.publicationPlace) fields.push(`  address = {${ref.publicationPlace}}`);
      if (ref.edition) fields.push(`  edition = {${ref.edition}}`);
      if (ref.volume) fields.push(`  volume = {${ref.volume}}`);
      if (ref.pages) fields.push(`  pages = {${ref.pages}}`);
      if (ref.isbn) fields.push(`  isbn = {${ref.isbn}}`);
      if (ref.doi) fields.push(`  doi = {${ref.doi}}`);
      if (ref.keywords && ref.keywords.length > 0) fields.push(`  keywords = {${ref.keywords.join(', ')}}`);
      if (ref.fullCitation) fields.push(`  note = {${ref.fullCitation.replace(/[\n\r]/g, ' ')}}`);

      return `@${entryType}{${citeKey},\n${fields.join(',\n')}\n}`;
    })
    .join('\n\n');
}

/**
 * Generates RIS format for Zotero, EndNote, Mendeley
 */
export function exportToRIS(references: Reference[]): string {
  return references
    .map((ref) => {
      let risType = 'BOOK';
      if (ref.referenceType.includes('مقالة')) risType = 'JOUR';
      else if (ref.referenceType.includes('أطروحة') || ref.referenceType.includes('رسالة')) risType = 'THES';
      else if (ref.referenceType.includes('مؤتمر')) risType = 'CONF';

      const lines: string[] = [];
      lines.push(`TY  - ${risType}`);
      lines.push(`TI  - ${ref.title}`);
      lines.push(`AU  - ${ref.authorFullName || `${ref.authorFamilyName}, ${ref.authorFirstName}`}`);
      if (ref.publicationYear) lines.push(`PY  - ${ref.publicationYear}///`);
      if (ref.publisher) lines.push(`PB  - ${ref.publisher}`);
      if (ref.publicationPlace) lines.push(`CY  - ${ref.publicationPlace}`);
      if (ref.volume) lines.push(`VL  - ${ref.volume}`);
      if (ref.edition) lines.push(`ET  - ${ref.edition}`);
      if (ref.pages) lines.push(`SP  - ${ref.pages}`);
      if (ref.isbn) lines.push(`SN  - ${ref.isbn}`);
      if (ref.doi) lines.push(`DO  - ${ref.doi}`);
      if (ref.keywords) {
        ref.keywords.forEach((kw) => lines.push(`KW  - ${kw}`));
      }
      lines.push(`N1  - ${ref.fullCitation}`);
      lines.push('ER  - ');
      return lines.join('\n');
    })
    .join('\n\n');
}

export const exportToRis = exportToRIS;

/**
 * Generates formatted academic bibliography with alphabetical section headers (e.g. A, B, C or أ، ب، ت)
 */
export function generateThesisBibliography(references: Reference[], separateLanguages = true): string {
  const active = references.filter((r) => !r.inTrash);

  if (separateLanguages) {
    const arabic = active.filter((r) => r.language === 'العربية');
    const foreign = active.filter((r) => r.language !== 'العربية');

    const lines: string[] = [];
    lines.push('==================================================');
    lines.push('قائمة المصادر والمراجع لرسالة الماجستير / الدكتوراه');
    lines.push('==================================================\n');

    lines.push('أولاً: المصادر والمراجع العربية والمعربة:\n');
    formatGroupedList(arabic, lines);

    lines.push('\n==================================================');
    lines.push('ثانياً: المصادر والمراجع باللغات الأجنبية (Foreign References):\n');
    formatGroupedList(foreign, lines);

    return lines.join('\n');
  }

  const lines: string[] = [];
  lines.push('==================================================');
  lines.push('قائمة المصادر والمراجع الأكاديمية (مرتبة ألفبائيًا)');
  lines.push('==================================================\n');
  formatGroupedList(active, lines);
  return lines.join('\n');
}

function formatGroupedList(refs: Reference[], lines: string[]) {
  const sorted = sortReferences(refs, 'author', 'asc');
  let currentLetter = '';

  for (const ref of sorted) {
    const letter = ref.alphabetKey || '#';
    if (letter !== currentLetter) {
      currentLetter = letter;
      lines.push(`\n--- [ ${currentLetter} ] ---`);
    }
    const citation = ref.fullCitation || `${ref.authorFullName || ref.authorFamilyName}: ${ref.title}.`;
    lines.push(`• ${citation}`);
  }
}

export const generateThesisBibliographyText = generateThesisBibliography;

/**
 * Helper to download raw text or json as file
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
