import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  formatFirestoreTimestamp,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../lib/firebase';
import {
  DEFAULT_ACTIVITIES,
  DEFAULT_ANCHOR,
  DEFAULT_MEMORIES,
  loadCachedActivities,
  loadCachedAnchor,
  loadCachedMemories,
  saveCachedActivities,
  saveCachedAnchor,
  saveCachedMemories,
} from '../lib/offlineCache';
import {
  CONSTRAINTS,
  sanitizeCallsign,
  sanitizeId,
  truncateStr,
  type ActivityActionType,
  type ActivityEntryRecord,
  type MasterAnchorRecord,
  type MemberPrivateRecord,
  type MemberRecord,
  type MemberStatus,
  type MemoryCategory,
  type MemoryClassification,
  type PostureMode,
  type VaultMemoryRecord,
} from '../types/console';

const SOVEREIGN_ADMIN_EMAIL = 'keturaepices@gmail.com';

interface ConsoleContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  firestoreConnected: boolean | null;
  loadingData: boolean;
  authError: string | null;
  syncNotice: string | null;
  anchor: MasterAnchorRecord;
  memories: VaultMemoryRecord[];
  activities: ActivityEntryRecord[];
  members: MemberRecord[];
  currentMember: MemberRecord | null;
  privateProfile: MemberPrivateRecord | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateAnchor: (updates: Partial<Pick<MasterAnchorRecord, 'ownerName' | 'codename' | 'location' | 'coordinates' | 'directive' | 'posture' | 'focusModules'>>) => Promise<void>;
  logAnchorCheckIn: () => Promise<void>;
  createMemory: (input: {
    title: string;
    category: MemoryCategory;
    classification: MemoryClassification;
    content: string;
    tags: string[];
    pinned: boolean;
    source: string;
  }) => Promise<VaultMemoryRecord>;
  updateMemory: (
    memoryId: string,
    updates: Partial<Pick<VaultMemoryRecord, 'title' | 'category' | 'classification' | 'content' | 'tags' | 'pinned' | 'source'>>
  ) => Promise<void>;
  togglePinMemory: (memoryId: string) => Promise<void>;
  deleteMemory: (memoryId: string) => Promise<void>;
  updateMemberProfile: (input: {
    displayName: string;
    callsign: string;
    title: string;
    city: string;
    status: MemberStatus;
    clearanceNote: string;
  }) => Promise<void>;
  clearSyncNotice: () => void;
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export const ConsoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [anchor, setAnchor] = useState<MasterAnchorRecord>(() => loadCachedAnchor());
  const [memories, setMemories] = useState<VaultMemoryRecord[]>(() => loadCachedMemories());
  const [activities, setActivities] = useState<ActivityEntryRecord[]>(() => loadCachedActivities());
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [privateProfile, setPrivateProfile] = useState<MemberPrivateRecord | null>(null);

  const isAdmin = useMemo(() => {
    return !!(user?.email === SOVEREIGN_ADMIN_EMAIL && user?.emailVerified);
  }, [user]);

  const currentMember = useMemo(() => {
    if (!user) return null;
    return members.find((m) => m.uid === user.uid) ?? null;
  }, [members, user]);

  useEffect(() => {
    testConnection().then((ok) => setFirestoreConnected(ok));
  }, []);

  const recordActivity = useCallback(
    async (
      targetUser: User | null,
      memberName: string,
      actionType: ActivityActionType,
      category: string,
      summary: string,
      details?: string,
      location = 'Abidjan · Plateau'
    ) => {
      const safeSummary = truncateStr(summary, CONSTRAINTS.ACTIVITY_SUMMARY_MAX);
      const safeDetails = details ? truncateStr(details, CONSTRAINTS.ACTIVITY_DETAILS_MAX) : undefined;
      const safeName = truncateStr(memberName || 'Prince Ezechiel', CONSTRAINTS.DISPLAY_NAME_MAX);
      const safeLocation = truncateStr(location, CONSTRAINTS.LOCATION_MAX);

      if (!targetUser) {
        const localEntry: ActivityEntryRecord = {
          id: `act_${Date.now()}`,
          uid: 'local_sovereign',
          memberName: safeName,
          actionType,
          category: truncateStr(category, 60),
          summary: safeSummary,
          details: safeDetails,
          location: safeLocation,
          createdAt: new Date().toISOString(),
        };
        setActivities((prev) => {
          const next = [localEntry, ...prev].slice(0, 60);
          saveCachedActivities(next);
          return next;
        });
        return;
      }

      const actId = sanitizeId(`act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
      const path = `activity_history/${actId}`;
      try {
        await setDoc(doc(db, 'activity_history', actId), {
          uid: targetUser.uid,
          memberName: safeName,
          actionType,
          category: truncateStr(category, 60),
          summary: safeSummary,
          ...(safeDetails ? { details: safeDetails } : {}),
          location: safeLocation,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    []
  );

  const bootstrapUserWorkspace = useCallback(async (authUser: User) => {
    const uid = sanitizeId(authUser.uid);
    const displayName = truncateStr(authUser.displayName || 'Prince Ezechiel', CONSTRAINTS.DISPLAY_NAME_MAX);
    const isSovereign = authUser.email === SOVEREIGN_ADMIN_EMAIL && authUser.emailVerified;

    // 1. Ensure Member public profile exists
    const memberRef = doc(db, 'members', uid);
    try {
      const memberSnap = await getDoc(memberRef);
      if (!memberSnap.exists()) {
        await setDoc(memberRef, {
          uid,
          displayName,
          callsign: isSovereign ? 'PRINCE-EZECHIEL-01' : sanitizeCallsign(displayName.split(' ')[0] || 'OP-ABJ'),
          title: isSovereign ? 'Architecte Souverain · Armure IA' : 'Opérateur Razante',
          city: 'Abidjan',
          role: isSovereign ? 'sovereign' : 'operator',
          status: 'actif',
          ...(authUser.photoURL ? { photoUrl: truncateStr(authUser.photoURL, 500) } : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `members/${uid}`);
    }

    // 2. Ensure Isolated Private PII record exists
    const privateRef = doc(db, 'members', uid, 'private', 'contact');
    try {
      const privateSnap = await getDoc(privateRef);
      if (!privateSnap.exists() && authUser.email) {
        await setDoc(privateRef, {
          uid,
          email: truncateStr(authUser.email, 160),
          clearanceNote: isSovereign
            ? 'Accès maître complet — Console Abidjan GMT+0'
            : 'Opérateur authentifié via Google Workspace',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `members/${uid}/private/contact`);
    }

    // 3. Ensure Master Anchor exists
    const anchorRef = doc(db, 'anchors', uid);
    try {
      const anchorSnap = await getDoc(anchorRef);
      if (!anchorSnap.exists()) {
        const cached = loadCachedAnchor();
        await setDoc(anchorRef, {
          uid,
          ownerName: truncateStr(isSovereign ? 'Prince Ezechiel' : displayName, CONSTRAINTS.DISPLAY_NAME_MAX),
          codename: truncateStr(cached.codename || DEFAULT_ANCHOR.codename, CONSTRAINTS.CODENAME_MAX),
          location: truncateStr(cached.location || DEFAULT_ANCHOR.location, CONSTRAINTS.LOCATION_MAX),
          coordinates: truncateStr(cached.coordinates || DEFAULT_ANCHOR.coordinates, CONSTRAINTS.COORDINATES_MAX),
          directive: truncateStr(cached.directive || DEFAULT_ANCHOR.directive, CONSTRAINTS.DIRECTIVE_MAX),
          posture: cached.posture || 'Souverain',
          focusModules: (cached.focusModules || DEFAULT_ANCHOR.focusModules).slice(0, CONSTRAINTS.FOCUS_MODULES_MAX),
          checkInCount: cached.checkInCount || 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `anchors/${uid}`);
    }

    // 4. Seed initial Memory Vault entries if empty for this user
    try {
      const memQuery = query(collection(db, 'vault_memories'), where('uid', '==', uid));
      const memSnap = await getDocs(memQuery);
      if (memSnap.empty) {
        const batch = writeBatch(db);
        DEFAULT_MEMORIES.forEach((mem, idx) => {
          const memId = sanitizeId(`seed_${uid.slice(0, 8)}_${idx}_${Date.now()}`);
          batch.set(doc(db, 'vault_memories', memId), {
            uid,
            title: truncateStr(mem.title, CONSTRAINTS.MEMORY_TITLE_MAX),
            category: mem.category,
            classification: mem.classification,
            content: truncateStr(mem.content, CONSTRAINTS.MEMORY_CONTENT_MAX),
            tags: mem.tags.slice(0, CONSTRAINTS.MEMORY_TAGS_MAX),
            pinned: mem.pinned,
            source: truncateStr(mem.source, CONSTRAINTS.MEMORY_SOURCE_MAX),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'vault_memories');
    }

    // 5. Log authentication event in activity_history
    await recordActivity(
      authUser,
      displayName,
      'AUTH',
      'Session Google',
      `Connexion opérateur vérifiée (${displayName})`,
      'Synchronisation Firestore et cache hors-ligne activés.',
      'Abidjan · GMT+0'
    );
  }, [recordActivity]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setMembers([]);
        setPrivateProfile(null);
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      try {
        await bootstrapUserWorkspace(nextUser);
      } catch (err) {
        console.error('Erreur initialisation espace:', err);
      } finally {
        setLoadingData(false);
      }
    });

    return () => unsubscribeAuth();
  }, [bootstrapUserWorkspace]);

  // Attach real-time Firestore listeners ONLY when authReady && user
  useEffect(() => {
    if (!authReady || !user) return;

    const uid = sanitizeId(user.uid);
    const adminView = user.email === SOVEREIGN_ADMIN_EMAIL && user.emailVerified;

    // 1. Anchor listener
    const anchorPath = `anchors/${uid}`;
    const unsubAnchor = onSnapshot(
      doc(db, 'anchors', uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const nextAnchor: MasterAnchorRecord = {
            id: snap.id,
            uid: d.uid,
            ownerName: d.ownerName,
            codename: d.codename,
            location: d.location,
            coordinates: d.coordinates,
            directive: d.directive,
            posture: d.posture as PostureMode,
            focusModules: Array.isArray(d.focusModules) ? d.focusModules : [],
            checkInCount: typeof d.checkInCount === 'number' ? d.checkInCount : 0,
            createdAt: formatFirestoreTimestamp(d.createdAt),
            updatedAt: formatFirestoreTimestamp(d.updatedAt),
          };
          setAnchor(nextAnchor);
          saveCachedAnchor(nextAnchor);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, anchorPath)
    );

    // 2. Memories listener
    const memQuery = adminView
      ? query(collection(db, 'vault_memories'), orderBy('updatedAt', 'desc'))
      : query(collection(db, 'vault_memories'), where('uid', '==', uid), orderBy('updatedAt', 'desc'));
    const unsubMemories = onSnapshot(
      memQuery,
      (snap) => {
        const list: VaultMemoryRecord[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            uid: d.uid,
            title: d.title,
            category: d.category as MemoryCategory,
            classification: d.classification as MemoryClassification,
            content: d.content,
            tags: Array.isArray(d.tags) ? d.tags : [],
            pinned: Boolean(d.pinned),
            source: d.source,
            createdAt: formatFirestoreTimestamp(d.createdAt),
            updatedAt: formatFirestoreTimestamp(d.updatedAt),
          };
        });
        setMemories(list);
        if (list.length > 0) saveCachedMemories(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'vault_memories')
    );

    // 3. Activity history listener
    const actQuery = adminView
      ? query(collection(db, 'activity_history'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'activity_history'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const unsubActivities = onSnapshot(
      actQuery,
      (snap) => {
        const list: ActivityEntryRecord[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            uid: d.uid,
            memberName: d.memberName,
            actionType: d.actionType as ActivityActionType,
            category: d.category,
            summary: d.summary,
            details: d.details,
            location: d.location,
            createdAt: formatFirestoreTimestamp(d.createdAt),
          };
        });
        setActivities(list);
        if (list.length > 0) saveCachedActivities(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'activity_history')
    );

    // 4. Members listener
    const membersQuery = adminView
      ? query(collection(db, 'members'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'members'), where('uid', '==', uid));
    const unsubMembers = onSnapshot(
      membersQuery,
      (snap) => {
        const list: MemberRecord[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            uid: d.uid,
            displayName: d.displayName,
            callsign: d.callsign,
            title: d.title,
            city: d.city,
            role: d.role,
            status: d.status,
            photoUrl: d.photoUrl,
            createdAt: formatFirestoreTimestamp(d.createdAt),
            updatedAt: formatFirestoreTimestamp(d.updatedAt),
          };
        });
        setMembers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'members')
    );

    // 5. Private PII profile listener
    const privPath = `members/${uid}/private/contact`;
    const unsubPrivate = onSnapshot(
      doc(db, 'members', uid, 'private', 'contact'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setPrivateProfile({
            uid: d.uid,
            email: d.email,
            clearanceNote: d.clearanceNote,
            createdAt: formatFirestoreTimestamp(d.createdAt),
            updatedAt: formatFirestoreTimestamp(d.updatedAt),
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, privPath)
    );

    return () => {
      unsubAnchor();
      unsubMemories();
      unsubActivities();
      unsubMembers();
      unsubPrivate();
    };
  }, [authReady, user]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setSyncNotice('Session Google authentifiée et synchronisée avec ouroboros-maison.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion Google';
      setAuthError(msg);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setSyncNotice('Session fermée. Cache hors-ligne local conservé.');
  }, []);

  const updateAnchor = useCallback(
    async (
      updates: Partial<
        Pick<
          MasterAnchorRecord,
          'ownerName' | 'codename' | 'location' | 'coordinates' | 'directive' | 'posture' | 'focusModules'
        >
      >
    ) => {
      const sanitized: Record<string, unknown> = {};
      if (updates.ownerName !== undefined)
        sanitized.ownerName = truncateStr(updates.ownerName, CONSTRAINTS.DISPLAY_NAME_MAX) || 'Prince Ezechiel';
      if (updates.codename !== undefined)
        sanitized.codename = truncateStr(updates.codename, CONSTRAINTS.CODENAME_MAX) || 'OUROBOROS RAZANTE';
      if (updates.location !== undefined)
        sanitized.location = truncateStr(updates.location, CONSTRAINTS.LOCATION_MAX) || 'Abidjan';
      if (updates.coordinates !== undefined)
        sanitized.coordinates = truncateStr(updates.coordinates, CONSTRAINTS.COORDINATES_MAX) || '5.3599° N · 4.0083° O';
      if (updates.directive !== undefined) {
        const dir = truncateStr(updates.directive, CONSTRAINTS.DIRECTIVE_MAX);
        sanitized.directive = dir.length >= CONSTRAINTS.DIRECTIVE_MIN ? dir : DEFAULT_ANCHOR.directive;
      }
      if (updates.posture !== undefined) sanitized.posture = updates.posture;
      if (updates.focusModules !== undefined) {
        sanitized.focusModules = updates.focusModules
          .map((m) => truncateStr(m, CONSTRAINTS.FOCUS_MODULE_MAX_LEN))
          .filter(Boolean)
          .slice(0, CONSTRAINTS.FOCUS_MODULES_MAX);
      }

      if (!user) {
        const nextAnchor: MasterAnchorRecord = {
          ...anchor,
          ...(sanitized as Partial<MasterAnchorRecord>),
          updatedAt: new Date().toISOString(),
        };
        setAnchor(nextAnchor);
        saveCachedAnchor(nextAnchor);
        await recordActivity(
          null,
          nextAnchor.ownerName,
          updates.posture ? 'POSTURE' : 'ANCRAGE',
          'Ancrage Local',
          updates.posture
            ? `Posture basculée sur ${updates.posture}`
            : 'Directive de la Carte d’Ancrage Maître mise à jour',
          undefined,
          nextAnchor.location
        );
        setSyncNotice('Modification enregistrée localement (mode hors-ligne).');
        return;
      }

      const uid = sanitizeId(user.uid);
      const path = `anchors/${uid}`;
      try {
        await updateDoc(doc(db, 'anchors', uid), {
          ...sanitized,
          updatedAt: serverTimestamp(),
        });
        await recordActivity(
          user,
          (sanitized.ownerName as string) || anchor.ownerName,
          updates.posture ? 'POSTURE' : 'ANCRAGE',
          'Ancrage Maître',
          updates.posture
            ? `Posture opérationnelle activée : ${updates.posture}`
            : 'Directive et modules de la Carte d’Ancrage mis à jour',
          undefined,
          (sanitized.location as string) || anchor.location
        );
        setSyncNotice('Carte d’Ancrage Maître synchronisée.');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [anchor, recordActivity, user]
  );

  const logAnchorCheckIn = useCallback(async () => {
    if (!user) {
      const nextAnchor: MasterAnchorRecord = {
        ...anchor,
        checkInCount: anchor.checkInCount + 1,
        updatedAt: new Date().toISOString(),
      };
      setAnchor(nextAnchor);
      saveCachedAnchor(nextAnchor);
      await recordActivity(
        null,
        anchor.ownerName,
        'ANCRAGE',
        'Pointage Abidjan',
        `Ancrage #${nextAnchor.checkInCount} validé en local (${anchor.posture})`,
        anchor.directive,
        anchor.location
      );
      setSyncNotice(`Ancrage #${nextAnchor.checkInCount} enregistré localement.`);
      return;
    }

    const uid = sanitizeId(user.uid);
    const path = `anchors/${uid}`;
    const nextCount = anchor.checkInCount + 1;
    try {
      await updateDoc(doc(db, 'anchors', uid), {
        checkInCount: nextCount,
        updatedAt: serverTimestamp(),
      });
      await recordActivity(
        user,
        anchor.ownerName,
        'ANCRAGE',
        'Pointage Souverain',
        `Ancrage #${nextCount} confirmé — Posture ${anchor.posture}`,
        anchor.directive,
        anchor.location
      );
      setSyncNotice(`Ancrage #${nextCount} consigné dans Firestore.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }, [anchor, recordActivity, user]);

  const createMemory = useCallback(
    async (input: {
      title: string;
      category: MemoryCategory;
      classification: MemoryClassification;
      content: string;
      tags: string[];
      pinned: boolean;
      source: string;
    }): Promise<VaultMemoryRecord> => {
      const cleanTitle = truncateStr(input.title, CONSTRAINTS.MEMORY_TITLE_MAX);
      const cleanContent = truncateStr(input.content, CONSTRAINTS.MEMORY_CONTENT_MAX);
      const cleanSource = truncateStr(input.source || 'Console Abidjan', CONSTRAINTS.MEMORY_SOURCE_MAX);
      const cleanTags = input.tags
        .map((t) => truncateStr(t.toLowerCase(), CONSTRAINTS.MEMORY_TAG_MAX_LEN))
        .filter(Boolean)
        .slice(0, CONSTRAINTS.MEMORY_TAGS_MAX);

      const memId = sanitizeId(`mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
      const nowIso = new Date().toISOString();

      if (!user) {
        const localMem: VaultMemoryRecord = {
          id: memId,
          uid: 'local_sovereign',
          title: cleanTitle,
          category: input.category,
          classification: input.classification,
          content: cleanContent,
          tags: cleanTags,
          pinned: input.pinned,
          source: cleanSource,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        setMemories((prev) => {
          const next = [localMem, ...prev];
          saveCachedMemories(next);
          return next;
        });
        await recordActivity(
          null,
          anchor.ownerName,
          'MEMOIRE',
          input.category,
          `Nouvelle entrée dans le coffre : ${cleanTitle}`,
          undefined,
          anchor.location
        );
        return localMem;
      }

      const uid = sanitizeId(user.uid);
      const path = `vault_memories/${memId}`;
      try {
        await setDoc(doc(db, 'vault_memories', memId), {
          uid,
          title: cleanTitle,
          category: input.category,
          classification: input.classification,
          content: cleanContent,
          tags: cleanTags,
          pinned: input.pinned,
          source: cleanSource,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await recordActivity(
          user,
          anchor.ownerName,
          'MEMOIRE',
          input.category,
          `Entrée archivée : ${cleanTitle}`,
          `Classification ${input.classification}`,
          anchor.location
        );
        setSyncNotice('Mémoire enregistrée dans le coffre-fort.');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }

      return {
        id: memId,
        uid,
        title: cleanTitle,
        category: input.category,
        classification: input.classification,
        content: cleanContent,
        tags: cleanTags,
        pinned: input.pinned,
        source: cleanSource,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    },
    [anchor.location, anchor.ownerName, recordActivity, user]
  );

  const updateMemory = useCallback(
    async (
      memoryId: string,
      updates: Partial<
        Pick<VaultMemoryRecord, 'title' | 'category' | 'classification' | 'content' | 'tags' | 'pinned' | 'source'>
      >
    ) => {
      const sanitized: Record<string, unknown> = {};
      if (updates.title !== undefined)
        sanitized.title = truncateStr(updates.title, CONSTRAINTS.MEMORY_TITLE_MAX);
      if (updates.category !== undefined) sanitized.category = updates.category;
      if (updates.classification !== undefined) sanitized.classification = updates.classification;
      if (updates.content !== undefined)
        sanitized.content = truncateStr(updates.content, CONSTRAINTS.MEMORY_CONTENT_MAX);
      if (updates.tags !== undefined)
        sanitized.tags = updates.tags
          .map((t) => truncateStr(t.toLowerCase(), CONSTRAINTS.MEMORY_TAG_MAX_LEN))
          .filter(Boolean)
          .slice(0, CONSTRAINTS.MEMORY_TAGS_MAX);
      if (updates.pinned !== undefined) sanitized.pinned = updates.pinned;
      if (updates.source !== undefined)
        sanitized.source = truncateStr(updates.source, CONSTRAINTS.MEMORY_SOURCE_MAX);

      if (!user) {
        setMemories((prev) => {
          const next = prev.map((m) =>
            m.id === memoryId
              ? { ...m, ...(sanitized as Partial<VaultMemoryRecord>), updatedAt: new Date().toISOString() }
              : m
          );
          saveCachedMemories(next);
          return next;
        });
        return;
      }

      const path = `vault_memories/${memoryId}`;
      try {
        await updateDoc(doc(db, 'vault_memories', memoryId), {
          ...sanitized,
          updatedAt: serverTimestamp(),
        });
        setSyncNotice('Mémoire mise à jour.');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const togglePinMemory = useCallback(
    async (memoryId: string) => {
      const target = memories.find((m) => m.id === memoryId);
      if (!target) return;

      if (!user) {
        setMemories((prev) => {
          const next = prev.map((m) =>
            m.id === memoryId ? { ...m, pinned: !m.pinned, updatedAt: new Date().toISOString() } : m
          );
          saveCachedMemories(next);
          return next;
        });
        return;
      }

      const path = `vault_memories/${memoryId}`;
      try {
        await updateDoc(doc(db, 'vault_memories', memoryId), {
          pinned: !target.pinned,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [memories, user]
  );

  const deleteMemory = useCallback(
    async (memoryId: string) => {
      const target = memories.find((m) => m.id === memoryId);
      if (!user) {
        setMemories((prev) => {
          const next = prev.filter((m) => m.id !== memoryId);
          saveCachedMemories(next);
          return next;
        });
        return;
      }

      const path = `vault_memories/${memoryId}`;
      try {
        await deleteDoc(doc(db, 'vault_memories', memoryId));
        if (target) {
          await recordActivity(
            user,
            anchor.ownerName,
            'MEMOIRE',
            'Suppression',
            `Entrée retirée du coffre : ${target.title}`,
            undefined,
            anchor.location
          );
        }
        setSyncNotice('Entrée supprimée du coffre-fort.');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [anchor.location, anchor.ownerName, memories, recordActivity, user]
  );

  const updateMemberProfile = useCallback(
    async (input: {
      displayName: string;
      callsign: string;
      title: string;
      city: string;
      status: MemberStatus;
      clearanceNote: string;
    }) => {
      if (!user) return;
      const uid = sanitizeId(user.uid);
      const cleanName = truncateStr(input.displayName, CONSTRAINTS.DISPLAY_NAME_MAX) || 'Opérateur';
      const cleanCallsign = sanitizeCallsign(input.callsign);
      const cleanTitle = truncateStr(input.title, CONSTRAINTS.TITLE_MAX) || 'Opérateur Razante';
      const cleanCity = truncateStr(input.city, CONSTRAINTS.CITY_MAX) || 'Abidjan';
      const cleanNote = truncateStr(input.clearanceNote, CONSTRAINTS.CLEARANCE_NOTE_MAX);

      try {
        await updateDoc(doc(db, 'members', uid), {
          displayName: cleanName,
          callsign: cleanCallsign,
          title: cleanTitle,
          city: cleanCity,
          status: input.status,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `members/${uid}`);
      }

      if (user.email) {
        try {
          await updateDoc(doc(db, 'members', uid, 'private', 'contact'), {
            email: truncateStr(user.email, 160),
            clearanceNote: cleanNote,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `members/${uid}/private/contact`);
        }
      }

      await recordActivity(
        user,
        cleanName,
        'SYNC',
        'Profil Membre',
        `Profil opérateur mis à jour (${cleanCallsign})`,
        `Ville : ${cleanCity} · Statut : ${input.status}`,
        cleanCity
      );
      setSyncNotice('Profil membre synchronisé.');
    },
    [recordActivity, user]
  );

  const clearSyncNotice = useCallback(() => setSyncNotice(null), []);

  const value: ConsoleContextValue = {
    user,
    authReady,
    isAdmin,
    firestoreConnected,
    loadingData,
    authError,
    syncNotice,
    anchor,
    memories,
    activities,
    members,
    currentMember,
    privateProfile,
    signInWithGoogle,
    signOutUser,
    updateAnchor,
    logAnchorCheckIn,
    createMemory,
    updateMemory,
    togglePinMemory,
    deleteMemory,
    updateMemberProfile,
    clearSyncNotice,
  };

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
};

export function useConsole() {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error('useConsole doit être utilisé dans ConsoleProvider');
  return ctx;
}
