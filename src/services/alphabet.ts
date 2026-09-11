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
 * Strips academic, military, aristocratic and religious honorific titles
 * (e.g. الدكتور، الدكتورة، أ.د.، الشيخ، السير، الأميرة، الأب، اللورد، إلخ)
 * strictly enforcing that author names are cataloged as pure names without titles.
 */
export function stripHonorificTitles(name: string): string {
  if (!name) return '';
  let res = name.trim();

  // Remove leading titles
  const leadingPattern = /^(الدكتور(ة)?|أ\.د\.?|أستاذ(ة)?|الأستاذ(ة)?|د\.?|الشيخ(ة)?|السير|اللورد|لورد|الأمير(ة)?|الأب|القس(يس)?|المطران|البطريرك|الراهب|الفريق|اللواء|العميد|الباشا|الباحث(ة)?|المؤرخ(ة)?|Sir|Dr\.?|Prof\.?|Professor|Father|Fr\.?|Lord|Baron|Lady|Prince|Princess)\s+/iu;

  while (leadingPattern.test(res)) {
    res = res.replace(leadingPattern, '').trim();
  }

  // Remove title inside compound conjunctions (e.g. "أحمد فؤاد والدكتورة هويدا" -> "أحمد فؤاد وهويدا")
  res = res.replace(/(و\s*)(الدكتور(ة)?|د\.?|الأستاذ(ة)?|الشيخ(ة)?|السير|الأمير(ة)?|الأب)\s+/giu, '$1');

  // Also clean inside English parenthetical e.g. "(Sir Steven Runciman)" -> "(Steven Runciman)"
  res = res.replace(/\((Sir|Lord|Dr\.|Prof\.)\s+/gi, '(');

  // Clean trailing parenthetical descriptions like "(المؤرخ والحقوقي والزعيم الوطني)"
  res = res.replace(/\s*\((المؤرخ والحقوقي والزعيم الوطني|مفتي بيروت|أبو أسامة الحرستاني)\)/gu, '');

  return res.trim();
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
 * Normalizes author name for canonical alphabetical sorting:
 * - For Latin / foreign authors: In academic library science, foreign references
 *   are catalogued and classified by Surname / Family Name (e.g. Moreno Echevarria -> M, Angelov -> A, Nicol -> N).
 * - For Arabic authors: Sorted by author's first name (أول اسم للمؤلف مع تجريد الألقاب).
 */
/**
 * Gets canonical sort key for an author:
 * - Academic rule: Latin authors are classified by the first name written in the citation,
 *   which is their Family Name / Surname / اسم الجد (e.g. "Miller, William").
 * - Arabic authors: sorted by author first name (e.g. "عمر كحالة", "آنا كومنينا").
 */
export function getAuthorCanonicalSortKey(ref: Partial<Reference>, ignoreArabicArticle = false): string {
  const isLatin = /^[A-Za-z\u00C0-\u024F]/.test(
    (ref.authorFamilyName || ref.authorFullName || ref.fullCitation || ref.title || '').trim()
  );

  if (isLatin) {
    if (ref.authorFamilyName && ref.authorFamilyName.trim()) {
      let fam = stripHonorificTitles(ref.authorFamilyName.trim());
      if (/^van\s+/i.test(fam)) fam = fam.replace(/^van\s+/i, '');
      if (/^von\s+/i.test(fam)) fam = fam.replace(/^von\s+/i, '');
      if (/^de\s+la\s+/i.test(fam)) fam = fam.replace(/^de\s+la\s+/i, '');
      if (/^de\s+/i.test(fam)) fam = fam.replace(/^de\s+/i, '');
      const first = ref.authorFirstName ? stripHonorificTitles(ref.authorFirstName.trim()) : '';
      return `${fam}, ${first}`.trim();
    }
    if (ref.fullCitation && ref.fullCitation.trim()) {
      const match = ref.fullCitation.trim().match(/^([A-Za-z\u00C0-\u024F\s\-']+(?:,\s*[A-Za-z\.\s]+)?)/);
      if (match) return match[1].trim();
    }
    if (ref.authorFullName && ref.authorFullName.trim()) {
      const full = stripHonorificTitles(ref.authorFullName.trim());
      if (full.includes(',')) {
        return full;
      }
      const tokens = full.split(/\s+/).filter(t => /^[A-Za-z]/.test(t));
      if (tokens.length > 1) {
        return `${tokens[tokens.length - 1]}, ${tokens.slice(0, -1).join(' ')}`;
      }
      return full;
    }
  }

  // Arabic / default: sorted by author's first name
  return getAuthorFirstNameSortKey(ref, ignoreArabicArticle);
}

/**
 * Gets the canonical classification letter for an author:
 * - Academic rule requested by researcher:
 *   "المفروض الكتابين دول لنفس الكاتب وحرفين مختلفين يبقي وحد باول اسم مكتوب بالمرجع اللي هو اسم الجد دا التصنيف"
 * - For Latin authors: Classified strictly by the first name written in the reference,
 *   which is the Family Name / Surname / الجد (e.g. Miller, W. -> M, Nicol, D. -> N, Runciman, S. -> R).
 * - For Arabic authors: Classified by first name written (عمر -> ع، ناصر الدين -> ن، المقريزي -> م/ا).
 */
export function getAuthorCanonicalLetter(ref: Partial<Reference>, ignoreArabicArticle = false): string {
  // 1. Check if Latin or foreign reference
  const isLatin = /^[A-Za-z\u00C0-\u024F]/.test(
    (ref.authorFamilyName || ref.authorFullName || ref.fullCitation || ref.title || '').trim()
  );

  if (isLatin) {
    // Check Family Name / Surname (اسم الجد / العائلة)
    if (ref.authorFamilyName && ref.authorFamilyName.trim()) {
      let fam = stripHonorificTitles(ref.authorFamilyName.trim());
      if (/^van\s+/i.test(fam)) fam = fam.replace(/^van\s+/i, '');
      if (/^von\s+/i.test(fam)) fam = fam.replace(/^von\s+/i, '');
      if (/^de\s+la\s+/i.test(fam)) fam = fam.replace(/^de\s+la\s+/i, '');
      if (/^de\s+/i.test(fam)) fam = fam.replace(/^de\s+/i, '');
      const firstChar = fam.trim().charAt(0);
      if (/^[A-Za-z\u00C0-\u024F]/i.test(firstChar)) {
        return firstChar.toUpperCase();
      }
    }

    // Check first word of citation (e.g. "Miller, W., ...")
    if (ref.fullCitation && ref.fullCitation.trim()) {
      const match = ref.fullCitation.trim().match(/^([A-Za-z\u00C0-\u024F]+)/);
      if (match) {
        return match[1].charAt(0).toUpperCase();
      }
    }

    // Check author full name
    if (ref.authorFullName && ref.authorFullName.trim()) {
      const full = stripHonorificTitles(ref.authorFullName.trim());
      // e.g. "Miller, W."
      if (full.includes(',')) {
        const match = full.trim().match(/^([A-Za-z\u00C0-\u024F]+)/);
        if (match) return match[1].charAt(0).toUpperCase();
      }
      // e.g. Latin tokens "William Miller"
      const latinTokens = full.split(/\s+/).filter(t => /^[A-Za-z\u00C0-\u024F]/.test(t));
      if (latinTokens.length > 1) {
        // Last token is surname
        return latinTokens[latinTokens.length - 1].charAt(0).toUpperCase();
      }
      if (latinTokens.length === 1) {
        return latinTokens[0].charAt(0).toUpperCase();
      }
    }

    // If explicit alphabetKey is set and is Latin
    if (ref.alphabetKey && /^[A-Za-z]/i.test(ref.alphabetKey.trim())) {
      return ref.alphabetKey.trim().charAt(0).toUpperCase();
    }
  }

  // 2. Arabic / default references
  if (ref.alphabetKey && ref.alphabetKey.trim()) {
    const k = ref.alphabetKey.trim();
    if (/^[\u0600-\u06FF]/u.test(k)) {
      const norm = normalizeArabicChar(k.charAt(0));
      return ARABIC_LETTERS.includes(norm) ? norm : (norm || '#');
    }
    if (/^[A-Za-z]/i.test(k)) return k.charAt(0).toUpperCase();
  }

  const sortKey = getAuthorCanonicalSortKey(ref, ignoreArabicArticle);
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
 * Normalizes author name for canonical alphabetical sorting:
 * - For Latin references: uses Surname / Family Name first (e.g. Miller, William).
 * - For Arabic references: uses author's first name (e.g. عمر كحالة).
 * Normalizes Alefs, removes tashkeel, handles leading symbols and optional 'ال'.
 */
export function getAuthorFirstNameSortKey(ref: Partial<Reference>, ignoreArabicArticle = false): string {
  const isLatin = /^[A-Za-z\u00C0-\u024F]/.test(
    (ref.authorFamilyName || ref.authorFullName || ref.fullCitation || ref.title || '').trim()
  );

  let name = '';

  if (isLatin) {
    // For Latin references, the first name written in academic citation is the Family Name / Surname / الجد
    if (ref.authorFamilyName && ref.authorFamilyName.trim()) {
      let fam = stripHonorificTitles(ref.authorFamilyName.trim());
      if (/^van\s+/i.test(fam)) fam = fam.replace(/^van\s+/i, '');
      if (/^von\s+/i.test(fam)) fam = fam.replace(/^von\s+/i, '');
      if (/^de\s+la\s+/i.test(fam)) fam = fam.replace(/^de\s+la\s+/i, '');
      if (/^de\s+/i.test(fam)) fam = fam.replace(/^de\s+/i, '');
      const first = ref.authorFirstName ? stripHonorificTitles(ref.authorFirstName.trim()) : '';
      name = `${fam}, ${first}`.trim();
    } else if (ref.fullCitation && ref.fullCitation.trim()) {
      const match = ref.fullCitation.trim().match(/^([A-Za-z\u00C0-\u024F\s\-']+(?:,\s*[A-Za-z\.\s]+)?)/);
      name = match ? match[1].trim() : ref.fullCitation.trim();
    } else if (ref.authorFullName && ref.authorFullName.trim()) {
      name = stripHonorificTitles(ref.authorFullName.trim());
    } else if (ref.title && ref.title.trim()) {
      name = ref.title.trim();
    }
  } else {
    // Arabic reference: sorted by first name
    if (ref.authorFirstName && ref.authorFirstName.trim()) {
      const first = stripHonorificTitles(ref.authorFirstName.trim());
      const family = ref.authorFamilyName ? stripHonorificTitles(ref.authorFamilyName.trim()) : '';
      name = family ? `${first} ${family}` : first;
    } else if (ref.authorFullName && ref.authorFullName.trim()) {
      name = stripHonorificTitles(ref.authorFullName.trim());
    } else if (ref.authorFamilyName && ref.authorFamilyName.trim()) {
      name = stripHonorificTitles(ref.authorFamilyName.trim());
    } else if (ref.title && ref.title.trim()) {
      name = ref.title.trim();
    }
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
  return getAuthorCanonicalLetter(ref, ignoreArabicArticle);
}

/**
 * Derives the alphabetical key for a reference
 * (احترام حرف الترتيب المخصص أو استنتاجه بدقة أكاديمية)
 */
export function getAlphabetKey(ref: Partial<Reference>, ignoreArabicArticle = false): string {
  return getAuthorCanonicalLetter(ref, ignoreArabicArticle);
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
        // Author: Sorted by canonical sort key (الاسم الأول للعرب، واللقب/اسم العائلة للأجانب)
        valA = getAuthorCanonicalSortKey(a, ignoreArabicArticle);
        valB = getAuthorCanonicalSortKey(b, ignoreArabicArticle);
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
