import { EvidenceSearchPayload, EvidenceSearchResult } from '../types';

export async function searchBookEvidence(payload: EvidenceSearchPayload): Promise<EvidenceSearchResult> {
  const response = await fetch('/api/evidence-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errMsg = 'فشل الاتصال بخدمة البحث والاستدلال الداخلي';
    try {
      const errData = await response.json();
      if (errData?.error) errMsg = errData.error;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const result: EvidenceSearchResult = await response.json();
  return result;
}
