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
  updateDoc,
  where,
} from 'firebase/firestore'
import { beforeEach, describe, it } from 'vitest'
import { ALICE, BOB, connectionData, contactData, setupRulesEnv } from './helpers.ts'

const { as, seed } = setupRulesEnv()

const newContact = (clientId: string, connectionId: string) => ({
  clientId,
  connectionId,
  name: 'Ana',
  phone: '+5511999999999',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})

describe('contacts', () => {
  beforeEach(async () => {
    await seed('connections/alice-conn', connectionData(ALICE))
    await seed('connections/alice-conn-2', connectionData(ALICE))
    await seed('connections/bob-conn', connectionData(BOB))
    await seed('contacts/alice-contact', contactData(ALICE, 'alice-conn'))
    await seed('contacts/bob-contact', contactData(BOB, 'bob-conn'))
  })

  describe('read', () => {
    it('lets a client read only its own contacts', async () => {
      await assertSucceeds(getDoc(doc(as(ALICE), 'contacts', 'alice-contact')))
      await assertFails(getDoc(doc(as(ALICE), 'contacts', 'bob-contact')))
    })

    it('rejects listing a connection contacts without the clientId filter', async () => {
      const contacts = collection(as(ALICE), 'contacts')
      await assertSucceeds(
        getDocs(query(contacts, where('clientId', '==', ALICE), where('connectionId', '==', 'alice-conn'))),
      )
      await assertFails(getDocs(query(contacts, where('connectionId', '==', 'bob-conn'))))
    })
  })

  describe('create', () => {
    it('lets a client add a contact to its own connection', async () => {
      await assertSucceeds(addDoc(collection(as(ALICE), 'contacts'), newContact(ALICE, 'alice-conn')))
    })

    it('rejects adding a contact to another client connection', async () => {
      await assertFails(addDoc(collection(as(ALICE), 'contacts'), newContact(ALICE, 'bob-conn')))
    })

    it('rejects a connection that does not exist', async () => {
      await assertFails(addDoc(collection(as(ALICE), 'contacts'), newContact(ALICE, 'missing-conn')))
    })

    it('rejects creating a contact under another clientId', async () => {
      await assertFails(addDoc(collection(as(ALICE), 'contacts'), newContact(BOB, 'bob-conn')))
    })

    it('rejects phones that are not normalized Brazilian E.164', async () => {
      const contacts = collection(as(ALICE), 'contacts')
      for (const phone of ['11999999999', '(11) 99999-9999', '+14155550100', '+55119999']) {
        await assertFails(addDoc(contacts, { ...newContact(ALICE, 'alice-conn'), phone }))
      }
    })
  })

  describe('update', () => {
    it('lets a client edit name and phone', async () => {
      await assertSucceeds(
        updateDoc(doc(as(ALICE), 'contacts', 'alice-contact'), {
          name: 'Ana Souza',
          phone: '+5521988887777',
          updatedAt: serverTimestamp(),
        }),
      )
    })

    it('rejects moving a contact to another connection', async () => {
      await assertFails(
        updateDoc(doc(as(ALICE), 'contacts', 'alice-contact'), {
          connectionId: 'alice-conn-2',
          updatedAt: serverTimestamp(),
        }),
      )
    })

    it('rejects updating another client contact', async () => {
      await assertFails(
        updateDoc(doc(as(ALICE), 'contacts', 'bob-contact'), { name: 'Hacked', updatedAt: serverTimestamp() }),
      )
    })
  })

  it('rejects deletes, which go through a Cloud Function', async () => {
    await assertFails(deleteDoc(doc(as(ALICE), 'contacts', 'alice-contact')))
  })
})
