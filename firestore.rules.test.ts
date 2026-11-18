/**
 * Firestore Security Rules Verification Suite (Dirty Dozen Adversarial Payloads)
 * Designed for @firebase/rules-unit-testing against firestore.rules
 */
export const dirtyDozenPayloads = [
  {
    name: '01_identity_spoofing_memory',
    path: 'vault_memories/mem_spoof',
    op: 'create',
    auth: { uid: 'attacker_uid', email_verified: true },
    data: { uid: 'prince_uid', title: 'Spoof', category: 'Protocole', classification: 'Souverain', content: 'Test', tags: [], pinned: false, source: 'HUD', createdAt: 'SERVER_TIME', updatedAt: 'SERVER_TIME' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '02_privilege_escalation_member_create',
    path: 'members/attacker_uid',
    op: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    data: { uid: 'attacker_uid', displayName: 'Attacker', callsign: 'ATK-01', title: 'Fake Sovereign', city: 'Abidjan', role: 'sovereign', status: 'actif', createdAt: 'SERVER_TIME', updatedAt: 'SERVER_TIME' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '03_role_mutation_member_update',
    path: 'members/attacker_uid',
    op: 'update',
    auth: { uid: 'attacker_uid', email_verified: true },
    data: { role: 'sovereign', updatedAt: 'SERVER_TIME' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '04_shadow_field_injection',
    path: 'vault_memories/mem_shadow',
    op: 'create',
    auth: { uid: 'user_uid', email_verified: true },
    data: { uid: 'user_uid', title: 'Legit', category: 'Mémoire', classification: 'Opérationnel', content: 'Contenu valide', tags: ['abidjan'], pinned: false, source: 'Console', ghostField: true, createdAt: 'SERVER_TIME', updatedAt: 'SERVER_TIME' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '05_pii_leak_private_profile',
    path: 'members/prince_uid/private/contact',
    op: 'get',
    auth: { uid: 'other_uid', email_verified: true },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '06_email_spoofing_unverified_admin',
    path: 'activity_history/act_01',
    op: 'list',
    auth: { uid: 'spoof_uid', email: 'keturaepices@gmail.com', email_verified: false },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '07_resource_poisoning_long_id',
    path: `vault_memories/${'a'.repeat(200)}`,
    op: 'create',
    auth: { uid: 'user_uid', email_verified: true },
    data: { uid: 'user_uid', title: 'Long ID', category: 'Technique', classification: 'Opérationnel', content: 'Test', tags: [], pinned: false, source: 'Console', createdAt: 'SERVER_TIME', updatedAt: 'SERVER_TIME' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '08_timestamp_forgery',
    path: 'activity_history/act_forged',
    op: 'create',
    auth: { uid: 'user_uid', email_verified: true },
    data: { uid: 'user_uid', memberName: 'User', actionType: 'SYNC', category: 'Système', summary: 'Sync', location: 'Abidjan', createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '09_owner_mutation_anchor',
    path: 'anchors/user_uid',
    op: 'update',
    auth: { uid: 'user_uid', email_verified: true },
    data: { uid: 'other_uid', updatedAt: 'SERVER_TIME' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '10_unbounded_array_tags',
    path: 'vault_memories/mem_tags',
    op: 'create',
    auth: { uid: 'user_uid', email_verified: true },
    data: { uid: 'user_uid', title: 'Tags Overflow', category: 'Stratégie', classification: 'Confidentiel', content: 'Test', tags: ['1', '2', '3', '4', '5', '6', '7', '8', '9'], pinned: false, source: 'Console', createdAt: 'SERVER_TIME', updatedAt: 'SERVER_TIME' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '11_type_poisoning_anchor_count',
    path: 'anchors/user_uid',
    op: 'update',
    auth: { uid: 'user_uid', email_verified: true },
    data: { checkInCount: 'nan_poison', updatedAt: 'SERVER_TIME' },
    expected: 'PERMISSION_DENIED'
  },
  {
    name: '12_blanket_list_scraping',
    path: 'activity_history',
    op: 'list',
    auth: { uid: 'other_uid', email_verified: true },
    expected: 'PERMISSION_DENIED'
  }
];
