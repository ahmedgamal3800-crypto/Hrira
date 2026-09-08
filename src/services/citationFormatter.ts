import { Reference } from '../types';

export type CitationStyle = 'traditional_arabic' | 'chicago' | 'apa' | 'mla';

/**
 * Builds a proposed academic citation string from individual fields.
 * NOTE: As strictly requested, this is ONLY generated when explicitly requested by user,
 * and the user's manual input is ALWAYS preserved.
 */
export function generateSuggestedCitation(ref: Partial<Reference>, style: CitationStyle = 'traditional_arabic'): string {
  const authorName = (ref.authorFullName || `${ref.authorFamilyName || ''}، ${ref.authorFirstName || ''}`.replace(/^[\s،]+|[\s،]+$/g, '')).trim();
  const title = (ref.title || '').trim();
  const publisher = (ref.publisher || '').trim();
  const place = (ref.publicationPlace || '').trim();
  const year = (ref.publicationYear || '').trim();
  const edition = (ref.edition || '').trim();
  const volume = (ref.volume || '').trim();
  const pages = (ref.pages || '').trim();

  if (style === 'traditional_arabic' || ref.language === 'العربية') {
    // Standard Arabic academic thesis format:
    // [المؤلف/الشهرة]: [العنوان]، [الجزء إن وجد]، [الطبعة إن وجد]، [دار النشر]، [مكان النشر]، [سنة النشر]م، [صـ].
    const parts: string[] = [];
    if (authorName) parts.push(authorName + ':');
    if (title) parts.push(title);
    if (volume) parts.push(volume);
    if (edition) parts.push(edition);
    if (publisher) parts.push(publisher);
    if (place) parts.push(place);
    if (year) parts.push(`${year}م`);
    if (pages) parts.push(`ص ${pages}`);

    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];

    // Connect with commas
    const authorPart = parts[0];
    const rest = parts.slice(1).join('، ');
    return `${authorPart} ${rest}.`;
  }

  if (style === 'chicago') {
    // Chicago Notes & Bibliography Style:
    // Lastname, Firstname. Title. Place: Publisher, Year.
    const name = ref.authorFamilyName && ref.authorFirstName 
      ? `${ref.authorFamilyName}, ${ref.authorFirstName}`
      : authorName;
    const pubBlock = [place, publisher].filter(Boolean).join(': ');
    const pubWithYear = [pubBlock, year].filter(Boolean).join(', ');
    return `${name ? name + '. ' : ''}*${title}*${volume ? ', ' + volume : ''}${edition ? ', ' + edition : ''}. ${pubWithYear}.`;
  }

  if (style === 'apa') {
    // APA Style:
    // Author, A. A. (Year). Title. Publisher.
    const yearStr = year ? `(${year})` : '(n.d.)';
    return `${authorName} ${yearStr}. *${title}*. ${publisher ? publisher + '.' : ''}`;
  }

  if (style === 'mla') {
    // MLA Style:
    // Author. Title. Publisher, Year.
    return `${authorName}. *${title}*. ${publisher ? publisher + ', ' : ''}${year}.`;
  }

  return ref.fullCitation || title;
}
