import { Reference } from '../types';
import { stripHonorificTitles } from './alphabet';

export type DuplicateMatchType = 
  | 'isbn'
  | 'doi'
  | 'exact_title_and_author'
  | 'full_citation'
  | 'exact_title_and_year'
  | 'identical_title';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedReference?: Reference;
  matchType?: DuplicateMatchType;
  matchReason?: string;
  detailsMessage?: string;
  isInTrash?: boolean;
}

export interface ReferenceCandidate {
  id?: string;
  title: string;
  authorFullName?: string;
  authorFamilyName?: string;
  authorFirstName?: string;
  publicationYear?: string;
  publisher?: string;
  isbn?: string;
  doi?: string;
  fullCitation?: string;
}

/**
 * Aggressively normalizes text for reliable academic duplicate comparison
 * - Strips Arabic diacritics (tashkeel)
 * - Normalizes Arabic Alef (أ, إ, آ, ء, ٱ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Ya / Alif Maqsura (ى -> ي)
 * - Normalizes Kaf (ک -> ك)
 * - Removes accents from Latin letters
 * - Strips all punctuation and spaces
 * - Strips academic and honorific titles
 */
export function normalizeForDuplicateComparison(text: string): string {
  if (!text) return '';
  let s = text.trim().toLowerCase();

  // Strip academic / honorific titles (دكتور، شيخ، د.، إلخ)
  s = stripHonorificTitles(s);

  // Remove Arabic diacritics (tashkeel: fat-ha, damma, kasra, tanween, sukoon, shaddah)
  s = s.replace(/[\u064B-\u065F\u0670]/g, '');

  // Normalize Arabic Alefs
  s = s.replace(/[أإآءٱ]/g, 'ا');

  // Normalize Arabic Taa Marbuta
  s = s.replace(/ة/g, 'ه');

  // Normalize Arabic Ya
  s = s.replace(/ى/g, 'ي');

  // Normalize Persian/Kurdish Kaf
  s = s.replace(/ک/g, 'ك');

  // Normalize Latin ligatures & accents (e.g. é -> e, ü -> u)
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Strip punctuation and special symbols
  s = s.replace(/[.,/#!$%^&*;:{}=\-_`~()'"«»“”?؟![\]\\|<>+،؛]/g, ' ');

  // Collapse multiple spaces into single space
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Normalizes title specifically for duplicate detection:
 * Strips leading definite articles (الـ / the / a / an) and compacts spaces.
 */
export function normalizeTitleCompact(title: string): string {
  let s = normalizeForDuplicateComparison(title);
  if (!s) return '';

  // Strip leading Arabic definite article if text is longer than 4 chars
  if (s.startsWith('ال ') && s.length > 4) {
    s = s.slice(3).trim();
  } else if (s.startsWith('ال') && s.length > 4) {
    s = s.slice(2).trim();
  }

  // Strip leading English articles
  if (s.startsWith('the ') && s.length > 5) {
    s = s.slice(4).trim();
  } else if (s.startsWith('a ') && s.length > 3) {
    s = s.slice(2).trim();
  } else if (s.startsWith('an ') && s.length > 4) {
    s = s.slice(3).trim();
  }

  // Strip remaining spaces and symbols for ultra-strict compact string matching
  return s.replace(/\s+/g, '');
}

/**
 * Normalizes author name for compact matching
 */
export function normalizeAuthorCompact(author: string): string {
  const s = normalizeForDuplicateComparison(author);
  return s.replace(/\s+/g, '');
}

/**
 * Extracts clean digits and 'X' from ISBN
 */
export function cleanIsbn(isbn?: string): string {
  if (!isbn) return '';
  return isbn.toUpperCase().replace(/[^0-9X]/g, '');
}

/**
 * Cleans DOI string
 */
export function cleanDoi(doi?: string): string {
  if (!doi) return '';
  return doi.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
}

/**
 * Checks if candidate reference duplicates any existing reference in the library.
 * Returns detailed diagnostic information and matched reference if duplicate found.
 */
export function checkReferenceDuplicate(
  candidate: ReferenceCandidate,
  existingReferences: Reference[],
  currentEditingId?: string | null
): DuplicateCheckResult {
  if (!existingReferences || existingReferences.length === 0) {
    return { isDuplicate: false };
  }

  const candTitle = candidate.title?.trim();
  const candCompactTitle = normalizeTitleCompact(candTitle || '');
  const candIsbn = cleanIsbn(candidate.isbn);
  const candDoi = cleanDoi(candidate.doi);
  const candFullCitationCompact = candidate.fullCitation 
    ? normalizeForDuplicateComparison(candidate.fullCitation).replace(/\s+/g, '') 
    : '';

  const candAuthors = [
    candidate.authorFamilyName,
    candidate.authorFullName,
    candidate.authorFirstName
  ].filter(Boolean).map(a => normalizeAuthorCompact(a!));

  const candYear = candidate.publicationYear ? candidate.publicationYear.replace(/[^0-9]/g, '') : '';

  for (const exist of existingReferences) {
    // Skip if it's the exact same reference being edited
    if (currentEditingId && exist.id === currentEditingId) {
      continue;
    }
    if (candidate.id && exist.id === candidate.id) {
      continue;
    }

    const isInTrash = Boolean(exist.inTrash);

    // 1. Check ISBN match (if both provide valid ISBN of at least 8 chars)
    if (candIsbn && candIsbn.length >= 8) {
      const existIsbn = cleanIsbn(exist.isbn);
      if (existIsbn && existIsbn === candIsbn) {
        return {
          isDuplicate: true,
          matchedReference: exist,
          matchType: 'isbn',
          matchReason: 'تطابق الترقيم الدولي الموحد للكتاب (ISBN)',
          detailsMessage: `تم العثور على مرجع مسجل مسبقاً بنفس رقم ISBN (${exist.isbn}): "${exist.title}" للمؤلف ${exist.authorFullName || exist.authorFamilyName || 'غير محدد'}.`,
          isInTrash
        };
      }
    }

    // 2. Check DOI match
    if (candDoi && candDoi.length >= 5) {
      const existDoi = cleanDoi(exist.doi);
      if (existDoi && existDoi === candDoi) {
        return {
          isDuplicate: true,
          matchedReference: exist,
          matchType: 'doi',
          matchReason: 'تطابق المعرف الرقمي الدولي (DOI)',
          detailsMessage: `تم العثور على مرجع مسجل مسبقاً بنفس معرف DOI (${exist.doi}): "${exist.title}" للمؤلف ${exist.authorFullName || exist.authorFamilyName || 'غير محدد'}.`,
          isInTrash
        };
      }
    }

    // 3. Check Full Citation match (if substantial, > 25 characters)
    if (candFullCitationCompact.length > 25) {
      const existFullCitCompact = exist.fullCitation 
        ? normalizeForDuplicateComparison(exist.fullCitation).replace(/\s+/g, '') 
        : '';
      if (existFullCitCompact && existFullCitCompact === candFullCitationCompact) {
        return {
          isDuplicate: true,
          matchedReference: exist,
          matchType: 'full_citation',
          matchReason: 'تطابق نص التوثيق الكامل للمرجع تماماً',
          detailsMessage: `تم العثور على مرجع مسجل مسبقاً بنفس صيغة التوثيق الكاملة: "${exist.title}" للمؤلف ${exist.authorFullName || exist.authorFamilyName || 'غير محدد'}.`,
          isInTrash
        };
      }
    }

    // 4. Check Title and Author Match
    if (candCompactTitle && candCompactTitle.length >= 3) {
      const existCompactTitle = normalizeTitleCompact(exist.title || '');

      if (existCompactTitle && candCompactTitle === existCompactTitle) {
        // Titles match! Now inspect author or year
        const existAuthors = [
          exist.authorFamilyName,
          exist.authorFullName,
          exist.authorFirstName
        ].filter(Boolean).map(a => normalizeAuthorCompact(a!));

        // Check if authors match
        let authorMatched = false;
        if (candAuthors.length > 0 && existAuthors.length > 0) {
          for (const ca of candAuthors) {
            if (ca.length < 2) continue;
            for (const ea of existAuthors) {
              if (ea.length < 2) continue;
              if (ca === ea || ca.includes(ea) || ea.includes(ca)) {
                authorMatched = true;
                break;
              }
            }
            if (authorMatched) break;
          }
        }

        const existYear = exist.publicationYear ? exist.publicationYear.replace(/[^0-9]/g, '') : '';
        const yearMatched = Boolean(candYear && existYear && candYear === existYear);

        if (authorMatched) {
          return {
            isDuplicate: true,
            matchedReference: exist,
            matchType: 'exact_title_and_author',
            matchReason: 'تطابق عنوان الكتاب واسم المؤلف',
            detailsMessage: `المرجع مسجل بالفعل في المكتبة بعنوان: "${exist.title}" للمؤلف: "${exist.authorFullName || exist.authorFamilyName}"${exist.publicationYear ? ` (${exist.publicationYear})` : ''}.`,
            isInTrash
          };
        }

        // If neither candidate nor existing has authors, but year matches or title is distinctively long (>= 10 chars)
        if (candAuthors.length === 0 || existAuthors.length === 0) {
          if (yearMatched || candCompactTitle.length >= 10) {
            return {
              isDuplicate: true,
              matchedReference: exist,
              matchType: yearMatched ? 'exact_title_and_year' : 'identical_title',
              matchReason: yearMatched ? 'تطابق عنوان الكتاب وسنة النشر' : 'تطابق عنوان الكتاب بالكامل',
              detailsMessage: `يوجد مرجع مسجل بالفعل بنفس هذا العنوان في المكتبة: "${exist.title}"${exist.authorFullName ? ` للمؤلف: ${exist.authorFullName}` : ''}${exist.publicationYear ? ` (${exist.publicationYear})` : ''}.`,
              isInTrash
            };
          }
        }

        // If year matches and title matches exactly
        if (yearMatched) {
          return {
            isDuplicate: true,
            matchedReference: exist,
            matchType: 'exact_title_and_year',
            matchReason: 'تطابق عنوان الكتاب وسنة النشر',
            detailsMessage: `تم العثور على مرجع مسجل بنفس العنوان وسنة النشر (${exist.publicationYear}): "${exist.title}".`,
            isInTrash
          };
        }

        // If title is distinctively long (>= 15 chars) and matches identically
        if (candCompactTitle.length >= 15) {
          return {
            isDuplicate: true,
            matchedReference: exist,
            matchType: 'identical_title',
            matchReason: 'تطابق تام لعنوان المرجع الأكاديمي',
            detailsMessage: `هذا العنوان مسجل مسبقاً في مكتبتك: "${exist.title}" للمؤلف: ${exist.authorFullName || exist.authorFamilyName || 'غير محدد'}.`,
            isInTrash
          };
        }
      }
    }
  }

  return { isDuplicate: false };
}
