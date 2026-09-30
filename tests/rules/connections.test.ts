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
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { beforeEach, describe, it } from 'vitest'
import { ALICE, BOB, connectionData, setupRulesEnv } from './helpers.ts'

const { as, anonymous, seed } = setupRulesEnv()

const newConnection = (clientId: string) => ({
  clientId,
  name: 'Loja Centro',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})

describe('connections', () => {
  beforeEach(async () => {
    await seed('connections/alice-conn', connectionData(ALICE))
    await seed('connections/bob-conn', connectionData(BOB))
  })

  describe('read', () => {
    it('lets a client read its own connection', async () => {
      await assertSucceeds(getDoc(doc(as(ALICE), 'connections', 'alice-conn')))
    })

    it('rejects reading another client connection', async () => {
      await assertFails(getDoc(doc(as(ALICE), 'connections', 'bob-conn')))
      await assertFails(getDoc(doc(anonymous(), 'connections', 'alice-conn')))
    })

    it('allows listing only when filtering by the own clientId', async () => {
      const connections = collection(as(ALICE), 'connections')
      await assertSucceeds(getDocs(query(connections, where('clientId', '==', ALICE))))
      await assertFails(getDocs(query(connections, where('clientId', '==', BOB))))
      await assertFails(getDocs(connections))
    })
  })

  describe('create', () => {
    it('lets a client create a connection for itself', async () => {
      await assertSucceeds(addDoc(collection(as(ALICE), 'connections'), newConnection(ALICE)))
    })

    it('rejects creating a connection under another clientId', async () => {
      await assertFails(addDoc(collection(as(ALICE), 'connections'), newConnection(BOB)))
      await assertFails(addDoc(collection(anonymous(), 'connections'), newConnection(ALICE)))
    })

    it('rejects extra or missing fields', async () => {
      const connections = collection(as(ALICE), 'connections')
      await assertFails(addDoc(connections, { ...newConnection(ALICE), plan: 'premium' }))
      const { updatedAt: _, ...withoutUpdatedAt } = newConnection(ALICE)
      await assertFails(addDoc(connections, withoutUpdatedAt))
    })

    it('rejects client-provided timestamps', async () => {
      const yesterday = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000)
      await assertFails(
        addDoc(collection(as(ALICE), 'connections'), { ...newConnection(ALICE), createdAt: yesterday }),
      )
    })

    it('rejects invalid names', async () => {
      const connections = collection(as(ALICE), 'connections')
      await assertFails(addDoc(connections, { ...newConnection(ALICE), name: '' }))
      await assertFails(addDoc(connections, { ...newConnection(ALICE), name: 42 }))
    })
  })

  describe('update', () => {
    it('lets a client rename its connection', async () => {
      await assertSucceeds(
        updateDoc(doc(as(ALICE), 'connections', 'alice-conn'), { name: 'Loja Sul', updatedAt: serverTimestamp() }),
      )
    })

    it('rejects moving a connection to another client', async () => {
      await assertFails(
        updateDoc(doc(as(ALICE), 'connections', 'alice-conn'), { clientId: BOB, updatedAt: serverTimestamp() }),
      )
    })

    it('rejects updating another client connection', async () => {
      await assertFails(
        updateDoc(doc(as(ALICE), 'connections', 'bob-conn'), { name: 'Hacked', updatedAt: serverTimestamp() }),
      )
    })

    it('requires updatedAt to be the server time', async () => {
      await assertFails(updateDoc(doc(as(ALICE), 'connections', 'alice-conn'), { name: 'Loja Sul' }))
    })
  })

  it('rejects deletes, which go through a Cloud Function', async () => {
    await assertFails(deleteDoc(doc(as(ALICE), 'connections', 'alice-conn')))
  })
})
