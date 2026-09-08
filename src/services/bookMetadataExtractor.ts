import { LanguageType, Reference, ReferenceFile } from '../types';

export interface ExtractedBookMetadata {
  title?: string;
  subtitle?: string;
  authorFullName?: string;
  authorFamilyName?: string;
  authorFirstName?: string;
  publicationYear?: string;
  publisher?: string;
  publicationPlace?: string;
  pages?: string;
  pageCount?: number;
  isbn?: string;
  doi?: string;
  edition?: string;
  volume?: string;
  language?: LanguageType;
  keywords?: string[];
  fileSizeFormatted?: string;
}

export interface MergeResult {
  updatedRef: Reference;
  filledFields: { key: string; label: string; value: string }[];
}

// Well-known academic publishers dictionary
const KNOWN_PUBLISHERS = [
  // Western Academic
  { name: 'Oxford University Press', place: 'Oxford', aliases: ['Oxford University Press', 'Oxford UP', 'OUP', 'Clarendon Press'] },
  { name: 'Cambridge University Press', place: 'Cambridge', aliases: ['Cambridge University Press', 'Cambridge UP', 'CUP'] },
  { name: 'Harvard University Press', place: 'Cambridge, MA', aliases: ['Harvard University Press', 'Harvard UP'] },
  { name: 'Princeton University Press', place: 'Princeton', aliases: ['Princeton University Press', 'Princeton UP'] },
  { name: 'Yale University Press', place: 'New Haven', aliases: ['Yale University Press', 'Yale UP'] },
  { name: 'Columbia University Press', place: 'New York', aliases: ['Columbia University Press'] },
  { name: 'University of Wisconsin Press', place: 'Madison', aliases: ['University of Wisconsin Press', 'Wisconsin Press'] },
  { name: 'University of California Press', place: 'Berkeley', aliases: ['University of California Press', 'UC Press'] },
  { name: 'University of Chicago Press', place: 'Chicago', aliases: ['University of Chicago Press'] },
  { name: 'Edinburgh University Press', place: 'Edinburgh', aliases: ['Edinburgh University Press'] },
  { name: 'Routledge', place: 'London & New York', aliases: ['Routledge', 'Taylor & Francis'] },
  { name: 'Brill', place: 'Leiden & Boston', aliases: ['E. J. Brill', 'Brill', 'Koninklijke Brill'] },
  { name: 'Brepols', place: 'Turnhout', aliases: ['Brepols', 'Brepols Publishers'] },
  { name: 'De Gruyter', place: 'Berlin & Boston', aliases: ['De Gruyter', 'Walter de Gruyter'] },
  { name: 'Dumbarton Oaks', place: 'Washington, D.C.', aliases: ['Dumbarton Oaks', 'Dumbarton Oaks Research Library and Collection'] },
  { name: 'Bloomsbury', place: 'London', aliases: ['Bloomsbury Academic', 'Bloomsbury'] },
  { name: 'Penguin', place: 'London', aliases: ['Penguin Books', 'Penguin Classics'] },
  
  // Arabic Academic & Historical Publishers
  { name: 'المجلس الأعلى للثقافة', place: 'القاهرة', aliases: ['المجلس الأعلى للثقافة', 'المجلس الاعلى للثقافة'] },
  { name: 'الهيئة المصرية العامة للكتاب', place: 'القاهرة', aliases: ['الهيئة المصرية العامة للكتاب', 'هيئة الكتاب', 'الهيئة العامة للكتاب'] },
  { name: 'دار المعارف', place: 'القاهرة', aliases: ['دار المعارف', 'دار المعارف بمصر'] },
  { name: 'دار الفكر العربي', place: 'القاهرة', aliases: ['دار الفكر العربي'] },
  { name: 'دار الفكر', place: 'بيروت', aliases: ['دار الفكر المعاصر', 'دار الفكر ببيروت', 'دار الفكر دمشق'] },
  { name: 'دار الكتاب العربي', place: 'بيروت', aliases: ['دار الكتاب العربي'] },
  { name: 'دار صادر', place: 'بيروت', aliases: ['دار صادر'] },
  { name: 'دار الغرب الإسلامي', place: 'بيروت', aliases: ['دار الغرب الإسلامي', 'دار الغرب الاسلامي'] },
  { name: 'مؤسسة الرسالة', place: 'بيروت', aliases: ['مؤسسة الرسالة'] },
  { name: 'عالم الكتب', place: 'القاهرة', aliases: ['عالم الكتب'] },
  { name: 'دار الشروق', place: 'القاهرة', aliases: ['دار الشروق'] },
  { name: 'مكتبة الخانجي', place: 'القاهرة', aliases: ['مكتبة الخانجي'] },
  { name: 'مكتبة الآداب', place: 'القاهرة', aliases: ['مكتبة الآداب'] },
  { name: 'مطبعة لجنة التأليف والترجمة والنشر', place: 'القاهرة', aliases: ['لجنة التأليف والترجمة والنشر', 'مطبعة لجنة التأليف'] },
  { name: 'دار النهضة العربية', place: 'القاهرة', aliases: ['دار النهضة العربية'] },
  { name: 'دار الوفاء لدنيا الطباعة والنشر', place: 'الإسكندرية', aliases: ['دار الوفاء لدنيا الطباعة والنشر', 'دار الوفاء'] },
  { name: 'منشأة المعارف', place: 'الإسكندرية', aliases: ['منشأة المعارف'] },
  { name: 'دار العلوم', place: 'الرياض', aliases: ['دار العلوم'] }
];

/**
 * Decodes a raw PDF string which may be octal-escaped or UTF-16BE (hex or escaped)
 */
function decodePdfString(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();

  // Strip wrapping parentheses or angle brackets
  if (str.startsWith('(') && str.endsWith(')')) {
    str = str.slice(1, -1);
  } else if (str.startsWith('<') && str.endsWith('>')) {
    const hex = str.slice(1, -1).replace(/\s+/g, '');
    // Check if UTF-16BE hex (starts with FEFF)
    if (hex.toUpperCase().startsWith('FEFF')) {
      let decoded = '';
      for (let i = 4; i < hex.length; i += 4) {
        const code = parseInt(hex.substr(i, 4), 16);
        if (!isNaN(code)) decoded += String.fromCharCode(code);
      }
      return decoded.trim();
    }
    // Standard ASCII hex
    let ascii = '';
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      if (!isNaN(code)) ascii += String.fromCharCode(code);
    }
    return ascii.trim();
  }

  // Handle octal escape codes e.g. \376\377
  str = str.replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));

  // Handle standard escape sequences
  str = str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');

  // Check for UTF-16BE BOM: \xfe\xff
  if (str.charCodeAt(0) === 0xfe && str.charCodeAt(1) === 0xff) {
    let utf16 = '';
    for (let i = 2; i < str.length; i += 2) {
      const code = (str.charCodeAt(i) << 8) | str.charCodeAt(i + 1);
      utf16 += String.fromCharCode(code);
    }
    return utf16.trim();
  }

  return str.trim();
}

/**
 * Parses binary/text content of a PDF file to extract embedded metadata
 */
function parsePdfHeaderAndXmp(pdfText: string): Partial<ExtractedBookMetadata> {
  const result: Partial<ExtractedBookMetadata> = {};

  // 1. Extract from standard PDF Info dictionary
  // e.g. /Title (Some Title) or /Title <FEFF...>
  const titleMatch = pdfText.match(/\/Title\s*(\([^\)]+\)|<[0-9a-fA-F]+>)/);
  if (titleMatch) {
    const rawTitle = decodePdfString(titleMatch[1]);
    if (rawTitle && rawTitle.length > 2 && !rawTitle.toLowerCase().includes('untitled')) {
      result.title = rawTitle;
    }
  }

  const authorMatch = pdfText.match(/\/Author\s*(\([^\)]+\)|<[0-9a-fA-F]+>)/);
  if (authorMatch) {
    const rawAuthor = decodePdfString(authorMatch[1]);
    if (rawAuthor && rawAuthor.length > 2 && !rawAuthor.toLowerCase().includes('unknown')) {
      result.authorFullName = rawAuthor;
    }
  }

  // 2. Extract CreationDate or ModDate for Year: e.g. /CreationDate (D:20070512...)
  const dateMatch = pdfText.match(/\/(?:CreationDate|ModDate)\s*\(\s*D\s*:\s*([12]\d{3})/i);
  if (dateMatch) {
    result.publicationYear = dateMatch[1];
  }

  // 3. Extract Keywords
  const kwMatch = pdfText.match(/\/Keywords\s*(\([^\)]+\)|<[0-9a-fA-F]+>)/);
  if (kwMatch) {
    const rawKw = decodePdfString(kwMatch[1]);
    if (rawKw) {
      result.keywords = rawKw.split(/[,;\s]+/).map((k) => k.trim()).filter((k) => k.length > 2);
    }
  }

  // 4. Extract Page count from /Type /Pages /Count (\d+) or count /Type /Page
  const countMatch = pdfText.match(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/i) || pdfText.match(/\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages/i);
  if (countMatch) {
    const pages = parseInt(countMatch[1], 10);
    if (pages > 0 && pages < 50000) {
      result.pageCount = pages;
      result.pages = `${pages} ص`;
    }
  } else {
    // Count occurrences of "/Type /Page " (excluding /Pages)
    const pageOccurrences = (pdfText.match(/\/Type\s*\/Page\b/g) || []).length;
    if (pageOccurrences > 0 && pageOccurrences < 50000) {
      result.pageCount = pageOccurrences;
      result.pages = `${pageOccurrences} ص`;
    }
  }

  // 5. Extract XMP metadata block if present
  const xmpMatch = pdfText.match(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/i);
  if (xmpMatch) {
    const xmp = xmpMatch[0];

    // dc:title
    if (!result.title) {
      const dcTitle = xmp.match(/<dc:title>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i);
      if (dcTitle && dcTitle[1].trim()) {
        result.title = dcTitle[1].trim();
      }
    }

    // dc:creator
    if (!result.authorFullName) {
      const dcCreator = xmp.match(/<dc:creator>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i);
      if (dcCreator && dcCreator[1].trim()) {
        result.authorFullName = dcCreator[1].trim();
      }
    }

    // dc:publisher
    const dcPub = xmp.match(/<dc:publisher>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i);
    if (dcPub && dcPub[1].trim()) {
      result.publisher = dcPub[1].trim();
    }

    // dc:date
    if (!result.publicationYear) {
      const dcDate = xmp.match(/<dc:date>[\s\S]*?([12]\d{3})/i);
      if (dcDate) {
        result.publicationYear = dcDate[1];
      }
    }

    // prism:isbn
    const prismIsbn = xmp.match(/<prism:isbn>([\s\S]*?)<\/prism:isbn>/i);
    if (prismIsbn && prismIsbn[1].trim()) {
      result.isbn = prismIsbn[1].trim();
    }

    // prism:doi
    const prismDoi = xmp.match(/<(?:prism|pdfx):doi>([\s\S]*?)<\/(?:prism|pdfx):doi>/i);
    if (prismDoi && prismDoi[1].trim()) {
      result.doi = prismDoi[1].trim();
    }
  }

  // 6. Search for ISBN pattern in the text
  if (!result.isbn) {
    const isbnMatch = pdfText.match(/(?:ISBN(?:-1[03])?:?\s*)(97[89][-\s]?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9Xx]|[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9Xx])/i);
    if (isbnMatch) {
      result.isbn = isbnMatch[1].replace(/\s+/g, '-');
    }
  }

  // 7. Search for DOI
  if (!result.doi) {
    const doiMatch = pdfText.match(/(?:doi(?:\.org)?\/|DOI:\s*)(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i);
    if (doiMatch) {
      result.doi = doiMatch[1].trim();
    }
  }

  // 8. Search for known publishers in text
  if (!result.publisher) {
    for (const pub of KNOWN_PUBLISHERS) {
      for (const alias of pub.aliases) {
        if (pdfText.includes(alias)) {
          result.publisher = pub.name;
          if (!result.publicationPlace) {
            result.publicationPlace = pub.place;
          }
          break;
        }
      }
      if (result.publisher) break;
    }
  }

  return result;
}

/**
 * Extracts metadata hints from the filename (e.g. "Author - Title (Year, Publisher).pdf")
 */
function parseFilenameMetadata(filename: string): Partial<ExtractedBookMetadata> {
  const result: Partial<ExtractedBookMetadata> = {};
  if (!filename) return result;

  // Clean extension
  const cleanName = filename.replace(/\.[^/.]+$/, '').trim();

  // 1. Extract 4-digit year e.g. (2004), [1993], 2024
  const yearMatch = cleanName.match(/\b(15|16|17|18|19|20)\d{2}\b/);
  if (yearMatch) {
    result.publicationYear = yearMatch[0];
  } else {
    // Hijri year e.g. 1425هـ
    const hijriMatch = cleanName.match(/(\d{3,4})هـ/);
    if (hijriMatch) {
      result.publicationYear = `${hijriMatch[1]}هـ`;
    }
  }

  // 2. Extract Volume / Part e.g. "جـ1", "جزء 2", "Vol. 1", "Volume 2"
  const volMatch = cleanName.match(/(?:(?:جـ?\s*(\d+))|(?:جزء\s*(\d+))|(?:Vol(?:ume)?\.?\s*(\d+|[IVXLCDM]+))|(?:المجلد\s*(\S+)))/i);
  if (volMatch) {
    result.volume = volMatch[0].trim();
  }

  // 3. Extract Edition e.g. "ط1", "طـ2", "2nd ed", "3rd edition"
  const edMatch = cleanName.match(/(?:طـ?\s*(\d+)|طبعة\s*(\S+)|(\d+)(?:st|nd|rd|th)\s*ed(?:ition)?)/i);
  if (edMatch) {
    result.edition = edMatch[0].trim();
  }

  // 4. Check for known publishers inside filename
  for (const pub of KNOWN_PUBLISHERS) {
    for (const alias of pub.aliases) {
      if (cleanName.includes(alias)) {
        result.publisher = pub.name;
        if (!result.publicationPlace) {
          result.publicationPlace = pub.place;
        }
        break;
      }
    }
    if (result.publisher) break;
  }

  // 5. Structure parsing: "Author - Title" or "Author _ Title"
  const parts = cleanName.split(/\s+[-_–—]\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const part0 = parts[0].replace(/\([^\)]+\)/g, '').replace(/\[[^\]]+\]/g, '').trim();
    const part1 = parts[1].replace(/\([^\)]+\)/g, '').replace(/\[[^\]]+\]/g, '').trim();

    // Check which one is author and which is title
    // Usually Part 0 is author if it has 1-3 words, or Part 1 is title
    if (part0.length > 2 && part1.length > 2) {
      result.authorFullName = part0;
      result.title = part1;
    }
  } else if (!result.title && cleanName.length > 3) {
    // If no separator, clean out years and parentheticals to derive candidate title
    const candidate = cleanName
      .replace(/\([^\)]+\)/g, '')
      .replace(/\[[^\]]+\]/g, '')
      .replace(/[\-_]/g, ' ')
      .trim();
    if (candidate.length > 3) {
      result.title = candidate;
    }
  }

  return result;
}

/**
 * Splits an author full name into Family Name and First Name
 */
export function parseAuthorNames(fullName: string): { familyName: string; firstName: string } {
  if (!fullName) return { familyName: '', firstName: '' };
  const trimmed = fullName.trim();

  // If comma separated: "Nicol, Donald M." or "ابن الأثير, عز الدين"
  if (trimmed.includes(',')) {
    const [family, first] = trimmed.split(',').map((s) => s.trim());
    return { familyName: family, firstName: first || '' };
  }

  const words = trimmed.split(/\s+/);
  if (words.length === 1) {
    return { familyName: words[0], firstName: '' };
  }

  // For Arabic compound names or prefixes (ابن, أبو, آل, د., أ.د.)
  const isArabic = /[\u0600-\u06FF]/.test(trimmed);
  if (isArabic) {
    // In Arabic scholarly citations, last name or famous patronymic:
    if (words[0] === 'ابن' || words[0] === 'أبو' || words[0] === 'آل') {
      return { familyName: `${words[0]} ${words[1]}`, firstName: words.slice(2).join(' ') };
    }
    // Default: first name + family name
    return { familyName: words[words.length - 1], firstName: words.slice(0, words.length - 1).join(' ') };
  }

  // Western: "Donald M. Nicol" -> Family: "Nicol", First: "Donald M."
  return {
    familyName: words[words.length - 1],
    firstName: words.slice(0, words.length - 1).join(' ')
  };
}

/**
 * Detect language of text
 */
export function detectLanguage(text: string): LanguageType {
  if (/[\u0600-\u06FF]/.test(text)) return 'العربية';
  if (/[\u0370-\u03FF]/.test(text)) return 'Greek';
  if (/[éèêëàâîïôûùç]/i.test(text)) return 'Français';
  if (/[äöüß]/i.test(text)) return 'Deutsch';
  if (/\b(?:et|in|ad|de|ex|cum|sine|quod|non)\b/i.test(text)) return 'Latin';
  return 'English';
}

/**
 * Main extractor: reads a File or Blob, parses PDF binary & text, extracts metadata
 */
export async function extractMetadataFromBookFile(file: File | Blob, explicitName?: string): Promise<ExtractedBookMetadata> {
  const fileName = explicitName || (file instanceof File ? file.name : 'book.pdf');
  const filenameMeta = parseFilenameMetadata(fileName);

  let pdfMeta: Partial<ExtractedBookMetadata> = {};

  try {
    // Read the first 512KB and the last 64KB of the file (where PDF trailer and XMP usually reside)
    const totalSize = file.size;
    const CHUNK_START_SIZE = Math.min(512 * 1024, totalSize);
    
    // Read start chunk
    const startSlice = file.slice(0, CHUNK_START_SIZE);
    const startBuf = await startSlice.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    const startText = decoder.decode(startBuf);

    // Read end chunk if file is larger
    let endText = '';
    if (totalSize > CHUNK_START_SIZE) {
      const CHUNK_END_SIZE = Math.min(64 * 1024, totalSize);
      const endSlice = file.slice(totalSize - CHUNK_END_SIZE, totalSize);
      const endBuf = await endSlice.arrayBuffer();
      endText = decoder.decode(endBuf);
    }

    const combinedPdfText = startText + '\n' + endText;
    pdfMeta = parsePdfHeaderAndXmp(combinedPdfText);
  } catch (err) {
    console.warn('Could not parse PDF binary streams, relying on filename heuristics', err);
  }

  // Merge results (PDF internal metadata takes priority, fallback to filename)
  const merged: ExtractedBookMetadata = {
    title: pdfMeta.title || filenameMeta.title,
    authorFullName: pdfMeta.authorFullName || filenameMeta.authorFullName,
    publicationYear: pdfMeta.publicationYear || filenameMeta.publicationYear,
    publisher: pdfMeta.publisher || filenameMeta.publisher,
    publicationPlace: pdfMeta.publicationPlace || filenameMeta.publicationPlace,
    pages: pdfMeta.pages,
    pageCount: pdfMeta.pageCount,
    isbn: pdfMeta.isbn,
    doi: pdfMeta.doi,
    edition: pdfMeta.edition || filenameMeta.edition,
    volume: pdfMeta.volume || filenameMeta.volume,
    keywords: pdfMeta.keywords,
    fileSizeFormatted: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
  };

  // Derive author family/first name if authorFullName exists
  if (merged.authorFullName) {
    const { familyName, firstName } = parseAuthorNames(merged.authorFullName);
    merged.authorFamilyName = familyName;
    merged.authorFirstName = firstName;
  }

  // Detect language
  const textToTest = `${merged.title || ''} ${merged.authorFullName || ''} ${fileName}`;
  merged.language = detectLanguage(textToTest);

  return merged;
}

/**
 * Merges extracted book metadata into an existing reference, ONLY filling missing fields!
 */
export function mergeBookMetadataWithReference(
  existingRef: Reference,
  extracted: ExtractedBookMetadata,
  fileInfo: ReferenceFile
): MergeResult {
  const updatedRef: Reference = {
    ...existingRef,
    lastModified: new Date().toISOString(),
    file: fileInfo
  };

  const filledFields: { key: string; label: string; value: string }[] = [];

  // 1. Publication Year
  if (!updatedRef.publicationYear && extracted.publicationYear) {
    updatedRef.publicationYear = extracted.publicationYear;
    filledFields.push({ key: 'publicationYear', label: 'سنة النشر', value: extracted.publicationYear });
  }

  // 2. Publisher
  if (!updatedRef.publisher && extracted.publisher) {
    updatedRef.publisher = extracted.publisher;
    filledFields.push({ key: 'publisher', label: 'دار النشر', value: extracted.publisher });
  }

  // 3. Publication Place
  if (!updatedRef.publicationPlace && extracted.publicationPlace) {
    updatedRef.publicationPlace = extracted.publicationPlace;
    filledFields.push({ key: 'publicationPlace', label: 'مكان النشر', value: extracted.publicationPlace });
  }

  // 4. Pages / Page Count
  if (!updatedRef.pages && extracted.pages) {
    updatedRef.pages = extracted.pages;
    filledFields.push({ key: 'pages', label: 'الصفحات', value: extracted.pages });
  }

  // 5. ISBN
  if (!updatedRef.isbn && extracted.isbn) {
    updatedRef.isbn = extracted.isbn;
    filledFields.push({ key: 'isbn', label: 'الرقم المعياري الدولي (ISBN)', value: extracted.isbn });
  }

  // 6. DOI
  if (!updatedRef.doi && extracted.doi) {
    updatedRef.doi = extracted.doi;
    filledFields.push({ key: 'doi', label: 'المعرف الرقمي (DOI)', value: extracted.doi });
  }

  // 7. Volume
  if (!updatedRef.volume && extracted.volume) {
    updatedRef.volume = extracted.volume;
    filledFields.push({ key: 'volume', label: 'المجلد / الجزء', value: extracted.volume });
  }

  // 8. Edition
  if (!updatedRef.edition && extracted.edition) {
    updatedRef.edition = extracted.edition;
    filledFields.push({ key: 'edition', label: 'الطبعة', value: extracted.edition });
  }

  // 9. Author if missing
  if (!updatedRef.authorFullName && extracted.authorFullName) {
    updatedRef.authorFullName = extracted.authorFullName;
    updatedRef.authorFamilyName = extracted.authorFamilyName || extracted.authorFullName;
    updatedRef.authorFirstName = extracted.authorFirstName || '';
    filledFields.push({ key: 'authorFullName', label: 'اسم المؤلف', value: extracted.authorFullName });
  }

  // 10. Title if missing
  if (!updatedRef.title && extracted.title) {
    updatedRef.title = extracted.title;
    filledFields.push({ key: 'title', label: 'عنوان المرجع', value: extracted.title });
  }

  // 11. Keywords: add new keywords
  if (extracted.keywords && extracted.keywords.length > 0) {
    const existingSet = new Set(updatedRef.keywords || []);
    const newKws: string[] = [];
    for (const kw of extracted.keywords) {
      if (!existingSet.has(kw)) {
        existingSet.add(kw);
        newKws.push(kw);
      }
    }
    if (newKws.length > 0) {
      updatedRef.keywords = Array.from(existingSet);
      filledFields.push({ key: 'keywords', label: 'كلمات مفتاحية مستخرجة', value: newKws.join(', ') });
    }
  }

  // Update file reference with pageCount if found
  if (extracted.pageCount && updatedRef.file) {
    updatedRef.file.pageCount = extracted.pageCount;
  }

  return {
    updatedRef,
    filledFields
  };
}
