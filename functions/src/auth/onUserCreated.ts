import { COLLECTIONS, FUNCTIONS_REGION } from '@broadcast/shared'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { region } from 'firebase-functions/v1'

// v2 has no non-blocking user creation trigger. Merge keeps the name the web app may have written first.
export const onUserCreated = region(FUNCTIONS_REGION)
  .auth.user()
  .onCreate((user) =>
    getFirestore()
      .doc(`${COLLECTIONS.clients}/${user.uid}`)
      .set({ email: user.email ?? '', createdAt: FieldValue.serverTimestamp() }, { merge: true }),
  )
