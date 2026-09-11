import { Reference } from '../types';

/**
 * Normalizes Arabic text for flexible scholarly searching:
 * - Removes tashkeel (diacritics)
 * - Normalizes Alef forms (أ، إ، آ، ء -> ا)
 * - Normalizes Yaa (ى -> ي)
 * - Normalizes Taa Marbouta (ة -> ه)
 * - Removes punctuation and excess spaces
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    // Remove Arabic diacritics (harakat / tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alef variations
    .replace(/[أإآء]/g, 'ا')
    // Normalize Yaa
    .replace(/ى/g, 'ي')
    // Normalize Taa Marbouta
    .replace(/ة/g, 'ه')
    // Replace punctuation with space for token matching
    .replace(/[\.,:;!؟،()\[\]{}"'«»\-–—_\/\\#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Common scholarly transliteration equivalencies between Arabic and Latin names
 * to facilitate bidirectional discovery.
 */
const SCHOLAR_TRANSLITERATION_MAP: Record<string, string[]> = {
  // William Miller
  'ميلر': ['miller'],
  'miller': ['ميلر'],
  'ويليام': ['william', 'وليم'],
  'وليم': ['william', 'ويليام'],
  'william': ['ويليام', 'وليم'],

  // Donald Nicol
  'نيكول': ['nicol'],
  'nicol': ['نيكول'],
  'دونالد': ['donald'],
  'donald': ['دونالد'],

  // Steven Runciman
  'رنسيمان': ['runciman', 'رانسمان'],
  'رانسمان': ['runciman', 'رنسيمان'],
  'runciman': ['رنسيمان', 'رانسمان'],
  'ستيفن': ['steven', 'stephen'],
  'steven': ['ستيفن'],

  // George Akropolites
  'أكروبوليتس': ['akropolites', 'اكروبوليتس'],
  'اكروبوليتس': ['akropolites', 'أكروبوليتس'],
  'akropolites': ['أكروبوليتس', 'اكروبوليتس'],
  'جورج': ['george'],
  'george': ['جورج'],

  // George Sphrantzes
  'سفرانتزيس': ['sphrantzes', 'سفرانتسيس'],
  'sphrantzes': ['سفرانتزيس', 'سفرانتسيس'],

  // George Pachymeres
  'باخيميريس': ['pachymeres', 'باكيميريس'],
  'pachymeres': ['باخيميريس', 'باكيميريس'],

  // George Ostrogorsky
  'أوستروجورسكي': ['ostrogorsky', 'اوستروجورسكي'],
  'اوستروجورسكي': ['ostrogorsky', 'أوستروجورسكي'],
  'ostrogorsky': ['أوستروجورسكي', 'اوستروجورسكي'],

  // Angelov
  'أنجيلوف': ['angelov', 'انجيلوف'],
  'انجيلوف': ['angelov', 'أنجيلوف'],
  'angelov': ['أنجيلوف', 'انجيلوف'],

  // Moreno Echevarria
  'مورينو': ['moreno'],
  'moreno': ['مورينو'],
  'إتشيفاريا': ['echevarria', 'اتشيفاريا', 'echevarría'],
  'echevarria': ['مورينو', 'إتشيفاريا']
};

/**
 * Expands search query tokens with known transliterations
 */
export function expandSearchTokens(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens);
  for (const token of tokens) {
    const norm = normalizeSearchText(token);
    if (SCHOLAR_TRANSLITERATION_MAP[norm]) {
      SCHOLAR_TRANSLITERATION_MAP[norm].forEach(t => expanded.add(t));
    }
    // Also check direct match in map
    if (SCHOLAR_TRANSLITERATION_MAP[token.toLowerCase()]) {
      SCHOLAR_TRANSLITERATION_MAP[token.toLowerCase()].forEach(t => expanded.add(t));
    }
  }
  return Array.from(expanded);
}

/**
 * Unified scholarly reference search:
 * Matches against:
 * 1. اسم الكتاب (Book Title & Subtitle)
 * 2. اسم المؤلف / الأب (Author First/Given Name)
 * 3. اسم الجد / العائلة (Author Family Name / Surname)
 * 4. اسم المؤلف الكامل (Full Author Name عربي ولاتيني)
 * 5. صيغة التوثيق المعتمدة (Full Citation)
 * 6. سنة ومكان النشر والناشر وأرقام الصفحات
 * 7. الكلمات المفتاحية والملاحظات
 */
export function matchesReferenceSearch(ref: Reference, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;

  const cleanQuery = normalizeSearchText(rawQuery);
  if (!cleanQuery) return true;

  // Split query into distinct search terms
  const terms = cleanQuery.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  // Build searchable corpus from all reference metadata
  const searchableCorpus = [
    // 1. اسم الكتاب والعنوان الفرعي
    ref.title,
    ref.subtitle,
    // 2. اسم المؤلف الأول / الأب
    ref.authorFirstName,
    // 3. اسم الجد / العائلة
    ref.authorFamilyName,
    // 4. اسم المؤلف كاملاً
    ref.authorFullName,
    // 5. نص التوثيق المعتمد
    ref.fullCitation,
    // 6. المحقق والمترجم
    ref.translatorOrEditor,
    // 7. دار النشر ومكان النشر وسنة النشر والصفحات
    ref.publisher,
    ref.publicationPlace,
    ref.publicationYear,
    ref.pages,
    ref.edition,
    ref.volume,
    // 8. الكلمات المفتاحية
    ...(ref.keywords || []),
    // 9. التصنيف والملاحظات
    ref.referenceType,
    ref.historicalRelevance,
    ref.authorBio,
    (ref as any).note
  ]
    .filter(Boolean)
    .map(val => normalizeSearchText(String(val)))
    .join(' ');

  // For multi-token queries, verify that EVERY term (or its transliterated equivalent) matches the corpus
  return terms.every(term => {
    // Direct substring match
    if (searchableCorpus.includes(term)) return true;

    // Transliteration / equivalent token match
    const equivalents = SCHOLAR_TRANSLITERATION_MAP[term] || [];
    for (const eq of equivalents) {
      if (searchableCorpus.includes(normalizeSearchText(eq))) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Highlights matches in text
 */
export function getSearchMatchSummary(ref: Reference, rawQuery: string): {
  matchedInTitle: boolean;
  matchedInAuthorFirst: boolean;
  matchedInAuthorFamily: boolean;
  matchedInCitation: boolean;
} {
  const normQ = normalizeSearchText(rawQuery);
  if (!normQ) {
    return { matchedInTitle: false, matchedInAuthorFirst: false, matchedInAuthorFamily: false, matchedInCitation: false };
  }

  const terms = normQ.split(/\s+/).filter(Boolean);
  const normTitle = normalizeSearchText(`${ref.title} ${ref.subtitle || ''}`);
  const normFirst = normalizeSearchText(ref.authorFirstName);
  const normFamily = normalizeSearchText(ref.authorFamilyName);
  const normCitation = normalizeSearchText(ref.fullCitation);

  return {
    matchedInTitle: terms.some(t => normTitle.includes(t)),
    matchedInAuthorFirst: terms.some(t => normFirst.includes(t)),
    matchedInAuthorFamily: terms.some(t => normFamily.includes(t)),
    matchedInCitation: terms.some(t => normCitation.includes(t))
  };
}
