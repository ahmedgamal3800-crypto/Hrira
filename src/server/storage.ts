import fs from 'fs';
import path from 'path';
import { Reference } from '../types';
import { SEED_REFERENCES_LIST } from '../data/seedReferences';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const USER_REFS_FILE = path.join(DATA_DIR, 'user_references.json');
const MANIFEST_FILE = path.join(DATA_DIR, 'uploads_manifest.json');

// Ensure storage directories exist
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(USER_REFS_FILE)) {
    fs.writeFileSync(USER_REFS_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
  if (!fs.existsSync(MANIFEST_FILE)) {
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

interface UserRefRecord {
  reference: Reference;
  isDeleted?: boolean;
  updatedAt: string;
}

interface UploadManifestRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export class ServerStorageManager {
  constructor() {
    ensureDirs();
  }

  // Read all user modified or custom added references
  getUserReferences(): Record<string, UserRefRecord> {
    try {
      ensureDirs();
      if (!fs.existsSync(USER_REFS_FILE)) return {};
      const content = fs.readFileSync(USER_REFS_FILE, 'utf8');
      return JSON.parse(content || '{}');
    } catch (e) {
      console.error('Error reading user_references.json:', e);
      return {};
    }
  }

  // Save all user modified or custom added references
  saveUserReferences(data: Record<string, UserRefRecord>) {
    try {
      ensureDirs();
      fs.writeFileSync(USER_REFS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing user_references.json:', e);
    }
  }

  // Upsert a single reference
  saveReference(ref: Reference): Reference {
    const records = this.getUserReferences();
    const updatedRef: Reference = {
      ...ref,
      lastModified: new Date().toISOString()
    };
    records[ref.id] = {
      reference: updatedRef,
      isDeleted: false,
      updatedAt: new Date().toISOString()
    };
    this.saveUserReferences(records);
    return updatedRef;
  }

  // Delete a reference
  deleteReference(id: string, permanent: boolean = false): boolean {
    const records = this.getUserReferences();
    if (permanent) {
      if (records[id]) {
        delete records[id];
        this.saveUserReferences(records);
        return true;
      }
    } else {
      if (records[id]) {
        records[id].reference.inTrash = true;
        records[id].updatedAt = new Date().toISOString();
      } else {
        const seed = SEED_REFERENCES_LIST.find(r => r.id === id);
        if (seed) {
          records[id] = {
            reference: { ...seed, inTrash: true },
            isDeleted: false,
            updatedAt: new Date().toISOString()
          };
        }
      }
      this.saveUserReferences(records);
      return true;
    }
    return false;
  }

  // Sync client references with server
  syncWithClient(clientRefs: Reference[]): {
    mergedReferences: Reference[];
    savedCount: number;
  } {
    const records = this.getUserReferences();
    let savedCount = 0;

    // Build index of seed refs
    const seedMap = new Map<string, Reference>();
    SEED_REFERENCES_LIST.forEach(r => seedMap.set(r.id, r));

    for (const clientRef of clientRefs) {
      const seedRef = seedMap.get(clientRef.id);
      const existingRecord = records[clientRef.id];

      // If this is a custom reference (not in seed) or client has modifications
      const isCustom = !seedRef;
      const isModified = seedRef && (
        clientRef.inTrash ||
        clientRef.isFavorite ||
        Boolean(clientRef.file?.id) ||
        clientRef.fullCitation !== seedRef.fullCitation ||
        clientRef.title !== seedRef.title ||
        clientRef.authorFullName !== seedRef.authorFullName ||
        clientRef.authorFamilyName !== seedRef.authorFamilyName ||
        clientRef.pages !== seedRef.pages ||
        clientRef.keywords?.join(',') !== seedRef.keywords?.join(',')
      );

      if (isCustom || isModified) {
        // If server already has record, keep the newest
        if (existingRecord) {
          const clientTime = new Date(clientRef.lastModified || 0).getTime();
          const serverTime = new Date(existingRecord.updatedAt || 0).getTime();
          if (clientTime >= serverTime) {
            records[clientRef.id] = {
              reference: clientRef,
              updatedAt: new Date().toISOString()
            };
            savedCount++;
          }
        } else {
          records[clientRef.id] = {
            reference: clientRef,
            updatedAt: new Date().toISOString()
          };
          savedCount++;
        }
      }
    }

    if (savedCount > 0) {
      this.saveUserReferences(records);
    }

    return {
      mergedReferences: this.getAllMergedReferences(),
      savedCount
    };
  }

  // Return the master merged collection of references
  getAllMergedReferences(): Reference[] {
    const userRecords = this.getUserReferences();
    const map = new Map<string, Reference>();

    // 1. Start with seed references
    SEED_REFERENCES_LIST.forEach(ref => {
      map.set(ref.id, { ...ref });
    });

    // 2. Overlay user records (additions and edits)
    Object.values(userRecords).forEach(record => {
      if (record.isDeleted) {
        map.delete(record.reference.id);
      } else {
        map.set(record.reference.id, record.reference);
      }
    });

    return Array.from(map.values());
  }

  // File Upload Management
  saveUploadedFile(id: string, name: string, type: string, base64Data: string): UploadManifestRecord {
    ensureDirs();
    const filePath = path.join(UPLOADS_DIR, id);
    
    // Strip possible data URI prefix
    const cleanBase64 = base64Data.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(filePath, buffer);

    const manifest = this.getUploadManifest();
    const record: UploadManifestRecord = {
      id,
      name,
      type: type || 'application/pdf',
      size: buffer.length,
      uploadedAt: new Date().toISOString()
    };
    manifest[id] = record;
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');

    return record;
  }

  getUploadedFilePath(id: string): { filePath: string; manifest?: UploadManifestRecord } | null {
    ensureDirs();
    const filePath = path.join(UPLOADS_DIR, id);
    if (!fs.existsSync(filePath)) return null;
    const manifest = this.getUploadManifest();
    return {
      filePath,
      manifest: manifest[id]
    };
  }

  deleteUploadedFile(id: string): boolean {
    ensureDirs();
    const filePath = path.join(UPLOADS_DIR, id);
    let deleted = false;
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        deleted = true;
      } catch (e) {
        console.error('Error unlinking file', e);
      }
    }
    const manifest = this.getUploadManifest();
    if (manifest[id]) {
      delete manifest[id];
      fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');
    }
    return deleted;
  }

  getUploadManifest(): Record<string, UploadManifestRecord> {
    try {
      ensureDirs();
      if (!fs.existsSync(MANIFEST_FILE)) return {};
      const content = fs.readFileSync(MANIFEST_FILE, 'utf8');
      return JSON.parse(content || '{}');
    } catch {
      return {};
    }
  }

  getStats() {
    const userRecords = this.getUserReferences();
    const manifest = this.getUploadManifest();
    const totalFiles = Object.keys(manifest).length;
    let totalBytes = 0;
    Object.values(manifest).forEach(m => {
      totalBytes += (m.size || 0);
    });

    return {
      totalMergedReferences: this.getAllMergedReferences().length,
      userCustomOrEditedCount: Object.keys(userRecords).length,
      uploadedFilesCount: totalFiles,
      uploadedFilesBytes: totalBytes,
      persistenceActive: true,
      storagePath: DATA_DIR
    };
  }
}

export const serverStorage = new ServerStorageManager();
