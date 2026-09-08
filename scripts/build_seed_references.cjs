const fs = require('fs');
const path = require('path');

const parsed = JSON.parse(fs.readFileSync(path.join(__dirname, 'parsed_raw.json'), 'utf8'));

// Helper to determine alphabetKey
function getAlphabetKey(authorFamily, authorFull, title, ignoreAl = false) {
  let cand = (authorFamily || authorFull || title || '').trim();
  cand = cand.replace(/^["'«»“„(\[\{`~#@\s]+/, '');
  if (!cand) return '#';
  if (ignoreAl && cand.startsWith('ال') && cand.length > 2) {
    cand = cand.slice(2).trim();
  }
  const first = cand.charAt(0);
  if (/^[A-Za-z]/i.test(first)) return first.toUpperCase();
  if (/^[أإآء]/u.test(first)) return 'ا';
  if (/^[ة]/u.test(first)) return 'هـ';
  if (/^[ى]/u.test(first)) return 'ي';
  return first;
}

// Map each of the 114 references accurately
const references = parsed.map(item => {
  const { num, langRaw, citation } = item;
  const id = `ref-${num}`;
  const isArabic = langRaw.includes('عربي');
  const lang = isArabic ? 'العربية' : (
    citation.includes('Paris') || citation.includes('Histoire') || citation.includes('Revue') || citation.includes('Travaux') 
      ? 'Français' 
      : 'English'
  );

  let authorFullName = '';
  let authorFamilyName = '';
  let authorFirstName = '';
  let title = '';
  let publicationYear = '';
  let publicationPlace = '';
  let publisher = '';
  let edition = '';
  let volume = '';
  let pages = '';
  let referenceType = 'كتاب (Book)';
  let categoryIds = isArabic ? ['cat-2'] : ['cat-2'];
  let keywords = [];

  // Extract Year near the end of citation (usually publication year e.g. 1993, 2004, 1877, 1312هـ, 1425هـ)
  // Match 4 digits or hijri year from the end backwards
  const allYearMatches = [...citation.matchAll(/(\b(?:15|16|17|18|19|20)\d{2}\b)[م|A-D]?/g)];
  if (allYearMatches.length > 0) {
    // Usually the last year in an academic citation is the publication year
    publicationYear = allYearMatches[allYearMatches.length - 1][1];
  } else {
    const hijriMatch = citation.match(/(\d{3,4})هـ/);
    if (hijriMatch) {
      publicationYear = hijriMatch[1] + 'هـ';
    }
  }

  // Type identification
  if (citation.includes('رسالة ماجستير')) {
    referenceType = 'رسالة ماجستير (Master Thesis)';
    categoryIds.push('cat-5');
  } else if (citation.includes('رسالة دكتوراه') || citation.includes('أطروحة')) {
    referenceType = 'أطروحة دكتوراه (PhD Dissertation)';
    categoryIds.push('cat-5');
  } else if (
    citation.includes('مجلة ') || 
    citation.includes('Journal') || 
    citation.includes('Byzantion') || 
    citation.includes('Speculum') || 
    citation.includes('Revue') || 
    citation.includes('Echos') ||
    citation.includes('Bulletin') ||
    citation.includes('Dans ') ||
    citation.includes('in Byzantinische Forschungen')
  ) {
    referenceType = 'مقالة في دورية محكمة (Journal Article)';
  } else if (
    num === 1 || num === 2 || num === 24 || num === 28 || num === 29 ||
    num === 38 || num === 42 || num === 49 || num === 51 || num === 55 ||
    num === 58 || num === 68 || num === 83 || num === 88 || num === 94
  ) {
    referenceType = 'مصدر أصلي / مخطوط (Primary Source)';
    categoryIds.push('cat-1');
  } else if (citation.includes('كتاب بيزنطة مدينة الحضارة والنظم') || citation.includes('in A History of the Crusades')) {
    referenceType = 'فصل في كتاب (Book Section)';
  }

  // Parse Arabic items
  if (isArabic) {
    // Split author and title by ':'
    const colonIdx = citation.indexOf(':');
    if (colonIdx > -1) {
      authorFullName = citation.slice(0, colonIdx).trim();
      const rest = citation.slice(colonIdx + 1).trim();
      
      // Parse rest for title (up to first comma)
      const commaIdx = rest.indexOf('،');
      if (commaIdx > -1) {
        title = rest.slice(0, commaIdx).trim();
      } else {
        const dotIdx = rest.indexOf('.');
        title = (dotIdx > -1 ? rest.slice(0, dotIdx) : rest).trim();
      }
    } else {
      authorFullName = citation.split('،')[0].trim();
      title = citation;
    }

    // Specific Arabic author family/first names
    if (authorFullName.includes('آنا كومنينا')) {
      authorFirstName = 'آنا';
      authorFamilyName = 'كومنينا';
      categoryIds = ['cat-1', 'cat-2', 'cat-4'];
      keywords = ['الألكسياد', 'بيزنطة', 'ألكسيوس الأول', 'الحملة الصليبية الأولى'];
    } else if (authorFullName.includes('ابن البيبي')) {
      authorFirstName = 'ابن';
      authorFamilyName = 'البيبي';
      categoryIds = ['cat-1', 'cat-3'];
      keywords = ['سلاجقة الروم', 'التاريخ الإسلامي', 'الأناضول'];
    } else if (authorFullName.includes('إبراهيم بك حليم')) {
      authorFirstName = 'إبراهيم بك';
      authorFamilyName = 'حليم';
      categoryIds = ['cat-3'];
      keywords = ['الدولة العثمانية', 'التحفة الحليمية', 'تاريخ'];
    } else if (authorFullName.includes('إبراهيم مصباح عبد القوي')) {
      authorFirstName = 'إبراهيم مصباح';
      authorFamilyName = 'عبد القوي';
      categoryIds = ['cat-2', 'cat-5'];
      keywords = ['أندرونيكوس الثالث باليولوجوس', 'السياسة الخارجية البيزنطية', 'رسائل جامعية'];
    } else if (authorFullName.includes('أبرار كريم الله')) {
      authorFirstName = 'أبرار';
      authorFamilyName = 'كريم الله';
      categoryIds = ['cat-3'];
      keywords = ['التتار', 'المغول', 'مذبحة التتار'];
    } else if (authorFullName.includes('أحمد عبد السيد أحمد على الناصري')) {
      authorFirstName = 'أحمد عبد السيد';
      authorFamilyName = 'الناصري';
      categoryIds = ['cat-2', 'cat-3'];
      keywords = ['الروم', 'الشرق الإسلامي', 'بيزنطة'];
    } else if (authorFullName.includes('أحمد عبد المقصود')) {
      authorFirstName = 'أحمد';
      authorFamilyName = 'عبد المقصود';
      categoryIds = ['cat-4'];
      keywords = ['الجماعات القطلونية', 'المرتزقة الكتالان', 'الحملة الكتالونية'];
    } else if (authorFullName.includes('أسد رستم')) {
      authorFirstName = 'أسد';
      authorFamilyName = 'رستم';
      categoryIds = ['cat-2', 'cat-3'];
      keywords = ['الروم', 'الحضارة البيزنطية', 'العرب والروم'];
    } else if (authorFullName.includes('إسماعيل سرهنك')) {
      authorFirstName = 'إسماعيل';
      authorFamilyName = 'سرهنك';
      categoryIds = ['cat-3'];
      keywords = ['دول البحار', 'الأساطيل البحرية', 'الدولة العثمانية'];
    } else if (authorFullName.includes('الأمين أبو بكر')) {
      authorFirstName = 'الأمين';
      authorFamilyName = 'أبو بكر';
      categoryIds = ['cat-2', 'cat-3'];
      keywords = ['الملاحم العربية', 'الأميرة ذات الهمة', 'بيزنطة'];
    } else if (authorFullName.includes('أومان')) {
      authorFirstName = 'تشارلز';
      authorFamilyName = 'أومان';
      categoryIds = ['cat-2'];
      keywords = ['الإمبراطورية البيزنطية', 'الحروب البيزنطية'];
    } else if (authorFullName.includes('أوزنلو يوسف بك آصاف')) {
      authorFirstName = 'أوزنلو يوسف بك';
      authorFamilyName = 'آصاف';
      categoryIds = ['cat-3'];
      keywords = ['سلاطين بني عثمان', 'التاريخ العثماني'];
    } else if (authorFullName.includes('جوزيف نسيم يوسف')) {
      authorFirstName = 'جوزيف نسيم';
      authorFamilyName = 'يوسف';
      categoryIds = ['cat-4'];
      keywords = ['الحروب الصليبية', 'مصر', 'العدوان الصليبي'];
    } else if (authorFullName.includes('حاتم عبد الرحمن الطحاوي')) {
      authorFirstName = 'حاتم عبد الرحمن';
      authorFamilyName = 'الطحاوي';
      keywords = ['بيزنطة', 'البندقية', 'المدن الإيطالية', 'فتح القسطنطينية'];
      if (title.includes('العثمانيين')) categoryIds = ['cat-2', 'cat-3'];
      else categoryIds = ['cat-2', 'cat-4'];
    } else if (authorFullName.includes('حسين ربيع')) {
      authorFirstName = 'حسين';
      authorFamilyName = 'ربيع';
      categoryIds = ['cat-2'];
      keywords = ['الدولة البيزنطية', 'تاريخ بيزنطة'];
    } else if (authorFullName.includes('خليل أفندي مطران')) {
      authorFirstName = 'خليل أفندي';
      authorFamilyName = 'مطران';
      categoryIds = ['cat-3'];
      keywords = ['مرآة الأيام', 'التاريخ العام'];
    } else if (authorFullName.includes('رنسيمان')) {
      authorFirstName = 'ستيفن';
      authorFamilyName = 'رنسيمان';
      categoryIds = ['cat-2', 'cat-4'];
      keywords = ['الحضارة البيزنطية', 'الحروب الصليبية'];
    } else if (authorFullName.includes('زبيدة عطا')) {
      authorFirstName = 'زبيدة';
      authorFamilyName = 'عطا';
      categoryIds = ['cat-3'];
      keywords = ['بلاد الترك', 'العصور الوسطى', 'سلاجقة الروم'];
    } else if (authorFullName.includes('السيد الباز العريني')) {
      authorFirstName = 'السيد الباز';
      authorFamilyName = 'العريني';
      categoryIds = ['cat-2'];
      keywords = ['الدولة البيزنطية', 'تاريخ بيزنطة'];
    } else if (authorFullName.includes('شارل ديل')) {
      authorFirstName = 'شارل';
      authorFamilyName = 'ديل';
      categoryIds = ['cat-2', 'cat-4'];
      keywords = ['البندقية', 'الجمهورية الأرستقراطية', 'التاريخ البيزنطي'];
    } else if (authorFullName.includes('طارق منصور')) {
      authorFirstName = 'طارق';
      authorFamilyName = 'منصور';
      keywords = ['القسطنطينية', 'الكتابات الصليبية', 'ليو السادس'];
      categoryIds = ['cat-2', 'cat-4'];
    } else if (authorFullName.includes('طافور')) {
      authorFirstName = 'بيرو';
      authorFamilyName = 'طافور';
      categoryIds = ['cat-1', 'cat-2', 'cat-4'];
      keywords = ['رحلة طافور', 'القرن الخامس عشر', 'القسطنطينية'];
    } else if (authorFullName.includes('عادل زيتون')) {
      authorFirstName = 'عادل';
      authorFamilyName = 'زيتون';
      categoryIds = ['cat-4'];
      keywords = ['العلاقات الاقتصادية', 'الشرق والغرب', 'العصور الوسطى'];
    } else if (authorFullName.includes('عبد القادر أحمد اليوسف')) {
      authorFirstName = 'عبد القادر أحمد';
      authorFamilyName = 'اليوسف';
      categoryIds = ['cat-2'];
      keywords = ['الإمبراطورية البيزنطية', 'تاريخ بيزنطة'];
    } else if (authorFullName.includes('عصمت غنيم')) {
      authorFirstName = 'عصمت';
      authorFamilyName = 'غنيم';
      categoryIds = ['cat-2'];
      keywords = ['الإمبراطورية البيزنطية'];
    } else if (authorFullName.includes('القرماني')) {
      authorFirstName = 'أحمد بن يوسف';
      authorFamilyName = 'القرماني';
      categoryIds = ['cat-1', 'cat-3'];
      keywords = ['أخبار الدول', 'مصدر أصلي', 'التاريخ الإسلامي'];
    } else if (authorFullName.includes('القلقشندي')) {
      authorFirstName = 'أحمد بن علي';
      authorFamilyName = 'القلقشندي';
      categoryIds = ['cat-1', 'cat-3'];
      keywords = ['صبح الأعشى', 'صناعة الإنشا', 'المملوكية', 'المصادر الأولية'];
    } else if (authorFullName.includes('ليلى عبد الجواد إسماعيل')) {
      authorFirstName = 'ليلى عبد الجواد';
      authorFamilyName = 'إسماعيل';
      categoryIds = ['cat-2', 'cat-3'];
      keywords = ['القسطنطينية', 'الجغرافيين المسلمين', 'الرحالة المسلمون'];
    } else if (authorFullName.includes('محمد أحمد النفيعي')) {
      authorFirstName = 'محمد أحمد';
      authorFamilyName = 'النفيعي';
      categoryIds = ['cat-3', 'cat-5'];
      keywords = ['سلاطين بني عثمان', 'المصاهرات السياسية', 'الدولة العثمانية'];
    } else if (authorFullName.includes('محمد عثمان عبد الجليل')) {
      authorFirstName = 'محمد عثمان';
      authorFamilyName = 'عبد الجليل';
      categoryIds = ['cat-2', 'cat-5'];
      keywords = ['إبيروس', 'السياسة الخارجية', 'ديسبوتية إبيروس'];
    } else if (authorFullName.includes('محمد فريد بك')) {
      authorFirstName = 'محمد';
      authorFamilyName = 'فريد بك';
      categoryIds = ['cat-3'];
      keywords = ['الدولة العلية العثمانية', 'تاريخ العثمانيين'];
    } else if (authorFullName.includes('محمد مؤنس عوض')) {
      authorFirstName = 'محمد مؤنس';
      authorFamilyName = 'عوض';
      categoryIds = ['cat-2', 'cat-4'];
      keywords = ['الإمبراطورية البيزنطية', 'الحروب الصليبية'];
    } else if (authorFullName.includes('محمود سعيد عمران')) {
      authorFirstName = 'محمود سعيد';
      authorFamilyName = 'عمران';
      categoryIds = ['cat-2'];
      keywords = ['معالم تاريخ الإمبراطورية البيزنطية', 'بيزنطة'];
    } else if (authorFullName.includes('ناهد عمر صالح')) {
      authorFirstName = 'ناهد عمر';
      authorFamilyName = 'صالح';
      categoryIds = ['cat-2'];
      keywords = ['الاتحاد الكنسي', 'يوحنا الخامس باليولوجوس', 'الكنيسة البيزنطية'];
    } else if (authorFullName.includes('وسام عبد العزيز فرج')) {
      authorFirstName = 'وسام عبد العزيز';
      authorFamilyName = 'فرج';
      categoryIds = ['cat-2'];
      keywords = ['التاريخ السياسي والإداري', 'بيزنطة'];
    } else {
      const parts = authorFullName.split(/\s+/);
      authorFamilyName = parts[parts.length - 1];
      authorFirstName = parts.slice(0, -1).join(' ');
      keywords = ['تاريخ', 'بيزنطة'];
    }

    // Publication place
    if (citation.includes('القاهرة')) publicationPlace = 'القاهرة';
    else if (citation.includes('الإسكندرية')) publicationPlace = 'الإسكندرية';
    else if (citation.includes('بيروت')) publicationPlace = 'بيروت';
    else if (citation.includes('دمشق')) publicationPlace = 'دمشق';
    else if (citation.includes('مكة المكرمة')) publicationPlace = 'مكة المكرمة';
    else if (citation.includes('طنطا')) publicationPlace = 'طنطا';

    // Publisher
    if (citation.includes('المجلس الأعلى للثقافة')) publisher = 'المجلس الأعلى للثقافة';
    else if (citation.includes('الهيئة المصرية العامة للكتاب')) publisher = 'الهيئة المصرية العامة للكتاب';
    else if (citation.includes('مؤسسة الكتب الثقافية')) publisher = 'مؤسسة الكتب الثقافية';
    else if (citation.includes('دار المكشوف')) publisher = 'دار المكشوف';
    else if (citation.includes('مطبعة مدبولي')) publisher = 'مطبعة مدبولي';
    else if (citation.includes('دار المعارف')) publisher = 'دار المعارف';
    else if (citation.includes('دار النفائس')) publisher = 'دار النفائس';
    else if (citation.includes('عالم الكتب')) publisher = 'عالم الكتب';
    else if (citation.includes('دار الكتب الأميرية')) publisher = 'دار الكتب الأميرية';
    else if (citation.includes('دار المعرفة الجامعية')) publisher = 'دار المعرفة الجامعية';
    else if (citation.includes('عين للدراسات والبحوث')) publisher = 'عين للدراسات والبحوث';
    else if (citation.includes('دار دمشق')) publisher = 'دار دمشق';
    else if (citation.includes('دار الفكر العربي')) publisher = 'دار الفكر العربي';

    // Edition / Volume
    if (citation.includes('ط1') || citation.includes('طـ1') || citation.includes('الطبعة الأولى') || citation.includes('الطبعة الأولي')) {
      edition = 'الطبعة الأولى';
    }
    if (citation.includes('جـ1') || citation.includes('ج1')) volume = 'الجزء 1';
    if (citation.includes('جـ5') || citation.includes('ج5')) volume = 'الجزء 5';
  } else {
    // FOREIGN REFERENCES
    // Format usually: "LastName, FirstName: Title, Publication Info..." OR "LastName: Title..."
    const colonIdx = citation.indexOf(':');
    if (colonIdx > -1) {
      const authorPart = citation.slice(0, colonIdx).trim();
      const rest = citation.slice(colonIdx + 1).trim();

      if (authorPart.includes(',')) {
        const [last, first] = authorPart.split(',').map(s => s.trim());
        authorFamilyName = last;
        authorFirstName = first;
        authorFullName = `${first} ${last}`;
      } else {
        const parts = authorPart.split(/\s+/);
        if (parts.length === 1) {
          authorFamilyName = parts[0];
          authorFirstName = '';
          authorFullName = parts[0];
        } else {
          authorFamilyName = parts[parts.length - 1];
          authorFirstName = parts.slice(0, -1).join(' ');
          authorFullName = authorPart;
        }
      }

      // Title up to first comma or trans. or ed. or in
      const titleMatch = rest.match(/^([^,]+)(?:,\s*(.*))?$/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      } else {
        title = rest;
      }
    } else {
      const commaParts = citation.split(',');
      authorFamilyName = commaParts[0].trim();
      authorFullName = authorFamilyName;
      title = citation;
    }

    // Specific foreign publishers & places
    if (citation.includes('Oxford University Press') || citation.includes('Oxford')) {
      publisher = 'Oxford University Press';
      publicationPlace = 'Oxford';
    } else if (citation.includes('Cambridge University Press') || citation.includes('Cambridge')) {
      publisher = 'Cambridge University Press';
      publicationPlace = 'Cambridge';
    } else if (citation.includes('Harvard University Press')) {
      publisher = 'Harvard University Press';
      publicationPlace = 'Cambridge, MA';
    } else if (citation.includes('University of Pennsylvania Press')) {
      publisher = 'University of Pennsylvania Press';
      publicationPlace = 'Philadelphia';
    } else if (citation.includes('Wayne State University Press')) {
      publisher = 'Wayne State University Press';
      publicationPlace = 'Detroit';
    } else if (citation.includes('Stanford University Press')) {
      publisher = 'Stanford University Press';
      publicationPlace = 'California';
    } else if (citation.includes('Rutgers University Press')) {
      publisher = 'Rutgers University Press';
      publicationPlace = 'New Brunswick';
    } else if (citation.includes('University of Wisconsin Press')) {
      publisher = 'University of Wisconsin Press';
      publicationPlace = 'Madison';
    } else if (citation.includes('Paris')) {
      publicationPlace = 'Paris';
    } else if (citation.includes('Bonnae') || citation.includes('Bonn')) {
      publicationPlace = 'Bonn';
    } else if (citation.includes('London')) {
      publicationPlace = 'London';
    } else if (citation.includes('Ankara')) {
      publicationPlace = 'Ankara';
    }

    // Categorization for foreign references
    if (
      authorFamilyName === 'Akropolites' || 
      authorFamilyName === 'Cantacuzenus' || 
      authorFamilyName === 'Chalkokondyles' || 
      authorFamilyName === 'Choniates' || 
      authorFamilyName === 'Doukas' || 
      authorFamilyName === 'Gregoras' || 
      authorFamilyName === 'Pachymeres' || 
      authorFamilyName === 'Asikpasaoglu' ||
      authorFamilyName === 'Leunclauvus' ||
      authorFamilyName === 'Moncada'
    ) {
      categoryIds = ['cat-1', 'cat-2'];
      keywords = ['Primary Source', 'Byzantine History', 'Chronicle'];
    } else if (
      citation.includes('Catalan') || 
      authorFamilyName === 'Burns' || 
      authorFamilyName === 'Carr' || 
      authorFamilyName === 'Setton' || 
      authorFamilyName === 'Schlumberger'
    ) {
      categoryIds = ['cat-4', 'cat-2'];
      keywords = ['Catalan Company', 'Almugavars', 'Late Byzantium', 'Crusades'];
    } else if (
      citation.includes('Ottoman') || 
      citation.includes('Turk') || 
      authorFamilyName === 'Gibbons' || 
      authorFamilyName === 'Hammer' || 
      authorFamilyName === 'Shaw' || 
      authorFamilyName === 'Alix' ||
      authorFamilyName === 'Lavallee' ||
      authorFamilyName === 'Jonquiere'
    ) {
      categoryIds = ['cat-3'];
      keywords = ['Ottoman Empire', 'Turkish History', 'Byzantine-Ottoman Wars'];
    } else if (
      citation.includes('Latin Empire') || 
      citation.includes('Crusades') || 
      authorFamilyName === 'Wolff' || 
      authorFamilyName === 'Harris' || 
      authorFamilyName === 'Folda' ||
      authorFamilyName === 'Longnon'
    ) {
      categoryIds = ['cat-4', 'cat-2'];
      keywords = ['Latin Orient', 'Crusades', 'Frankokratia', 'Venice'];
    } else {
      categoryIds = ['cat-2'];
      keywords = ['Byzantine Empire', 'Late Byzantium', 'Palaiologos', 'Medieval History'];
    }
  }

  // Calculate alphabetKey
  const alphabetKey = getAlphabetKey(authorFamilyName, authorFullName, title);

  return {
    id,
    authorFamilyName,
    authorFirstName,
    authorFullName: authorFullName || `${authorFirstName} ${authorFamilyName}`.trim(),
    title,
    language: lang,
    referenceType,
    publisher: publisher || undefined,
    publicationPlace: publicationPlace || undefined,
    publicationYear: publicationYear || undefined,
    edition: edition || undefined,
    volume: volume || undefined,
    pages: pages || undefined,
    keywords,
    fullCitation: citation, // STRICT VERBATIM USER CITATION!
    alphabetKey,
    categoryIds,
    isFavorite: num <= 8, // Favorite the top key primary sources
    inTrash: false,
    dateAdded: new Date(Date.now() - (115 - num) * 3600000).toISOString(),
    lastModified: new Date(Date.now() - (115 - num) * 3600000).toISOString()
  };
});

console.log(`Generated ${references.length} structured Reference objects.`);

// Write to /src/data/seedReferences.ts
const fileContent = `// Auto-generated comprehensive academic reference seed
// Generated from researcher thesis bibliography (114 references)
import { Reference } from '../types';

export const SEED_REFERENCES_LIST: Reference[] = ${JSON.stringify(references, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/seedReferences.ts'), fileContent, 'utf8');
console.log('Successfully written to src/data/seedReferences.ts');
