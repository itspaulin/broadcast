import { z } from 'zod'
import { MESSAGE_BODY_MAX_LENGTH, NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './constants.ts'

const id = z.string({ error: 'Identificador inválido' }).min(1, 'Identificador inválido')

const name = z.string().trim().min(1, 'Informe o nome').max(NAME_MAX_LENGTH)

// Brazilian numbers only: accepts any mask, stores E.164 (+55DDDNUMBER).
const phone = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(
    z.string().regex(/^(55)?\d{10,11}$/, {
      // 8 or 9 digits is a complete local number missing its area code.
      error: (issue) =>
        /^\d{8,9}$/.test(String(issue.input))
          ? 'Falta o DDD. Ex.: (11) 3322-4455'
          : 'Telefone inválido. Use DDD e número, como (11) 98765-4321',
    }),
  )
  .transform((digits) => `+${digits.length >= 12 ? digits : `55${digits}`}`)

const body = z
  .string()
  .trim()
  .min(1, 'Escreva a mensagem')
  .max(MESSAGE_BODY_MAX_LENGTH)

const contactIds = z
  .array(id)
  .min(1, 'Selecione ao menos um contato')
  .transform((ids) => [...new Set(ids)])

const scheduledAt = z.number().int().positive().nullable()

const email = z.string().trim().pipe(z.email('E-mail inválido'))

export const signInInputSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha'),
})

export const signUpInputSchema = z.object({
  name,
  email,
  // Says how to fix it, not just that it is wrong.
  password: z.string().min(PASSWORD_MIN_LENGTH, {
    error: (issue) => {
      const missing = PASSWORD_MIN_LENGTH - String(issue.input ?? '').length
      return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres (${missing === 1 ? 'falta 1' : `faltam ${missing}`}).`
    },
  }),
})

export const connectionInputSchema = z.object({ name })

export const contactInputSchema = z.object({ name, phone })

export const createMessageInputSchema = z.object({
  connectionId: id,
  contactIds,
  body,
  scheduledAt,
})

export const updateMessageInputSchema = z.object({
  messageId: id,
  body,
  contactIds: contactIds.optional(),
  scheduledAt: scheduledAt.optional(),
})

export const deleteMessageInputSchema = z.object({ messageId: id })

export const deleteContactInputSchema = z.object({ contactId: id })

export const deleteConnectionInputSchema = z.object({ connectionId: id })

export type SignInInput = z.infer<typeof signInInputSchema>
export type SignUpInput = z.infer<typeof signUpInputSchema>
export type ConnectionInput = z.infer<typeof connectionInputSchema>
export type ContactInput = z.infer<typeof contactInputSchema>
export type CreateMessageInput = z.infer<typeof createMessageInputSchema>
export type UpdateMessageInput = z.infer<typeof updateMessageInputSchema>
export type DeleteMessageInput = z.infer<typeof deleteMessageInputSchema>
export type DeleteContactInput = z.infer<typeof deleteContactInputSchema>
export type DeleteConnectionInput = z.infer<typeof deleteConnectionInputSchema>

export type DeleteConnectionResult = { contacts: number; messages: number }
export type DeleteContactResult = { updatedMessages: number; deletedMessages: number }
