// Service to search books and resolve full scholarly author names using AI
import { LanguageType, ReferenceType } from '../types';

export interface AIBookSearchResult {
  found: boolean;
  authorFullName: string;
  authorFirstName: string;
  authorFamilyName: string;
  authorBio?: string;
  title: string;
  subtitle?: string;
  translatorOrEditor?: string;
  publisher?: string;
  publicationPlace?: string;
  publicationYear?: string;
  edition?: string;
  volume?: string;
  language: LanguageType;
  referenceType: ReferenceType;
  fullCitation: string;
  keywords: string[];
  alphabetKey: string;
  historicalRelevance?: string;
  note?: string;
}

export async function searchBookAndAuthorWithAI(
  query: string, 
  rawCitation?: string
): Promise<AIBookSearchResult> {
  const response = await fetch('/api/ai-book-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, rawCitation })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'تعذر الاتصال بخدمة الذكاء الاصطناعي لفحص وتدقيق اسم المؤلف.');
  }

  const data: AIBookSearchResult = await response.json();
  return data;
}
