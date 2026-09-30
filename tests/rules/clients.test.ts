import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
import { beforeEach, describe, it } from 'vitest'
import { ALICE, BOB, setupRulesEnv } from './helpers.ts'

const { as, anonymous, seed } = setupRulesEnv()

const clientDoc = (uid: string) => ({ name: 'Alice', email: `${uid}@test.com`, createdAt: Timestamp.now() })

describe('clients', () => {
  beforeEach(async () => {
    await seed(`clients/${ALICE}`, clientDoc(ALICE))
    await seed(`clients/${BOB}`, clientDoc(BOB))
  })

  it('lets a client read only its own document', async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), 'clients', ALICE)))
    await assertFails(getDoc(doc(as(ALICE), 'clients', BOB)))
    await assertFails(getDoc(doc(anonymous(), 'clients', ALICE)))
  })

  it('lets a client set its name with merge before the Auth trigger runs', async () => {
    await assertSucceeds(setDoc(doc(as('carol'), 'clients', 'carol'), { name: 'Carol' }, { merge: true }))
  })

  it('lets a client update only its name', async () => {
    await assertSucceeds(updateDoc(doc(as(ALICE), 'clients', ALICE), { name: 'Alice Silva' }))
    await assertFails(updateDoc(doc(as(ALICE), 'clients', ALICE), { email: 'other@test.com' }))
  })

  it('rejects writes to another client document', async () => {
    await assertFails(updateDoc(doc(as(ALICE), 'clients', BOB), { name: 'Hacked' }))
    await assertFails(setDoc(doc(as(ALICE), 'clients', 'carol'), { name: 'Carol' }))
  })

  it('rejects fields other than name on create', async () => {
    await assertFails(setDoc(doc(as('carol'), 'clients', 'carol'), { name: 'Carol', email: 'carol@test.com' }))
  })

  it('rejects invalid names', async () => {
    const ref = doc(as(ALICE), 'clients', ALICE)
    await assertFails(updateDoc(ref, { name: '' }))
    await assertFails(updateDoc(ref, { name: ' Alice ' }))
    await assertFails(updateDoc(ref, { name: 'a'.repeat(81) }))
  })

  it('rejects deletes', async () => {
    await assertFails(deleteDoc(doc(as(ALICE), 'clients', ALICE)))
  })
})
