import type {
  ActivityEntryRecord,
  MasterAnchorRecord,
  VaultMemoryRecord,
} from '../types/console';

const STORAGE_KEYS = {
  ANCHOR: 'ouroboros_razante_anchor_v1',
  MEMORIES: 'ouroboros_razante_memories_v1',
  ACTIVITIES: 'ouroboros_razante_activities_v1',
} as const;

export const DEFAULT_ANCHOR: MasterAnchorRecord = {
  id: 'local_sovereign',
  uid: 'local_sovereign',
  ownerName: 'Prince Ezechiel',
  codename: 'OUROBOROS RAZANTE',
  location: 'Abidjan · Plateau / Cocody',
  coordinates: '5.3599° N · 4.0083° O',
  directive:
    "Maintenir la souveraineté opérationnelle depuis Abidjan, consolider la mémoire stratégique et préserver la continuité d'exécution hors-ligne.",
  posture: 'Souverain',
  focusModules: [
    'Noyau Armure IA',
    'Coffre Mémoire Chiffré',
    'Veille Lagune Ébrié',
    'Continuité Hors-Ligne',
  ],
  checkInCount: 14,
  createdAt: '2026-11-18T08:00:00.000Z',
  updatedAt: '2026-11-18T08:00:00.000Z',
};

export const DEFAULT_MEMORIES: VaultMemoryRecord[] = [
  {
    id: 'mem_protocole_razante',
    uid: 'local_sovereign',
    title: 'Protocole d’Ancrage Souverain — Abidjan GMT+0',
    category: 'Protocole',
    classification: 'Souverain',
    content:
      "Chaque session débute par la vérification de la Carte d'Ancrage Maître. Les directives critiques doivent rester accessibles localement même lors des coupures réseau entre Cocody et le Plateau. Synchronisation prioritaire dès retour de connectivité.",
    tags: ['ancrage', 'abidjan', 'hors-ligne', 'priorite'],
    pinned: true,
    source: 'Noyau Razante',
    createdAt: '2026-11-15T09:15:00.000Z',
    updatedAt: '2026-11-18T07:30:00.000Z',
  },
  {
    id: 'mem_architecture_armure',
    uid: 'local_sovereign',
    title: 'Architecture Cognitive de l’Armure IA',
    category: 'Technique',
    classification: 'Confidentiel',
    content:
      "Séparation stricte entre l'identité opérateur (Firebase Auth Google), le registre public des membres sans PII, et le coffre-fort mémoire indexé par catégories opérationnelles. Les mutations sont validées avant envoi et mises en cache dans IndexedDB.",
    tags: ['architecture', 'firestore', 'pwa', 'securite'],
    pinned: true,
    source: 'Console Technique',
    createdAt: '2026-11-16T14:20:00.000Z',
    updatedAt: '2026-11-17T19:45:00.000Z',
  },
  {
    id: 'mem_strategie_horizon',
    uid: 'local_sovereign',
    title: 'Feuille de Route Afrique de l’Ouest Q4',
    category: 'Stratégie',
    classification: 'Souverain',
    content:
      "Déploiement des interfaces autonomes à faible latence adaptées aux environnements mobiles et desktop d'Abidjan. Priorité à la lisibilité nocturne, au cache local persistant et à la traçabilité des décisions majeures.",
    tags: ['abidjan', 'q4', 'deploiement'],
    pinned: false,
    source: 'Cabinet Ezechiel',
    createdAt: '2026-11-14T11:00:00.000Z',
    updatedAt: '2026-11-16T16:10:00.000Z',
  },
  {
    id: 'mem_note_abidjan',
    uid: 'local_sovereign',
    title: 'Repères Géographiques & Fuseau Horaire GMT+0',
    category: 'Abidjan',
    classification: 'Opérationnel',
    content:
      "Secteur principal : Plateau – Cocody – Zone 4. Fuseau horaire constant GMT+0 (Africa/Abidjan) sans changement d'heure saisonnier. Fenêtre optimale de synchronisation matinale entre 06:30 et 09:00 GMT.",
    tags: ['gmt0', 'plateau', 'cocody'],
    pinned: false,
    source: 'Télémétrie Locale',
    createdAt: '2026-11-12T06:45:00.000Z',
    updatedAt: '2026-11-12T06:45:00.000Z',
  },
];

export const DEFAULT_ACTIVITIES: ActivityEntryRecord[] = [
  {
    id: 'act_boot_abidjan',
    uid: 'local_sovereign',
    memberName: 'Prince Ezechiel',
    actionType: 'ANCRAGE',
    category: 'Initialisation',
    summary: 'Carte d’Ancrage Maître calibrée sur le secteur Abidjan GMT+0',
    details: 'Posture Souverain activée avec continuité hors-ligne PWA.',
    location: 'Abidjan · Plateau',
    createdAt: '2026-11-18T07:30:00.000Z',
  },
  {
    id: 'act_vault_sync',
    uid: 'local_sovereign',
    memberName: 'Prince Ezechiel',
    actionType: 'MEMOIRE',
    category: 'Coffre-fort',
    summary: 'Indexation des protocoles souverains dans le cache local',
    details: '4 entrées disponibles pour consultation hors connexion.',
    location: 'Abidjan · Cocody',
    createdAt: '2026-11-18T07:12:00.000Z',
  },
];

export function loadCachedAnchor(): MasterAnchorRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ANCHOR);
    if (!raw) return DEFAULT_ANCHOR;
    return JSON.parse(raw) as MasterAnchorRecord;
  } catch {
    return DEFAULT_ANCHOR;
  }
}

export function saveCachedAnchor(anchor: MasterAnchorRecord): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ANCHOR, JSON.stringify(anchor));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadCachedMemories(): VaultMemoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (!raw) return DEFAULT_MEMORIES;
    const parsed = JSON.parse(raw) as VaultMemoryRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MEMORIES;
  } catch {
    return DEFAULT_MEMORIES;
  }
}

export function saveCachedMemories(memories: VaultMemoryRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadCachedActivities(): ActivityEntryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!raw) return DEFAULT_ACTIVITIES;
    const parsed = JSON.parse(raw) as ActivityEntryRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ACTIVITIES;
  } catch {
    return DEFAULT_ACTIVITIES;
  }
}

export function saveCachedActivities(activities: ActivityEntryRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  } catch {
    // Ignore storage quota errors
  }
}
