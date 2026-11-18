export type PostureMode = 'Souverain' | 'Vigilance' | 'Immersion' | 'Veille';
export type MemoryCategory = 'Protocole' | 'Mémoire' | 'Stratégie' | 'Technique' | 'Abidjan';
export type MemoryClassification = 'Souverain' | 'Confidentiel' | 'Opérationnel';
export type MemberRole = 'sovereign' | 'operator' | 'observer';
export type MemberStatus = 'actif' | 'veille' | 'archive';
export type ActivityActionType = 'ANCRAGE' | 'MEMOIRE' | 'AUTH' | 'POSTURE' | 'SYNC';
export type ConsoleTab = 'accueil' | 'coffre' | 'activite' | 'membre';

/**
 * Validation constants synchronized verbatim with firebase-blueprint.json and firestore.rules
 */
export const CONSTRAINTS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  CALLSIGN_PATTERN: /^[A-Z0-9_\- ]+$/,
  DISPLAY_NAME_MAX: 80,
  CALLSIGN_MIN: 2,
  CALLSIGN_MAX: 40,
  TITLE_MAX: 100,
  CITY_MAX: 80,
  CLEARANCE_NOTE_MAX: 240,
  CODENAME_MAX: 60,
  LOCATION_MAX: 100,
  COORDINATES_MAX: 60,
  DIRECTIVE_MIN: 4,
  DIRECTIVE_MAX: 600,
  FOCUS_MODULES_MAX: 6,
  FOCUS_MODULE_MAX_LEN: 60,
  MEMORY_TITLE_MIN: 2,
  MEMORY_TITLE_MAX: 120,
  MEMORY_CONTENT_MIN: 4,
  MEMORY_CONTENT_MAX: 4000,
  MEMORY_TAGS_MAX: 8,
  MEMORY_TAG_MAX_LEN: 40,
  MEMORY_SOURCE_MAX: 80,
  ACTIVITY_SUMMARY_MAX: 180,
  ACTIVITY_DETAILS_MAX: 600,
} as const;

export interface MemberRecord {
  id: string;
  uid: string;
  displayName: string;
  callsign: string;
  title: string;
  city: string;
  role: MemberRole;
  status: MemberStatus;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberPrivateRecord {
  uid: string;
  email: string;
  clearanceNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterAnchorRecord {
  id: string;
  uid: string;
  ownerName: string;
  codename: string;
  location: string;
  coordinates: string;
  directive: string;
  posture: PostureMode;
  focusModules: string[];
  checkInCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultMemoryRecord {
  id: string;
  uid: string;
  title: string;
  category: MemoryCategory;
  classification: MemoryClassification;
  content: string;
  tags: string[];
  pinned: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntryRecord {
  id: string;
  uid: string;
  memberName: string;
  actionType: ActivityActionType;
  category: string;
  summary: string;
  details?: string;
  location: string;
  createdAt: string;
}

export function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

export function sanitizeCallsign(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9_\- ]/g, '')
    .trim()
    .slice(0, CONSTRAINTS.CALLSIGN_MAX);
  return cleaned.length >= CONSTRAINTS.CALLSIGN_MIN ? cleaned : 'RAZANTE-01';
}

export function truncateStr(raw: string, max: number): string {
  return raw.trim().slice(0, max);
}
