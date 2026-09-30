import { WRITE_BATCH_LIMIT } from '@broadcast/shared'
import type { DocumentReference, Firestore } from 'firebase-admin/firestore'

// Plain batches instead of BulkWriter: a failed write rejects here and reaches the caller,
// while BulkWriter only reports failures through a callback.
export const deleteInBatches = async (db: Firestore, refs: DocumentReference[]) => {
  for (let start = 0; start < refs.length; start += WRITE_BATCH_LIMIT) {
    const batch = db.batch()
    refs.slice(start, start + WRITE_BATCH_LIMIT).forEach((ref) => batch.delete(ref))
    await batch.commit()
  }
}

export const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size))
