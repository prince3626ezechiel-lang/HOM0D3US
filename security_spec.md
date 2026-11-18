# Spécification de Sécurité Firestore — OUROBOROS RAZANTE

## 1. Invariants de Données
1. **Identité Souveraine** : Aucun utilisateur ne peut créer ou modifier un document (`members`, `anchors`, `vault_memories`, `activity_history`) avec un `uid` différent de `request.auth.uid`.
2. **Isolation PII** : L'adresse e-mail (`email`) et les notes d'habilitation sont strictement isolées dans `/members/{memberId}/private/{docId}`, accessibles uniquement au propriétaire (`memberId == request.auth.uid`) ou à l'administrateur souverain (`keturaepices@gmail.com` vérifié).
3. **Intégrité des Rôles** : Un utilisateur standard ne peut jamais s'auto-attribuer le rôle `sovereign` lors de la création ou de la mise à jour de son profil `/members/{memberId}` (réservé à `isAdmin()`).
4. **Intégrité Temporelle & Immutabilité** : `createdAt` et `uid` sont immuables après création. Les horodatages `createdAt` et `updatedAt` doivent correspondre à `request.time`.
5. **Listes Sécurisées** : Toute requête `list` vérifie `resource.data.uid == request.auth.uid` (ou `isAdmin()`). Aucune lecture globale anonyme ou non filtrée n'est autorisée.

## 2. Les 12 Charges Offensives ("Dirty Dozen")
1. **Identity Spoofing (vault_memories)** : Création d'une mémoire avec `uid: "victim-uid"` par un autre utilisateur authentifié -> `PERMISSION_DENIED`.
2. **Privilege Escalation (members)** : Création d'un document `/members/{uid}` avec `role: "sovereign"` par un utilisateur non-admin -> `PERMISSION_DENIED`.
3. **Role Mutation Update (members)** : Mise à jour de `role` sur `/members/{uid}` par un utilisateur non-admin -> `PERMISSION_DENIED`.
4. **Shadow Field Injection (vault_memories)** : Insertion d'un champ fantôme `isApproved: true` dans `vault_memories` -> `PERMISSION_DENIED`.
5. **PII Leak Read (members/private)** : Lecture de `/members/victim/private/profile` par un autre utilisateur authentifié -> `PERMISSION_DENIED`.
6. **Email Spoofing Admin** : Requête avec `email: "keturaepices@gmail.com"` mais `email_verified: false` -> `PERMISSION_DENIED`.
7. **Resource Poisoning (ID 1.5KB)** : Création d'un document avec un ID de 300 caractères contenant des caractères invalides -> `PERMISSION_DENIED`.
8. **Timestamp Forgery** : Création d'un `activity_history` avec `createdAt` antidaté côté client -> `PERMISSION_DENIED`.
9. **Owner Mutation (anchors)** : Tentative de modification de `uid` lors d'un `update` sur `/anchors/{uid}` -> `PERMISSION_DENIED`.
10. **Unbounded Array Attack (vault_memories)** : Création d'une mémoire avec un tableau `tags` de 15 éléments (> 8) -> `PERMISSION_DENIED`.
11. **Type Poisoning (anchors)** : Mise à jour de `checkInCount` avec une chaîne de caractères au lieu d'un nombre -> `PERMISSION_DENIED`.
12. **Blanket List Scraping (activity_history)** : Requête `list` sans contrainte sur toute la collection `activity_history` par un utilisateur non-admin -> `PERMISSION_DENIED`.
