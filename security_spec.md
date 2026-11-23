# SPG Footland — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Catalogue Public Read / Admin Write**: Anyone (including unauthenticated shoppers) can read `categories`, `products`, `banners`, and `siteInfo/main`. Only verified administrators (`request.auth.token.email_verified == true` and email bootstrapped or present in `/admins/{email}`) may create, update, or delete catalogue records.
2. **Referential Integrity on Products**: A product cannot be created unless its referenced `categoryId` exists in `/categories/{categoryId}`.
3. **PII Isolation**: Customer `enquiries` and newsletter `subscribers` are strictly write-only (`create`) for public visitors. Reading, listing, modifying, or deleting PII is restricted exclusively to verified administrators.
4. **Temporal & Immutability Integrity**: `createdAt` and `updatedAt` timestamps must match `request.time` on creation; `createdAt` is immutable on update and `updatedAt` must match `request.time`.
5. **Anti-Shadow-Field & Resource Poisoning Guards**: Every string field enforces `.size()` bounds, every array enforces `.size()` limits and element type checks, every document ID matches `isValidId()`, and every create/update enforces strict key allowlists (`hasOnly` / `affectedKeys().hasOnly`).
6. **Admin Spoofing Protection**: Admin authorization always requires `request.auth.token.email_verified == true`; unverified email tokens are denied even if the email string matches.

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Vector | Target Path | Expected Result |
|---|---|---|---|
| 1 | Unauthenticated product write | `/products/hack-shoe` (`create`) | `PERMISSION_DENIED` |
| 2 | Unverified email spoofing admin | `/categories/sneakers` (`update` with `email_verified: false`) | `PERMISSION_DENIED` |
| 3 | Ghost / shadow field injection on product | `/products/p1` (`create` with extra `isAdmin: true`) | `PERMISSION_DENIED` |
| 4 | Orphaned product referencing nonexistent category | `/products/p2` (`create` with `categoryId: "nonexistent"`) | `PERMISSION_DENIED` |
| 5 | Client-forged `createdAt` timestamp | `/products/p3` (`create` with past timestamp) | `PERMISSION_DENIED` |
| 6 | Mutating immutable `createdAt` on update | `/products/p1` (`update` modifying `createdAt`) | `PERMISSION_DENIED` |
| 7 | Oversized ID / resource poisoning (>128 chars) | `/enquiries/<200-char-id>` (`create`) | `PERMISSION_DENIED` |
| 8 | Public user reading customer enquiry PII | `/enquiries/enq1` (`get` / `list` unauthenticated or non-admin) | `PERMISSION_DENIED` |
| 9 | Public user pre-marking enquiry as `read: true` | `/enquiries/enq2` (`create` with `read: true`) | `PERMISSION_DENIED` |
| 10 | Public user reading subscriber email list | `/subscribers/sub1` (`get` / `list` non-admin) | `PERMISSION_DENIED` |
| 11 | Non-admin self-promoting into `/admins` | `/admins/attacker@evil.com` (`create` as non-admin) | `PERMISSION_DENIED` |
| 12 | Value poisoning (`price: "free"` or `discountPrice > price`) | `/products/p1` (`update` with invalid type / discount) | `PERMISSION_DENIED` |
