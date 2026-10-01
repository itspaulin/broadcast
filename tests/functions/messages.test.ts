import type { CreateMessageInput, CreateMessageResult, UpdateMessageInput } from '@broadcast/shared'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  db,
  inHours,
  minutesAgo,
  revisionsOf,
  seedConnection,
  seedContact,
  seedMessage,
  setupFunctionsEnv,
} from './helpers.ts'

const { signUp, anonymous } = setupFunctionsEnv()

type Client = Awaited<ReturnType<typeof signUp>>

const messageOf = async (messageId: string) => (await db.doc(`messages/${messageId}`).get()).data()

describe('createMessage', () => {
  let alice: Client
  let connectionId: string
  let contactIds: string[]

  const create = (client: Pick<Client, 'call'>, overrides: Partial<CreateMessageInput> = {}) =>
    client.call<CreateMessageInput, CreateMessageResult>('createMessage', {
      connectionId,
      contactIds,
      body: 'Promoção de hoje',
      scheduledAt: null,
      ...overrides,
    })

  beforeEach(async () => {
    alice = await signUp()
    connectionId = await seedConnection(alice.clientId)
    contactIds = [await seedContact(alice.clientId, connectionId), await seedContact(alice.clientId, connectionId)]
  })

  it('rejects unauthenticated calls', async () => {
    await expect(create(anonymous())).rejects.toMatchObject({ code: 'functions/unauthenticated' })
  })

  it('sends immediately when no schedule is given', async () => {
    const { messageId } = await create(alice)

    const message = await messageOf(messageId)
    expect(message).toMatchObject({
      clientId: alice.clientId,
      connectionId,
      contactIds,
      status: 'sent',
      scheduledAt: null,
      editedAt: null,
      recipients: { [contactIds[0]]: 'sent', [contactIds[1]]: 'sent' },
    })
    expect(message?.sentAt).not.toBeNull()
  })

  it('schedules for a future time without recipients status', async () => {
    const scheduledAt = inHours(2)
    const { messageId } = await create(alice, { scheduledAt })

    const message = await messageOf(messageId)
    expect(message).toMatchObject({ status: 'scheduled', sentAt: null, recipients: {} })
    expect(message?.scheduledAt.toMillis()).toBe(scheduledAt)
  })

  it('rejects a schedule in the past', async () => {
    await expect(create(alice, { scheduledAt: inHours(-1) })).rejects.toMatchObject({
      code: 'functions/invalid-argument',
    })
  })

  it('rejects an empty message and an empty recipient list', async () => {
    await expect(create(alice, { body: '   ' })).rejects.toMatchObject({ code: 'functions/invalid-argument' })
    await expect(create(alice, { contactIds: [] })).rejects.toMatchObject({ code: 'functions/invalid-argument' })
  })

  it("rejects another client's connection", async () => {
    const bob = await signUp()
    await expect(create(bob)).rejects.toMatchObject({ code: 'functions/not-found' })
  })

  it("rejects another client's contact", async () => {
    const bob = await signUp()
    const bobConnectionId = await seedConnection(bob.clientId)
    const bobContactId = await seedContact(bob.clientId, bobConnectionId)

    await expect(create(alice, { contactIds: [contactIds[0], bobContactId] })).rejects.toMatchObject({
      code: 'functions/failed-precondition',
    })
  })

  it('rejects a contact from another connection of the same client', async () => {
    const otherConnectionId = await seedConnection(alice.clientId)
    const otherContactId = await seedContact(alice.clientId, otherConnectionId)

    await expect(create(alice, { contactIds: [otherContactId] })).rejects.toMatchObject({
      code: 'functions/failed-precondition',
    })
  })
})

describe('updateMessage', () => {
  let alice: Client

  const update = (client: Client, input: UpdateMessageInput) => client.call('updateMessage', input)

  beforeEach(async () => {
    alice = await signUp()
  })

  it('edits text, recipients and time of a scheduled message, keeping the previous version', async () => {
    const connectionId = await seedConnection(alice.clientId)
    const [first, second] = [
      await seedContact(alice.clientId, connectionId),
      await seedContact(alice.clientId, connectionId),
    ]
    const message = await seedMessage(alice.clientId, { connectionId, contactIds: [first] })
    const scheduledAt = inHours(3)

    await update(alice, { messageId: message.id, body: 'Novo texto', contactIds: [first, second], scheduledAt })

    const updated = await messageOf(message.id)
    expect(updated).toMatchObject({
      body: 'Novo texto',
      contactIds: [first, second],
      status: 'scheduled',
      editedAt: null,
    })
    expect(updated?.scheduledAt.toMillis()).toBe(scheduledAt)
    expect(await revisionsOf(message.id)).toMatchObject([
      { clientId: alice.clientId, body: 'Promoção de hoje', contactIds: [first] },
    ])
  })

  it('rejects moving a scheduled message to the past', async () => {
    const message = await seedMessage(alice.clientId)

    await expect(
      update(alice, { messageId: message.id, body: 'Novo texto', scheduledAt: inHours(-1) }),
    ).rejects.toMatchObject({ code: 'functions/invalid-argument' })
  })

  it("rejects adding another client's contact to a scheduled message", async () => {
    const bob = await signUp()
    const bobContactId = await seedContact(bob.clientId, await seedConnection(bob.clientId))
    const message = await seedMessage(alice.clientId)

    await expect(
      update(alice, { messageId: message.id, body: 'Novo texto', contactIds: [bobContactId] }),
    ).rejects.toMatchObject({ code: 'functions/failed-precondition' })
  })

  it('edits only the text of a sent message inside the edit window and marks it as edited', async () => {
    const message = await seedMessage(alice.clientId, { status: 'sent', scheduledAt: null, sentAt: minutesAgo(5) })

    await update(alice, { messageId: message.id, body: 'Texto corrigido' })

    const updated = await messageOf(message.id)
    expect(updated).toMatchObject({ body: 'Texto corrigido', status: 'sent' })
    expect(updated?.editedAt).not.toBeNull()
    expect(await revisionsOf(message.id)).toMatchObject([{ body: 'Promoção de hoje' }])
  })

  it('rejects editing a sent message after the edit window', async () => {
    const message = await seedMessage(alice.clientId, { status: 'sent', scheduledAt: null, sentAt: minutesAgo(16) })

    await expect(update(alice, { messageId: message.id, body: 'Tarde demais' })).rejects.toMatchObject({
      code: 'functions/failed-precondition',
    })
    expect(await messageOf(message.id)).toMatchObject({ body: 'Promoção de hoje', editedAt: null })
  })

  it('rejects changing recipients or time of a sent message', async () => {
    const message = await seedMessage(alice.clientId, { status: 'sent', scheduledAt: null, sentAt: minutesAgo(5) })

    await expect(
      update(alice, { messageId: message.id, body: 'Novo texto', scheduledAt: inHours(1) }),
    ).rejects.toMatchObject({ code: 'functions/invalid-argument' })
  })

  it("rejects editing another client's message", async () => {
    const bob = await signUp()
    const message = await seedMessage(alice.clientId)

    await expect(update(bob, { messageId: message.id, body: 'Invadido' })).rejects.toMatchObject({
      code: 'functions/not-found',
    })
    expect(await messageOf(message.id)).toMatchObject({ body: 'Promoção de hoje' })
    expect(await revisionsOf(message.id)).toEqual([])
  })
})

describe('deleteMessage', () => {
  it('deletes the message and its revisions', async () => {
    const alice = await signUp()
    const message = await seedMessage(alice.clientId)
    await alice.call('updateMessage', { messageId: message.id, body: 'Novo texto' })

    await alice.call('deleteMessage', { messageId: message.id })

    expect(await messageOf(message.id)).toBeUndefined()
    expect(await revisionsOf(message.id)).toEqual([])
  })

  it("rejects deleting another client's message", async () => {
    const [alice, bob] = [await signUp(), await signUp()]
    const message = await seedMessage(alice.clientId)

    await expect(bob.call('deleteMessage', { messageId: message.id })).rejects.toMatchObject({
      code: 'functions/not-found',
    })
    expect(await messageOf(message.id)).toBeDefined()
  })
})
