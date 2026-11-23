/**
 * SPG Footland Firestore Security Rules — Dirty Dozen Test Suite
 *
 * Run against the Firebase Firestore Emulator using @firebase/rules-unit-testing:
 *   firebase emulators:exec "npx tsx firestore.rules.test.ts"
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  actor: 'anonymous' | 'unverified_admin' | 'customer' | 'admin';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated product creation',
    actor: 'anonymous',
    operation: 'create',
    path: 'products/hack-shoe',
    payload: { name: 'Fake Shoe', price: 100 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified email spoofing bootstrap admin',
    actor: 'unverified_admin',
    operation: 'update',
    path: 'categories/sneakers',
    payload: { name: 'Hijacked' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Ghost / shadow field injection on product create',
    actor: 'admin',
    operation: 'create',
    path: 'products/shadow-shoe',
    payload: { name: 'Air Sprint', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Orphaned product referencing nonexistent category',
    actor: 'admin',
    operation: 'create',
    path: 'products/orphan-shoe',
    payload: { categoryId: 'does-not-exist', categorySlug: 'ghost' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Client-forged createdAt timestamp on product',
    actor: 'admin',
    operation: 'create',
    path: 'products/forged-time',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Mutating immutable createdAt on product update',
    actor: 'admin',
    operation: 'update',
    path: 'products/snk-01',
    payload: { createdAt: '2025-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Resource poisoning via >128 char document ID',
    actor: 'anonymous',
    operation: 'create',
    path: `enquiries/${'a'.repeat(200)}`,
    payload: { name: 'Spam', email: 'a@b.com', phone: '', message: 'Hi', read: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Non-admin reading customer enquiry PII',
    actor: 'customer',
    operation: 'get',
    path: 'enquiries/enq-1',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Public visitor pre-marking enquiry as read=true',
    actor: 'anonymous',
    operation: 'create',
    path: 'enquiries/enq-2',
    payload: { name: 'Test', email: 'test@example.com', phone: '9999999999', message: 'Hi', read: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Non-admin listing newsletter subscriber emails',
    actor: 'customer',
    operation: 'list',
    path: 'subscribers',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Non-admin self-promoting into /admins collection',
    actor: 'customer',
    operation: 'create',
    path: 'admins/attacker@evil.com',
    payload: { email: 'attacker@evil.com' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Value poisoning with discountPrice greater than price',
    actor: 'admin',
    operation: 'update',
    path: 'products/snk-01',
    payload: { price: 1999, discountPrice: 2999 },
    expected: 'PERMISSION_DENIED',
  },
];
