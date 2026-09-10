const fs = require('fs');
const path = require('path');

function stripTitles(name) {
  if (!name) return '';
  let res = name.trim();

  // Remove leading titles
  const leadingPattern = /^(الدكتور(ة)?|أ\.د\.?|أستاذ(ة)?|الأستاذ(ة)?|د\.?|الشيخ(ة)?|السير|اللورد|لورد|الأمير(ة)?|الأب|القس(يس)?|المطران|البطريرك|الراهب|الفريق|اللواء|العميد|الباشا|الباحث(ة)?|المؤرخ(ة)?|Sir|Dr\.?|Prof\.?|Professor|Father|Fr\.?|Lord|Baron|Lady|Prince|Princess)\s+/iu;

  while (leadingPattern.test(res)) {
    res = res.replace(leadingPattern, '').trim();
  }

  // Remove title inside compound conjunctions (e.g. "أحمد فؤاد والدكتورة هويدا")
  res = res.replace(/(و\s*)(الدكتور(ة)?|د\.?|الأستاذ(ة)?|الشيخ(ة)?|السير|الأمير(ة)?|الأب)\s+/giu, '$1');

  // Also clean inside English parenthetical e.g. "(Sir Steven Runciman)" -> "(Steven Runciman)"
  res = res.replace(/\((Sir|Lord|Dr\.|Prof\.)\s+/gi, '(');

  // Clean trailing parenthetical descriptions like "(المؤرخ والحقوقي والزعيم الوطني)" or "(مفتي بيروت)"
  res = res.replace(/\s*\((المؤرخ والحقوقي والزعيم الوطني|مفتي بيروت|أبو أسامة الحرستاني)\)/gu, '');

  return res.trim();
}

// Function to compute clean first letter
function getCleanLetter(name) {
  let cand = stripTitles(name || '').trim();
  cand = cand.replace(/^["'«»“„(\[\{`~#@\s]+/, '');
  if (!cand) return '#';
  const char = cand.charAt(0);
  if (/^[A-Za-z]/i.test(char)) return char.toUpperCase();
  if (/^[أإآء]/u.test(char)) return 'ا';
  if (/^[ة]/u.test(char)) return 'هـ';
  if (/^[ى]/u.test(char)) return 'ي';
  return char;
}

const seedPath = path.join(__dirname, '../src/data/seedReferences.ts');
let content = fs.readFileSync(seedPath, 'utf8');

const match = content.match(/export const SEED_REFERENCES_LIST: Reference\[\] = (\[[\s\S]+\]);/);
if (!match) {
  console.error('Could not find SEED_REFERENCES_LIST');
  process.exit(1);
}

const list = JSON.parse(match[1]);
console.log(`Processing ${list.length} references...`);

let changedCount = 0;

const cleanedList = list.map((ref) => {
  const oldFull = ref.authorFullName;
  const newFull = stripTitles(oldFull);

  let newFirst = stripTitles(ref.authorFirstName);
  let newFamily = stripTitles(ref.authorFamilyName);

  // Specific manual refinements for perfect academic naming
  if (ref.id === 'ref-ar-1') {
    // Anna Komnene
    newFirst = 'آنا';
    newFamily = 'كومنينا';
  } else if (ref.id === 'ref-ar-12') {
    // Charles Oman
    newFirst = 'تشارلز';
    newFamily = 'أومان';
  } else if (ref.id === 'ref-ar-15') {
    // Edward Shepherd Creasy
    newFirst = 'إدوارد';
    newFamily = 'كريسي';
  } else if (ref.id === 'ref-ar-36') {
    // John Patrick Kinross
    newFirst = 'جون';
    newFamily = 'كينروس';
  } else if (ref.id === 'ref-ar-47' || ref.id === 'ref-ar-48') {
    // Steven Runciman
    newFirst = 'ستيفن';
    newFamily = 'رنسيمان';
  } else if (ref.id === 'ref-ar-83') {
    // Hamilton Gibb
    newFirst = 'هاملتون';
    newFamily = 'جب';
  } else if (ref.id === 'ref-for-24') {
    // Valentine Chirol
    newFirst = 'Valentine';
    newFamily = 'Chirol';
  } else if (ref.id === 'ref-for-27') {
    // Edward Creasy
    newFirst = 'Edward';
    newFamily = 'Creasy';
  } else if (ref.id === 'ref-for-29') {
    // George Dennis
    newFirst = 'George';
    newFamily = 'Dennis';
  } else if (ref.id === 'ref-for-44' || ref.id === 'ref-for-56') {
    // Joseph Gill
    newFirst = 'Joseph';
    newFamily = 'Gill';
  } else if (ref.id === 'ref-for-88') {
    // Edwin Pears
    newFirst = 'Edwin';
    newFamily = 'Pears';
  } else if (ref.id === 'ref-for-89') {
    // William Ramsay
    newFirst = 'William';
    newFamily = 'Ramsay';
  } else if (ref.id === 'ref-for-93' || ref.id === 'ref-for-94') {
    // Steven Runciman
    newFirst = 'Steven';
    newFamily = 'Runciman';
  }

  // Calculate clean alphabet key based on the clean first name / full name
  const alphabetKey = getCleanLetter(newFirst || newFull);

  if (oldFull !== newFull || ref.alphabetKey !== alphabetKey) {
    changedCount++;
  }

  return {
    ...ref,
    authorFullName: newFull,
    authorFirstName: newFirst,
    authorFamilyName: newFamily,
    alphabetKey,
    lastModified: '2026-09-10T12:00:00.000Z'
  };
});

console.log(`Cleaned ${changedCount} reference author entries.`);

// Re-write seed file
const newFileContent = `// Auto-generated comprehensive scholarly references library
// Contains all 204 references provided by the researcher:
// - 89 Arabic and Arabized primary sources and scholarly monographs
// - 115 Foreign primary sources and academic monographs
// Author names strictly stripped of honorific titles (الدكتور، الدكتورة، السير، الشيخ، إلخ) per user instructions and academic citation standards.

import { Reference } from '../types';

export const SEED_REFERENCES_LIST: Reference[] = ${JSON.stringify(cleanedList, null, 2)};
`;

fs.writeFileSync(seedPath, newFileContent, 'utf-8');
console.log('Successfully updated src/data/seedReferences.ts');
