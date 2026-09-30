/**
 * T-011 — One-off backfill (NOT run in this deploy).
 *
 * After attachments storage is verified in production:
 * 1. For each patient with non-null national_id_front / national_id_back / national_id_photo:
 *    decode base64 → upload via StorageService → insert attachments row.
 * 2. Verify counts match (script should log expected vs created).
 * 3. In a **separate** migration, NULL the text columns; later drop national_id_photo.
 *
 * Usage (future): ts-node scripts/backfill-patient-attachments.stub.ts
 */
console.log('Backfill stub: implement before production column drop. See docs/tasks/T-011-file-storage.md');
