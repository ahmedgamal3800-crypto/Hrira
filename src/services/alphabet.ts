import { Reference, SortRule } from '../types';

export const ARABIC_LETTERS = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 
  'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
];

export const LATIN_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

/**
 * Normalizes Arabic characters (e.g. أ إ آ -> ا, ة -> ه)
 */
export function normalizeArabicChar(char: string): string {
  if (!char) return '';
  const c = char.trim();
  if (/^[أإآء]/u.test(c)) return 'ا';
  if (/^[ة]/u.test(c)) return 'هـ';
  if (/^[ى]/u.test(c)) return 'ي';
  return c;
}

/**
 * Cleans text from leading punctuation, quotes, or brackets
 */
export function cleanLeadingSymbols(text: string): string {
  if (!text) return '';
  return text.trim().replace(/^["'«»“„(\[\{`~#@\s]+/, '');
}

/**
 * Normalizes a book title for canonical Arabic alphabetical sorting
 * - Strips leading punctuation and quotes
 * - Strips Arabic diacritics (tashkeel)
 * - Strips 'ال' if followed by at least 2 chars (when stripArticle is true)
 * - Normalizes alefs (أ، إ، آ -> ا)
 * - Normalizes teh marbuta (ة -> ه)
 * - Normalizes alef maqsura (ى -> ي)
 */
export function getCanonicalBookSortKey(title: string, stripArticle = true): string {
  let text = cleanLeadingSymbols(title || '').trim();
  // Strip Arabic diacritics (tashkeel)
  text = text.replace(/[\u064B-\u065F\u0670]/g, '');

  if (stripArticle && text.startsWith('ال') && text.length > 2) {
    text = text.slice(2).trim();
  }

  // Normalize alef variants
  text = text.replace(/^[أإآء]/, 'ا');
  return text;
}

/**
 * Gets the accredited letter for a book title based on standard Arabic library rules
 */
export function getCanonicalBookLetter(title: string, stripArticle = true): string {
  const sortKey = getCanonicalBookSortKey(title, stripArticle);
  if (!sortKey) return '#';

  const firstChar = sortKey.charAt(0);
  if (/^[A-Za-z]/i.test(firstChar)) {
    return firstChar.toUpperCase();
  }
  if (/^[\u0600-\u06FF]/u.test(firstChar)) {
    const norm = normalizeArabicChar(firstChar);
    return ARABIC_LETTERS.includes(norm) ? norm : (norm || '#');
  }
  return '#';
}

/**
 * Compares two letters according to the accredited Arabic then Latin alphabetical sequence
 */
export function compareCanonicalLetters(letA: string, letB: string): number {
  const idxA = ARABIC_LETTERS.indexOf(letA);
  const idxB = ARABIC_LETTERS.indexOf(letB);

  // Both are Arabic letters
  if (idxA !== -1 && idxB !== -1) {
    return idxA - idxB;
  }
  // A is Arabic, B is not -> Arabic first
  if (idxA !== -1 && idxB === -1) return -1;
  // B is Arabic, A is not -> Arabic first
  if (idxA === -1 && idxB !== -1) return 1;

  // Both are Latin
  const isLatA = /^[A-Z]$/i.test(letA);
  const isLatB = /^[A-Z]$/i.test(letB);
  if (isLatA && isLatB) {
    return letA.localeCompare(letB, 'en');
  }
  if (isLatA && !isLatB) return -1;
  if (!isLatA && isLatB) return 1;

  return letA.localeCompare(letB);
}

/**
 * Normalizes author first name for canonical alphabetical sorting:
 * Priority: authorFirstName -> authorFullName -> authorFamilyName -> title (fallback)
 * Normalizes Alefs, removes tashkeel, handles leading symbols and optional 'ال'.
 */
export function getAuthorFirstNameSortKey(ref: Partial<Reference>, ignoreArabicArticle = false): string {
  let name = '';
  if (ref.authorFirstName && ref.authorFirstName.trim()) {
    const first = ref.authorFirstName.trim();
    const family = ref.authorFamilyName ? ref.authorFamilyName.trim() : '';
    name = family ? `${first} ${family}` : first;
  } else if (ref.authorFullName && ref.authorFullName.trim()) {
    name = ref.authorFullName.trim();
  } else if (ref.authorFamilyName && ref.authorFamilyName.trim()) {
    name = ref.authorFamilyName.trim();
  } else if (ref.title && ref.title.trim()) {
    name = ref.title.trim();
  }

  name = cleanLeadingSymbols(name);
  // Strip Arabic diacritics (tashkeel)
  name = name.replace(/[\u064B-\u065F\u0670]/g, '');

  if (ignoreArabicArticle && name.startsWith('ال') && name.length > 2) {
    name = name.slice(2).trim();
  }

  // Normalize alef variants at start (أ، إ، آ، ء -> ا)
  name = name.replace(/^[أإآء]/, 'ا');
  return name;
}

/**
 * Gets the alphabetical letter based on author's FIRST name
 * (الترتيب الأبجدي بأول اسم المؤلف وليس اسم الكتاب)
 */
export function getAuthorFirstNameLetter(ref: Partial<Reference>, ignoreArabicArticle = false): string {
  const sortKey = getAuthorFirstNameSortKey(ref, ignoreArabicArticle);
  if (!sortKey) return '#';

  const firstChar = sortKey.charAt(0);

  // Check if Latin letter
  if (/^[A-Za-z]/i.test(firstChar)) {
    return firstChar.toUpperCase();
  }

  // Check if Arabic letter
  if (/^[\u0600-\u06FF]/u.test(firstChar)) {
    const norm = normalizeArabicChar(firstChar);
    return ARABIC_LETTERS.includes(norm) ? norm : (norm || '#');
  }

  return '#';
}

/**
 * Derives the alphabetical key for a reference based on author's first name
 * (الترتيب الأبجدي بأول اسم المؤلف)
 */
export function getAlphabetKey(ref: Partial<Reference>, ignoreArabicArticle = false): string {
  return getAuthorFirstNameLetter(ref, ignoreArabicArticle);
}

/**
 * Derives the alphabetical key specifically for a book/reference title
 */
export function getBookTitleAlphabetKey(title: string, ignoreArabicArticle = true): string {
  let candidate = cleanLeadingSymbols(title || '').trim();
  if (!candidate) return '#';

  if (ignoreArabicArticle && candidate.startsWith('ال') && candidate.length > 2) {
    candidate = candidate.slice(2).trim();
  }

  const firstChar = candidate.charAt(0);

  if (/^[A-Za-z]/i.test(firstChar)) {
    return firstChar.toUpperCase();
  }

  if (/^[\u0600-\u06FF]/u.test(firstChar)) {
    const norm = normalizeArabicChar(firstChar);
    return norm || '#';
  }

  return '#';
}

/**
 * Sorts references based on user-chosen rule
 */
export function sortReferences(
  references: Reference[],
  rule: SortRule = 'author',
  direction: 'asc' | 'desc' = 'asc',
  ignoreArabicArticle = false
): Reference[] {
  const sorted = [...references].sort((a, b) => {
    let valA = '';
    let valB = '';

    switch (rule) {
      case 'author': {
        // Author: Sorted by author's first name (بأول اسم المؤلف)
        valA = getAuthorFirstNameSortKey(a, ignoreArabicArticle);
        valB = getAuthorFirstNameSortKey(b, ignoreArabicArticle);
        break;
      }
      case 'title': {
        valA = cleanLeadingSymbols(a.title);
        valB = cleanLeadingSymbols(b.title);
        if (ignoreArabicArticle) {
          if (valA.startsWith('ال')) valA = valA.slice(2);
          if (valB.startsWith('ال')) valB = valB.slice(2);
        }
        valA = valA.replace(/^[أإآء]/, 'ا');
        valB = valB.replace(/^[أإآء]/, 'ا');
        break;
      }
      case 'year': {
        valA = a.publicationYear || '0000';
        valB = b.publicationYear || '0000';
        break;
      }
      case 'dateAdded': {
        valA = a.dateAdded || '';
        valB = b.dateAdded || '';
        break;
      }
      case 'type': {
        valA = a.referenceType || '';
        valB = b.referenceType || '';
        break;
      }
    }

    // Locale-aware comparison supporting Arabic & English
    const cmp = valA.localeCompare(valB, ['ar', 'en'], { sensitivity: 'base', numeric: true });
    return direction === 'asc' ? cmp : -cmp;
  });

  return sorted;
}

/**
 * Groups sorted references by their Alphabetical Key
 */
export function groupReferencesByLetter(references: Reference[]): Record<string, Reference[]> {
  const groups: Record<string, Reference[]> = {};

  for (const ref of references) {
    const key = ref.alphabetKey || getAlphabetKey(ref);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(ref);
  }

  return groups;
}
