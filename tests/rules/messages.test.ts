import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { beforeEach, describe, it } from 'vitest'
import { ALICE, BOB, messageData, setupRulesEnv } from './helpers.ts'

const { as, seed } = setupRulesEnv()

describe('messages', () => {
  beforeEach(async () => {
    await seed('messages/alice-msg', messageData(ALICE, 'alice-conn'))
    await seed('messages/bob-msg', messageData(BOB, 'bob-conn'))
  })

  it('lets a client read only its own messages', async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), 'messages', 'alice-msg')))
    await assertFails(getDoc(doc(as(ALICE), 'messages', 'bob-msg')))
  })

  it('allows listing only when filtering by the own clientId', async () => {
    const messages = collection(as(ALICE), 'messages')
    await assertSucceeds(getDocs(query(messages, where('clientId', '==', ALICE))))
    await assertFails(getDocs(query(messages, where('connectionId', '==', 'bob-conn'))))
  })

  it('rejects creating messages directly, even for the own client', async () => {
    await assertFails(addDoc(collection(as(ALICE), 'messages'), messageData(ALICE, 'alice-conn')))
  })

  it('rejects forcing a scheduled message to sent', async () => {
    await assertFails(
      updateDoc(doc(as(ALICE), 'messages', 'alice-msg'), { status: 'sent', sentAt: serverTimestamp() }),
    )
  })

  it('rejects overwriting or deleting messages', async () => {
    await assertFails(setDoc(doc(as(ALICE), 'messages', 'alice-msg'), messageData(ALICE, 'alice-conn')))
    await assertFails(deleteDoc(doc(as(ALICE), 'messages', 'alice-msg')))
  })
})

describe('messageRevisions', () => {
  const revision = (clientId: string) => ({
    clientId,
    messageId: `${clientId}-msg`,
    body: 'Texto anterior',
    contactIds: ['contact-1'],
    scheduledAt: null,
    createdAt: serverTimestamp(),
  })

  beforeEach(async () => {
    await seed('messageRevisions/alice-rev', { ...revision(ALICE), createdAt: null })
    await seed('messageRevisions/bob-rev', { ...revision(BOB), createdAt: null })
  })

  it('lets a client read only its own revisions', async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), 'messageRevisions', 'alice-rev')))
    await assertFails(getDoc(doc(as(ALICE), 'messageRevisions', 'bob-rev')))
  })

  it('rejects writing revisions directly', async () => {
    await assertFails(addDoc(collection(as(ALICE), 'messageRevisions'), revision(ALICE)))
    await assertFails(deleteDoc(doc(as(ALICE), 'messageRevisions', 'alice-rev')))
  })
})
