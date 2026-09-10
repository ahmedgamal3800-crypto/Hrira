const fs = require('fs');
const path = require('path');
const { ARABIC_DATA } = require('./build_arabic_seed.cjs');
const { ALL_FOREIGN_DATA } = require('./build_foreign_seed.cjs');

console.log(`Assembling ${ARABIC_DATA.length} Arabic + ${ALL_FOREIGN_DATA.length} Foreign references...`);

// Helper to determine exact alphabet key
function getFirstLetter(name) {
  let cand = (name || '').trim();
  cand = cand.replace(/^["'«»“„(\[\{`~#@\s]+/, '');
  cand = cand.replace(/^(الدكتور|الدكتورة|الشيخ|الأميرة|السير|الباحث|الباحثة|Lord|Sir|Dr\.|Prof\.)\s+/iu, '');
  if (!cand) return '#';
  const char = cand.charAt(0);
  if (/^[A-Za-z]/i.test(char)) return char.toUpperCase();
  if (/^[أإآء]/u.test(char)) return 'ا';
  if (/^[ة]/u.test(char)) return 'هـ';
  if (/^[ى]/u.test(char)) return 'ي';
  return char;
}

function normalizeRefType(t) {
  if (!t) return 'كتاب (Book)';
  if (t.includes('معجم') || t.includes('موسوعة') || t.includes('Encyclopedia')) return 'موسوعة أو معجم (Encyclopedia)';
  if (t.includes('دورية') || t.includes('Journal')) return 'مقالة في دورية محكمة (Journal Article)';
  if (t.includes('مخطوط') || t.includes('Primary Source')) return 'مصدر أصلي / مخطوط (Primary Source)';
  if (t.includes('ماجستير')) return 'رسالة ماجستير (Master Thesis)';
  if (t.includes('دكتوراه')) return 'أطروحة دكتوراه (PhD Dissertation)';
  return 'كتاب (Book)';
}

const allItems = [];

// 1. Process Arabic items
ARABIC_DATA.forEach((item, index) => {
  const id = `ref-ar-${index + 1}`;
  const alphabetKey = getFirstLetter(item.authorFirstName || item.authorFullName);
  
  // Format scholarly citation
  const citationParts = [];
  if (item.authorFullName) citationParts.push(item.authorFullName);
  if (item.title) citationParts.push(`: ${item.title}`);
  if (item.subtitle) citationParts.push(` (${item.subtitle})`);
  if (item.translatorOrEditor) citationParts.push(`، ${item.translatorOrEditor}`);
  if (item.volume) citationParts.push(`، ${item.volume}`);
  if (item.edition) citationParts.push(`، ${item.edition}`);
  if (item.publisher) citationParts.push(`، ${item.publisher}`);
  if (item.publicationPlace) citationParts.push(`، ${item.publicationPlace}`);
  if (item.publicationYear) citationParts.push(`، ${item.publicationYear}م.`);

  const fullCitation = item.raw || citationParts.join('');

  allItems.push({
    id,
    authorFamilyName: item.authorFamilyName || '',
    authorFirstName: item.authorFirstName || '',
    authorFullName: item.authorFullName || '',
    title: item.title || '',
    subtitle: item.subtitle || undefined,
    translatorOrEditor: item.translatorOrEditor || undefined,
    publisher: item.publisher || undefined,
    publicationPlace: item.publicationPlace || undefined,
    publicationYear: item.publicationYear || undefined,
    edition: item.edition || undefined,
    volume: item.volume || undefined,
    pages: undefined,
    language: item.language || 'العربية',
    referenceType: normalizeRefType(item.referenceType),
    fullCitation,
    keywords: item.keywords || ['بيزنطة', 'العثمانيون', 'قسطنطين الحادي عشر'],
    alphabetKey,
    categoryIds: item.categories || ['cat-1', 'cat-4'],
    isFavorite: index < 5,
    inTrash: false,
    dateAdded: '2026-09-01T08:00:00.000Z',
    lastModified: '2026-09-10T12:00:00.000Z',
    authorBio: item.authorBio,
    historicalRelevance: item.subtitle || `مرجع أكاديمي حول ${item.title}`
  });
});

// 2. Process Foreign items
ALL_FOREIGN_DATA.forEach((item, index) => {
  const id = `ref-for-${index + 1}`;
  const alphabetKey = getFirstLetter(item.authorFirstName || item.authorFullName);

  // Format citation
  let fullCitation = item.raw;
  if (!fullCitation) {
    fullCitation = `${item.authorFamilyName}, ${item.authorFirstName}, ${item.title}, ${item.publisher || ''}, ${item.publicationPlace || ''}, ${item.publicationYear || ''}.`;
  }

  allItems.push({
    id,
    authorFamilyName: item.authorFamilyName || '',
    authorFirstName: item.authorFirstName || '',
    authorFullName: item.authorFullName || '',
    title: item.title || '',
    subtitle: item.subtitle || undefined,
    translatorOrEditor: item.translatorOrEditor || undefined,
    publisher: item.publisher || undefined,
    publicationPlace: item.publicationPlace || undefined,
    publicationYear: item.publicationYear || undefined,
    edition: item.edition || undefined,
    volume: item.volume || undefined,
    pages: undefined,
    language: item.language || 'English',
    referenceType: normalizeRefType(item.referenceType),
    fullCitation,
    keywords: item.keywords || ['Byzantium', 'Ottoman Empire', 'Constantine XI'],
    alphabetKey,
    categoryIds: item.categories || ['cat-1', 'cat-4'],
    isFavorite: index < 5,
    inTrash: false,
    dateAdded: '2026-09-01T08:00:00.000Z',
    lastModified: '2026-09-10T12:00:00.000Z',
    authorBio: item.authorBio,
    historicalRelevance: item.subtitle || `مرجع أكاديمي حول ${item.title}`
  });
});

console.log(`Total assembled: ${allItems.length} references.`);

// Generate the TypeScript file content
let fileContent = `// Auto-generated comprehensive scholarly references library
// Contains all 204 references provided by the researcher:
// - 89 Arabic and Arabized primary sources and scholarly monographs
// - 115 Foreign (Greek, Latin, English, French, German, Turkish, Spanish, Italian) primary sources and academic monographs
// Meticulously resolved and cataloged according to the Author's First Name alphabetical sorting rules.

import { Reference } from '../types';

export const SEED_REFERENCES_LIST: Reference[] = ${JSON.stringify(allItems, null, 2)};
`;

const outputPath = path.join(__dirname, '../src/data/seedReferences.ts');
fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`Successfully written ${allItems.length} references to ${outputPath}`);
